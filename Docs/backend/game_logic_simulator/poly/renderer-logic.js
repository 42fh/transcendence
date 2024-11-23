const Renderer = {
    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    },

    getScaledPoint(point, config) {
        return {
            x: config.center + point.x * config.scale,
            y: config.center + point.y * config.scale
        };
    },

 renderCollisionIndicator(svg, collision, gameLogic) {
        if (!collision) return;

        const { state, config } = gameLogic;
        const vertices = gameLogic.getPolygonVertices();
        const start = vertices[collision.sideIndex];
        const end = vertices[(collision.sideIndex + 1) % state.sideCount];
        
        // Calculate text position - midpoint of the side, slightly offset outward
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Calculate normal vector for offset
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const normalX = -dy / length;
        const normalY = dx / length;
        
        // Scale and offset the position
        const scaledPos = this.getScaledPoint({
            x: midX + normalX * 0.2,
            y: midY + normalY * 0.2
        }, config);
        
        // Determine text and color based on collision type
        let text, color;
        switch(collision.type) {
            case 'wall':
                text = 'BOUNCE';
                color = 'orange';
                break;
            case 'paddle':
                text = 'BOUNCE';
                color = 'orange';
                break;
            case 'miss':
                if (state.activeSides[collision.sideIndex]) {
                    text = 'MISSED';
                    color = 'red';
                    
                    // Add "POINT!" indicators for other active sides
                    state.activeSides.forEach((isActive, index) => {
                        if (isActive && index !== collision.sideIndex) {
                            const otherVertices = vertices;
                            const otherStart = otherVertices[index];
                            const otherEnd = otherVertices[(index + 1) % state.sideCount];
                            const otherMidX = (otherStart.x + otherEnd.x) / 2;
                            const otherMidY = (otherStart.y + otherEnd.y) / 2;
                            const otherDx = otherEnd.x - otherStart.x;
                            const otherDy = otherEnd.y - otherStart.y;
                            const otherLength = Math.sqrt(otherDx * otherDx + otherDy * otherDy);
                            const otherNormalX = -otherDy / otherLength;
                            const otherNormalY = otherDx / otherLength;
                            
                            const otherPos = this.getScaledPoint({
                                x: otherMidX + otherNormalX * 0.2,
                                y: otherMidY + otherNormalY * 0.2
                            }, config);
                            
                            // Add "POINT!" indicator
                            this.addTextWithBackground(svg, 'POINT!', otherPos, 'green');
                        }
                    });
                }
                break;
        }
        
        if (text) {
            this.addTextWithBackground(svg, text, scaledPos, color);
        }
    },

    addTextWithBackground(svg, text, position, color) {
        // Add background for better visibility
        const bg = this.createSVGElement('rect', {
            x: position.x - 30,
            y: position.y - 10,
            width: 60,
            height: 20,
            fill: 'white',
            opacity: '0.7',
            rx: '5',
            ry: '5'
        });
        svg.appendChild(bg);

        // Add text
        const textElement = this.createSVGElement('text', {
            x: position.x,
            y: position.y + 5,
            'text-anchor': 'middle',
            'font-size': '14px',
            'font-weight': 'bold',
            fill: color
        });
        textElement.textContent = text;
        svg.appendChild(textElement);
    },






    // Generate points string for polygon sides
    getPolygonPoints(gameLogic) {
        const vertices = gameLogic.getPolygonVertices();
        return vertices.map(v => {
            const scaled = this.getScaledPoint(v, gameLogic.config);
            return `${scaled.x},${scaled.y}`;
        }).join(' ');
    },

    // Draw paddle shape for active sides
    generatePaddleShape(sideIndex,isHitZone, gameLogic) {
        const { state, config } = gameLogic;
        const vertices = gameLogic.getPolygonVertices();
        const start = vertices[sideIndex];
        const end = vertices[(sideIndex + 1) % state.sideCount];
        const paddleOffset = state.paddleOffsets[sideIndex];
        
        // Calculate side vector
        const sideX = end.x - start.x;
        const sideY = end.y - start.y;
        const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);
        
        // Normalize vectors
        const normalX = -sideY / sideLength;
        const normalY = sideX / sideLength;
        
        // Calculate paddle dimensions
        const paddleLength = sideLength * state.paddleSize * config.scale;
        const paddleWidth = state.paddleWidth * config.scale;
 	const totalWidth = isHitZone ? 
        (state.paddleWidth + state.ballSize) * config.scale : 
        paddleWidth;
        
        // Get paddle center position
        const center = {
            x: start.x + (end.x - start.x) * paddleOffset,
            y: start.y + (end.y - start.y) * paddleOffset
        };
        const scaledCenter = this.getScaledPoint(center, config);
        
        // Calculate corners
        const normalizedSideX = sideX / sideLength;
        const normalizedSideY = sideY / sideLength;
        
        const points = [];
        
        // Outer corners
        points.push({
            x: scaledCenter.x - (normalizedSideX * paddleLength / 2),
            y: scaledCenter.y - (normalizedSideY * paddleLength / 2)
        });
        points.push({
            x: scaledCenter.x + (normalizedSideX * paddleLength / 2),
            y: scaledCenter.y + (normalizedSideY * paddleLength / 2)
        });
        
        // Inner corners
        points.push({
            x: scaledCenter.x + (normalizedSideX * paddleLength / 2) + normalX * totalWidth,
            y: scaledCenter.y + (normalizedSideY * paddleLength / 2) + normalY * totalWidth
        });
        points.push({
            x: scaledCenter.x - (normalizedSideX * paddleLength / 2) + normalX * totalWidth,
            y: scaledCenter.y - (normalizedSideY * paddleLength / 2) + normalY * totalWidth
        });

        return points.map(p => `${p.x},${p.y}`).join(' ');
    },

    // Render collision info panel
    renderCollisionInfo(gameState) {
        const pointInfo = document.getElementById('pointInfo');
        const { state, collision } = gameState;
        const point = state.point;

        let html = `
            <p>Position: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})</p>
        `;

        if (collision) {
            html += `
                <p>Collision Type: ${collision.type}</p>
                <p>Side: ${collision.sideIndex + 1}</p>
                <p>Distance: ${collision.distance.toFixed(3)}</p>
                <p>Position on side: ${(collision.position * 100).toFixed(1)}%</p>
            `;

            if (collision.type === 'paddle') {
                html += `
                    <p>Paddle Offset: ${collision.normalizedOffset.toFixed(2)}</p>
                    <p>Edge Hit: ${collision.isEdgeHit ? 'Yes' : 'No'}</p>
                `;
            }
        } else {
            html += '<p>No Collision</p>';
        }

        pointInfo.innerHTML = html;
    },

    // Core render function
    render(gameLogic) {
        const gameState = gameLogic.getGameState();
        const { state, config, collision } = gameState;
        const svg = document.getElementById('pongSvg');
        svg.innerHTML = '';

        // Draw sides with different colors for paddles vs walls
        const vertices = gameLogic.getPolygonVertices();
        for (let i = 0; i < state.sideCount; i++) {
            const start = vertices[i];
            const end = vertices[(i + 1) % state.sideCount];
            const scaledStart = this.getScaledPoint(start, config);
            const scaledEnd = this.getScaledPoint(end, config);

            // Draw side line
            svg.appendChild(this.createSVGElement('line', {
                x1: scaledStart.x,
                y1: scaledStart.y,
                x2: scaledEnd.x,
                y2: scaledEnd.y,
                stroke: state.activeSides[i] ? 'blue' : 'gray',
                'stroke-width': '2'
            }));

            // For active sides, draw paddles
            if (state.activeSides[i]) {
  		// Draw hit zone first (underneath)
    		svg.appendChild(this.createSVGElement('polygon', {
        	points: this.generatePaddleShape(i, true, gameLogic),
        	fill: collision?.sideIndex === i ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
        	stroke: collision?.sideIndex === i ? 'red' : 'green',
        	'stroke-width': '1'
    		}));
                // Draw paddle
                svg.appendChild(this.createSVGElement('polygon', {
                    points: this.generatePaddleShape(i,false ,gameLogic),
                    fill: collision?.sideIndex === i ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                    stroke: collision?.sideIndex === i ? 'red' : 'blue',
                    'stroke-width': '1'
                }));
            }
        }

        // Draw ball
        const scaledPoint = this.getScaledPoint(state.point, config);
        svg.appendChild(this.createSVGElement('circle', {
            cx: scaledPoint.x,
            cy: scaledPoint.y,
            r: config.scale * state.ballSize,
            fill: collision ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,0,0.5)',
            stroke: 'black',
            'stroke-width': '1'
        }));

        // If there's a collision, draw collision point
        if (collision) {
            const scaledCollision = this.getScaledPoint(collision.projection, config);
            svg.appendChild(this.createSVGElement('circle', {
                cx: scaledCollision.x,
                cy: scaledCollision.y,
                r: '4',
                fill: collision.type === 'paddle' ? 'green': 
		      collision.type === 'wall' ? 'orange' : 'red',
                stroke: 'white',
                'stroke-width': '1'
            }));
        }
 this.renderCollisionIndicator(svg, collision, gameLogic);
        // Update info display
        this.renderCollisionInfo(gameState);
    }
};
