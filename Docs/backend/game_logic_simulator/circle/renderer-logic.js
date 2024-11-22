// renderer.js

const Renderer = {
    // SVG creation utility
    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    },

    // Geometry utilities
    getPointOnCircle(angleInDegrees, radius = 1, config) {
        const angleInRadians = angleInDegrees * (Math.PI / 180);
        return {
            x: config.center + config.scale * radius * Math.cos(angleInRadians),
            y: config.center - config.scale * radius * Math.sin(angleInRadians)
        };
    },

    generatePaddleShape(centerAngle, isHitZone, state, config) {
        const sectorSize = 360 / state.sectorCount;
        const actualPaddleSize = sectorSize * state.paddleSize;
        const angularHitZone = isHitZone ? state.ballSize * 180 / Math.PI * 0.5 : 0;
        const halfSize = actualPaddleSize / 2;
        
        const startAngle = centerAngle - halfSize - angularHitZone;
        const endAngle = centerAngle + halfSize + angularHitZone;
        
        const outer = 1.0;
        const inner = isHitZone ? 
            1.0 - state.paddleWidth - state.ballSize :
            1.0 - state.paddleWidth;

        const points = [];
        for (let degree = Math.round(startAngle); degree <= Math.round(endAngle); degree++) {
            const pt = this.getPointOnCircle(degree, outer, config);
            points.push(`${pt.x},${pt.y}`);
        }
        for (let degree = Math.round(endAngle); degree >= Math.round(startAngle); degree--) {
            const pt = this.getPointOnCircle(degree, inner, config);
            points.push(`${pt.x},${pt.y}`);
        }
        return points.join(' ');
    },

    // Info display
    renderPointInfo(state, distance, angle, hitInfo) {
        const pointInfo = document.getElementById('pointInfo');
        let html = `
            <p>Actual Position: (${state.point.x.toFixed(2)}, ${state.point.y.toFixed(2)})</p>
            <p>Distance from center: ${distance.toFixed(2)}</p>
            <p>Angle: ${angle.toFixed(1)}°</p>
        `;

        if (hitInfo) {
            const paddleIndex = hitInfo.paddleNumber - 1;
            const sectorSize = 360 / state.sectorCount;
            const offsetAngle = state.paddleOffsets[paddleIndex] * 360;
            html += `
                <p>Hit Paddle: ${hitInfo.paddleNumber}</p>
                <p>Paddle Base Angle: ${(sectorSize * paddleIndex).toFixed(1)}°</p>
                <p>Paddle Offset: ${state.paddleOffsets[paddleIndex].toFixed(2)} (${offsetAngle.toFixed(1)}°)</p>
                <p>Final Paddle Position: ${(sectorSize * paddleIndex + offsetAngle).toFixed(1)}°</p>
                <p>Angular offset: ${hitInfo.offset.toFixed(1)}°</p>
                <p>Normalized offset: ${hitInfo.normalizedOffset.toFixed(2)}
                   ${hitInfo.isEdgeHit ? " (edge hit)" : ""}</p>
                <p>Radial position: ${hitInfo.radialPosition.toFixed(2)} (0-1)</p>
                <p>Ball radius: ${state.ballSize.toFixed(2)}</p>
                <p>Edge hit zone: ${hitInfo.angularHitZone.toFixed(1)}°</p>
            `;
        } else {
            html += '<p>Status: Miss</p>';
        }

        pointInfo.innerHTML = html;
    },

    // Core rendering function
    render(gameLogic) {
        const gameData = gameLogic.getGameState();
        const { distance, angle, hitInfo, state, config } = gameData;
        const svg = document.getElementById('pongSvg');
        svg.innerHTML = '';

        // Render circles
        this.renderCircles(svg, state, config);
        
        // Render ball
        this.renderBall(svg, state, config);
        
        // Render paddles
        this.renderPaddles(svg, gameLogic, hitInfo, state, config);
        
        // Render trajectory line
        this.renderTrajectory(svg, state, config);
        
        // Render point marker
        this.renderPointMarker(svg, state, config);
        
        // Render scores if needed
        if (distance > 1.0) {
            this.renderScoreIndicators(svg, angle, state, gameLogic, config);
        }

        // Update info display
        this.renderPointInfo(state, distance, angle, hitInfo);
    },

    // Individual rendering components
    renderCircles(svg, state, config) {
        // Outer circle
        svg.appendChild(this.createSVGElement('circle', {
            cx: config.center,
            cy: config.center,
            r: config.scale,
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1'
        }));

        // Inner gameplay circles
        svg.appendChild(this.createSVGElement('circle', {
            cx: config.center,
            cy: config.center,
            r: config.scale * (1 - state.paddleWidth),
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        svg.appendChild(this.createSVGElement('circle', {
            cx: config.center,
            cy: config.center,
            r: config.scale * (1 - state.paddleWidth - state.ballSize),
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1',
            'stroke-dasharray': '2'
        }));
    },

    renderBall(svg, state, config) {
        svg.appendChild(this.createSVGElement('circle', {
            cx: config.center + state.point.x * config.scale,
            cy: config.center - state.point.y * config.scale,
            r: config.scale * state.ballSize,
            fill: 'rgba(255, 255, 0, 0.2)',
            stroke: 'black',
            'stroke-width': '1',
            'stroke-dasharray': '2'
        }));
    },

    renderPaddles(svg, gameLogic, hitInfo, state, config) {
        gameLogic.generatePaddleCenters().forEach((centerAngle, i) => {
            const isHit = hitInfo?.paddleNumber === i + 1;

            // Hit zone
            svg.appendChild(this.createSVGElement('polygon', {
                points: this.generatePaddleShape(centerAngle, true, state, config),
                fill: isHit ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,255,0.1)',
                stroke: isHit ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                'stroke-width': '1',
                'stroke-dasharray': '4'
            }));

            // Base paddle
            svg.appendChild(this.createSVGElement('polygon', {
                points: this.generatePaddleShape(centerAngle, false, state, config),
                fill: isHit ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                stroke: isHit ? 'red' : 'blue',
                'stroke-width': '1'
            }));
        });
    },

    renderTrajectory(svg, state, config) {
        svg.appendChild(this.createSVGElement('line', {
            x1: config.center,
            y1: config.center,
            x2: config.center + state.point.x * config.scale,
            y2: config.center - state.point.y * config.scale,
            stroke: 'gray',
            'stroke-width': '1'
        }));
    },

    renderPointMarker(svg, state, config) {
        svg.appendChild(this.createSVGElement('circle', {
            cx: config.center + state.point.x * config.scale,
            cy: config.center - state.point.y * config.scale,
            r: '3',
            fill: 'yellow',
            stroke: 'black',
            'stroke-width': '1'
        }));
    },
    determineResponsiblePaddle(angle, state, gameLogic) {
        if (state.constrainToSector) {
            // Original sector-based logic
            const sectorSize = 360 / state.sectorCount;
            const shiftedAngle = (angle + (sectorSize/2)) % 360;
            return Math.floor(shiftedAngle / sectorSize);
        } else {
            // Use the same nearest paddle logic as game logic
            return gameLogic.findNearestPaddle(angle);
        }
    },
    
    renderScoreIndicators(svg, angle, state, gameLogic, config) {
        const responsiblePaddleIndex = this.determineResponsiblePaddle(angle, state, gameLogic);
	// Create a semi-transparent background for score indicators
        gameLogic.generatePaddleCenters().forEach((centerAngle, i) => {
            const textPoint = this.getPointOnCircle(centerAngle, 1.1, config);
            
            // Add background circle for better visibility
            const bgCircle = this.createSVGElement('circle', {
                cx: textPoint.x,
                cy: textPoint.y,
                r: '15',
                fill: i === responsiblePaddleIndex ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                stroke: 'none'
            });
            svg.appendChild(bgCircle);

            // Add the paddle number label
            const paddleLabel = this.createSVGElement('text', {
                x: textPoint.x,
                y: textPoint.y - 10,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                fill: 'black',
                'font-size': '10px'
            });
            paddleLabel.textContent = `P${i + 1}`;
            svg.appendChild(paddleLabel);

            // Add the missed/point indicator
            const scoreText = this.createSVGElement('text', {
                x: textPoint.x,
                y: textPoint.y + 10,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                fill: i === responsiblePaddleIndex ? 'red' : 'green',
                'font-size': '12px',
                'font-weight': 'bold'
            });
            scoreText.textContent = i === responsiblePaddleIndex ? 'MISSED' : 'POINT!';
            svg.appendChild(scoreText);
        });
    },
};


