// Base renderer with shared functionality
// Add to BasePongRenderer class

class BasePongRenderer {
    constructor(config = {
        viewboxSize: 300,
        scale: 75,
        center: 150
    }) {
        this.config = config;
        this.svg = null;
        this.scoreList = null;
        this.playerIndex = null;
        this.state = null;
        this.errorLog = null;
        this.errorHistory = [];
        this.maxErrorLogSize = 5;
    }

    initialize(gameState) {
        this.svg = document.getElementById('pongSvg');
        this.scoreList = document.getElementById('scoreDisplay');
        this.initializeErrorLog();
        
        if (!this.svg) {
            throw new Error('SVG element not found');
        }
        this.update(gameState);
    }
    
   initializeErrorLog() {
        if (!this.errorLog) {
            this.errorLog = document.createElement('div');
            this.errorLog.className = 'error-log';
            this.errorLog.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 300px;
                background-color: rgba(0, 0, 0, 0.8);
                border: 1px solid #444;
                border-radius: 4px;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                color: white;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                font-weight: bold;
                padding-bottom: 5px;
                margin-bottom: 5px;
                border-bottom: 1px solid #444;
            `;
            header.textContent = 'Error Log';
            this.errorLog.appendChild(header);

            document.body.appendChild(this.errorLog);
        }
    }

showError(errorEvent) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Create error entry with all fields
    const errorEntry = document.createElement('div');
    errorEntry.style.cssText = `
        margin-bottom: 5px;
        padding: 5px;
        border-left: 3px solid #ff6b6b;
        background-color: rgba(255, 255, 255, 0.1);
    `;

    // Create timestamp header
    const timestampDiv = document.createElement('div');
    timestampDiv.style.color = '#888';
    timestampDiv.textContent = timestamp;
    errorEntry.appendChild(timestampDiv);

    // Add all error fields
    Object.entries(errorEvent).forEach(([key, value]) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.style.cssText = `
            margin-top: 3px;
            padding-left: 10px;
        `;
        fieldDiv.textContent = `${key}: ${value}`;
        errorEntry.appendChild(fieldDiv);
    });

    // Add to error log
    if (this.errorLog) {
        // Insert at the top
        if (this.errorLog.children.length > 1) {
            this.errorLog.insertBefore(errorEntry, this.errorLog.children[1]);
        } else {
            this.errorLog.appendChild(errorEntry);
        }

        // Keep only the last 5 errors (plus header)
        while (this.errorLog.children.length > 6) {
            this.errorLog.removeChild(this.errorLog.lastChild);
        }
    }

    // Also show error on canvas
    this.showErrorOnCanvas(errorEvent);
}

showErrorOnCanvas(errorEvent) {
    // Remove any existing error messages
    const existingErrors = this.svg.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Convert error object to multi-line string
    const errorText = Object.entries(errorEvent)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

    // Create error message container group
    const errorGroup = this.createSVGElement('g', {
        class: 'error-message',
        transform: `translate(${this.config.center}, ${this.config.viewboxSize - 60})`
    });

    // Add semi-transparent background
    const background = this.createSVGElement('rect', {
        x: -140,
        y: -10,
        width: 280,
        height: (Object.keys(errorEvent).length * 20) + 20,
        fill: 'rgba(0, 0, 0, 0.7)',
        rx: 5,
        ry: 5
    });
    errorGroup.appendChild(background);

    // Add each error field as separate text line
    Object.entries(errorEvent).forEach(([key, value], index) => {
        const textElement = this.createSVGElement('text', {
            x: 0,
            y: index * 20,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '14px',
            fill: '#ff6b6b'
        });
        textElement.textContent = `${key}: ${value}`;
        errorGroup.appendChild(textElement);
    });

    // Add to SVG
    this.svg.appendChild(errorGroup);

    // Remove after 5 seconds
    setTimeout(() => {
        errorGroup.remove();
    }, 5000);
}  

    update(gameState) {
        this.state = gameState;
        this.render();
    }

    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    renderScores() {
        if (!this.scoreList || !this.state.scores) return;
        
        this.scoreList.innerHTML = '<h3>Scores</h3>';
        this.state.scores.forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            if (index === this.playerIndex) {
                scoreItem.classList.add('current-player');
            }
            scoreItem.innerHTML = `Player ${index + 1}: ${score}`;
            this.scoreList.appendChild(scoreItem);
        });
    }

    renderBalls() {
        this.state.balls.forEach(ball => {
            const ballX = this.config.center + ball.x * this.config.scale;
            const ballY = this.config.center + ball.y * this.config.scale;
            
            this.svg.appendChild(this.createSVGElement('circle', {
                cx: ballX,
                cy: ballY,
                r: ball.size * this.config.scale,
                fill: 'yellow',
                stroke: 'black',
                'stroke-width': '1'
            }));
        });
    }

    showGameOver(isWinner) {
        const message = isWinner ? 'YOU WIN!' : 'GAME OVER';
        const textElement = this.createSVGElement('text', {
            x: this.config.center,
            y: this.config.center,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '24px',
            'font-weight': 'bold',
            fill: isWinner ? 'green' : 'red'
        });
        textElement.textContent = message;
        this.svg.appendChild(textElement);
    }

    render() {
        throw new Error("Method 'render' must be implemented");
    }
}

export class CircularRenderer extends BasePongRenderer {
    render() {
        if (!this.state || !this.svg) return;
        
        this.svg.innerHTML = '';
        
        // Draw main circle
        this.svg.appendChild(this.createSVGElement('circle', {
            cx: this.config.center,
            cy: this.config.center,
            r: this.config.scale,
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1'
        }));

        this.state.paddles.forEach(paddle => {
            if (!paddle.active) return;

            const angle = (paddle.side_index * 2 * Math.PI / this.state.paddles.length) + 
                         (paddle.position * 2 * Math.PI);
            
            const paddleLength = this.state.dimensions.paddle_length * 
                (2 * Math.PI / this.state.paddles.length);
            const startAngle = angle - paddleLength / 2;
            const endAngle = angle + paddleLength / 2;
            
            // Draw hit zone first (includes ball size in width)
            const hitZoneWidth = (this.state.dimensions.paddle_width + 
                this.state.dimensions.ball_size * 2) * this.config.scale;
            
            const hitZoneArc = this.createPaddleArc(
                this.config.center,
                this.config.center,
                this.config.scale,
                startAngle,
                endAngle,
                hitZoneWidth
            );
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: hitZoneArc,
                fill: paddle.side_index === this.state.collision?.sideIndex ? 
                    'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                stroke: paddle.side_index === this.state.collision?.sideIndex ? 
                    'red' : 'green',
                'stroke-width': '1'
            }));
            
            // Draw actual paddle
            const paddleArc = this.createPaddleArc(
                this.config.center,
                this.config.center,
                this.config.scale,
                startAngle,
                endAngle,
                this.state.dimensions.paddle_width * this.config.scale
            );
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: paddleArc,
                fill: paddle.side_index === this.state.collision?.sideIndex ? 
                    'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                stroke: paddle.side_index === this.state.collision?.sideIndex ? 
                    'red' : 'blue',
                'stroke-width': '1'
            }));
        });

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
}
export class PolygonRenderer extends BasePongRenderer {
    render() {
        if (!this.state || !this.svg) return;
        
        this.svg.innerHTML = '';
        
        const paddleCount = this.state.paddles.length;

        // First draw the polygon sides
        for (let i = 0; i < paddleCount; i++) {
            const startAngle = (i * 2 * Math.PI) / paddleCount - Math.PI / 2;
            const endAngle = ((i + 1) * 2 * Math.PI) / paddleCount - Math.PI / 2;
            
            const start = {
                x: this.config.center + this.config.scale * Math.cos(startAngle),
                y: this.config.center + this.config.scale * Math.sin(startAngle)
            };
            
            const end = {
                x: this.config.center + this.config.scale * Math.cos(endAngle),
                y: this.config.center + this.config.scale * Math.sin(endAngle)
            };

            const paddle = this.state.paddles.find(p => p.side_index === i);

            // Draw the line in blue if there's an active paddle, gray otherwise
            this.svg.appendChild(this.createSVGElement('line', {
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                stroke: paddle?.active ? '#0000FF' : '#808080',
                'stroke-width': '2'
            }));

            // Draw paddle and hit zone if side is active
            if (paddle?.active) {
                const sideX = end.x - start.x;
                const sideY = end.y - start.y;
                const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);
                
                const normalizedSideX = sideX / sideLength;
                const normalizedSideY = sideY / sideLength;
                const normalX = -sideY / sideLength;
                const normalY = sideX / sideLength;
                
                const paddleX = start.x + (end.x - start.x) * paddle.position;
                const paddleY = start.y + (end.y - start.y) * paddle.position;
                
                const paddleLength = this.state.dimensions.paddle_length * sideLength;
                const paddleWidth = this.state.dimensions.paddle_width * this.config.scale;
                const hitZoneWidth = (this.state.dimensions.paddle_width + 
                    (this.state.balls[0].size )) * this.config.scale;

                // Draw hit zone with green overlay
                const hitZonePoints = [
                    `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`,
                    `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`
                ].join(' ');
		// First let's check the basic vectors and lengths


                // First draw the green hit zone area
                this.svg.appendChild(this.createSVGElement('polygon', {
                    points: hitZonePoints,
                    fill: 'rgba(0,255,0,0.3)', // Very light green
                    stroke: 'none'
                }));
		
                // Then draw the inner blue paddle
                const paddlePoints = [
                    `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`,
                    `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('polygon', {
                    points: paddlePoints,
                    fill: 'rgba(0,0,255,0.6)', // Semi-transparent blue
                    stroke: 'none'
                }));
            }
        }

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
}
