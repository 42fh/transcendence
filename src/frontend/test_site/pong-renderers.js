// Base renderer with shared functionality
// Add to BasePongRenderer class

/*class BasePongRenderer {
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
        this.maxErrorLogSize = 5; // Number of errors to display
    }
*/
/*
    initializeErrorLog() {
        // Create error log container if it doesn't exist
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

            // Add header
            const header = document.createElement('div');
            header.style.cssText = `
                font-weight: bold;
                padding-bottom: 5px;
                margin-bottom: 5px;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            header.innerHTML = '<span>Error Log</span>';

            // Add clear button
            const clearButton = document.createElement('button');
            clearButton.textContent = 'Clear';
            clearButton.style.cssText = `
                background: #333;
                border: 1px solid #555;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
            `;
            clearButton.onclick = () => this.clearErrorLog();
            header.appendChild(clearButton);

            this.errorLog.appendChild(header);

            // Add error container
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            this.errorLog.appendChild(errorContainer);

            // Add to document
            document.body.appendChild(this.errorLog);
        }
    }

    showError({ message, type, severity }) {
        const timestamp = new Date().toLocaleTimeString();
        const error = {
            message,
            type,
            severity,
            timestamp
        };

        // Add to error history
        this.errorHistory.unshift(error);
        if (this.errorHistory.length > this.maxErrorLogSize) {
            this.errorHistory.pop();
        }

        // Update error log display
        this.updateErrorLogDisplay();

        // Also show the error on the game canvas
        this.showErrorOnCanvas(error);
    }

    updateErrorLogDisplay() {
        const errorContainer = this.errorLog.querySelector('.error-container');
        errorContainer.innerHTML = '';

        this.errorHistory.forEach(error => {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-entry';
            errorElement.style.cssText = `
                margin-bottom: 5px;
                padding: 5px;
                border-left: 3px solid ${this.getErrorColor(error.severity)};
                background-color: rgba(255, 255, 255, 0.1);
            `;

            errorElement.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${this.getErrorColor(error.severity)};">
                        [${error.type}] ${error.severity}
                    </span>
                    <span style="color: #888;">${error.timestamp}</span>
                </div>
                <div style="margin-top: 3px;">${error.message}</div>
            `;

            errorContainer.appendChild(errorElement);
        });
    }

    showErrorOnCanvas(error) {
        // Clear any existing error displays on the canvas
        const existingErrors = this.svg.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        // Create error message element
        const errorElement = this.createSVGElement('text', {
            x: this.config.center,
            y: this.config.viewboxSize - 20,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '14px',
            fill: this.getErrorColor(error.severity),
            class: 'error-message'
        });
        errorElement.textContent = error.message;

        // Add error message to SVG
        this.svg.appendChild(errorElement);

        // Auto-remove non-fatal errors after 5 seconds
        if (error.severity !== 'fatal') {
            setTimeout(() => {
                errorElement.remove();
            }, 5000);
        }
    }

    clearErrorLog() {
        this.errorHistory = [];
        this.updateErrorLogDisplay();
    }

    getErrorColor(severity) {
        switch (severity) {
            case 'fatal':
                return '#ff0000';
            case 'error':
                return '#ff6b6b';
            case 'warning':
                return '#ffd93d';
            case 'info':
                return '#4dabf7';
            default:
                return '#ffffff';
        }
    }
*/
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
/*
// Polygon Pong Renderer
export class PolygonRenderer extends BasePongRenderer {
    render() {
        if (!this.state || !this.svg) return;
        
        this.svg.innerHTML = '';
        
        // Draw polygon sides and paddles
        const paddleCount = this.state.paddles.length;
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

            // Draw side
            this.svg.appendChild(this.createSVGElement('line', {
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                stroke: paddle?.active ? 'blue' : 'gray',
                'stroke-width': '2'
            }));

            // Draw paddle if side is active
            if (paddle?.active) {
                const paddleX = start.x + (end.x - start.x) * paddle.position;
                const paddleY = start.y + (end.y - start.y) * paddle.position;
                
                // Draw paddle width indicator
                const paddleLength = this.state.dimensions.paddle_length * 
                    Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                const paddleHalfLength = paddleLength / 2;
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                
                this.svg.appendChild(this.createSVGElement('line', {
                    x1: paddleX - Math.cos(angle) * paddleHalfLength,
                    y1: paddleY - Math.sin(angle) * paddleHalfLength,
                    x2: paddleX + Math.cos(angle) * paddleHalfLength,
                    y2: paddleY + Math.sin(angle) * paddleHalfLength,
                    stroke: i === this.playerIndex ? 'green' : 'blue',
                    'stroke-width': this.state.dimensions.paddle_width * this.config.scale
                }));
            }
        }

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
}

// Circular Pong Renderer
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

        // Draw paddles
        this.state.paddles.forEach(paddle => {
            if (!paddle.active) return;

            const angle = (paddle.side_index * 2 * Math.PI / this.state.paddles.length) + 
                         (paddle.position * 2 * Math.PI);
            
            // Draw paddle arc
            const paddleLength = this.state.dimensions.paddle_length * (2 * Math.PI / this.state.paddles.length);
            const startAngle = angle - paddleLength / 2;
            const endAngle = angle + paddleLength / 2;
            
            const arcPath = this.createPaddleArc(
                this.config.center,
                this.config.center,
                this.config.scale,
                startAngle,
                endAngle,
                this.state.dimensions.paddle_width * this.config.scale
            );
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: arcPath,
                fill: paddle.side_index === this.playerIndex ? 'green' : 'blue',
                stroke: 'none'
            }));
        });

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }

    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        const outerRadius = radius;
        
        const startOuter = {
            x: cx + outerRadius * Math.cos(startAngle),
            y: cy + outerRadius * Math.sin(startAngle)
        };
        const endOuter = {
            x: cx + outerRadius * Math.cos(endAngle),
            y: cy + outerRadius * Math.sin(endAngle)
        };
        const startInner = {
            x: cx + innerRadius * Math.cos(endAngle),
            y: cy + innerRadius * Math.sin(endAngle)
        };
        const endInner = {
            x: cx + innerRadius * Math.cos(startAngle),
            y: cy + innerRadius * Math.sin(startAngle)
        };
        
        const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
        
        return `M ${startOuter.x} ${startOuter.y}
                A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
                L ${startInner.x} ${startInner.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}
                Z`;
    }
}*/
/*// Polygon Pong Renderer
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
                const paddleX = start.x + (end.x - start.x) * paddle.position;
                const paddleY = start.y + (end.y - start.y) * paddle.position;
                
                const paddleLength = this.state.dimensions.paddle_length * 
                    Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                const paddleHalfLength = paddleLength / 2;
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                
                // Determine the offset to position paddle outside the polygon
                const offsetMultiplier = 1.05; // Adjust this value to move paddles further out
                const offsetX = (end.x - start.x) * (offsetMultiplier - 1);
                const offsetY = (end.y - start.y) * (offsetMultiplier - 1);
                
                const adjustedPaddleX = paddleX + offsetX;
                const adjustedPaddleY = paddleY + offsetY;
                
                const width = this.state.dimensions.paddle_width * this.config.scale * 0.3;
                const hitZoneWidth = (this.state.dimensions.paddle_width + this.state.dimensions.ball_size * 2) * this.config.scale * 0.3;
                
                // Draw hit zone first (larger semi-transparent rectangle)
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const halfHitZoneWidth = hitZoneWidth / 2;
                
                const hitZonePath = [
                    `M ${adjustedPaddleX - cos * paddleHalfLength - sin * halfHitZoneWidth} ${adjustedPaddleY - sin * paddleHalfLength + cos * halfHitZoneWidth}`,
                    `L ${adjustedPaddleX + cos * paddleHalfLength - sin * halfHitZoneWidth} ${adjustedPaddleY + sin * paddleHalfLength + cos * halfHitZoneWidth}`,
                    `L ${adjustedPaddleX + cos * paddleHalfLength + sin * halfHitZoneWidth} ${adjustedPaddleY + sin * paddleHalfLength - cos * halfHitZoneWidth}`,
                    `L ${adjustedPaddleX - cos * paddleHalfLength + sin * halfHitZoneWidth} ${adjustedPaddleY - sin * paddleHalfLength - cos * halfHitZoneWidth}`,
                    'Z'
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('path', {
                    d: hitZonePath,
                    fill: 'rgba(255, 255, 0, 10)', // Semi-transparent red
                    stroke: 'none'
                }));

                // Draw actual paddle (smaller solid rectangle)
                const halfWidth = width / 2;
                const paddlePath = [
                    `M ${adjustedPaddleX - cos * paddleHalfLength - sin * halfWidth} ${adjustedPaddleY - sin * paddleHalfLength + cos * halfWidth}`,
                    `L ${adjustedPaddleX + cos * paddleHalfLength - sin * halfWidth} ${adjustedPaddleY + sin * paddleHalfLength + cos * halfWidth}`,
                    `L ${adjustedPaddleX + cos * paddleHalfLength + sin * halfWidth} ${adjustedPaddleY + sin * paddleHalfLength - cos * halfWidth}`,
                    `L ${adjustedPaddleX - cos * paddleHalfLength + sin * halfWidth} ${adjustedPaddleY - sin * paddleHalfLength - cos * halfWidth}`,
                    'Z'
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('path', {
                    d: paddlePath,
                    fill: paddle.side_index === this.playerIndex ? '#00FF00' : '#FF0000',
                    stroke: 'none'
                }));
            }
        }

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
}*//*
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
                
                // Normalize vectors
                const normalX = -sideY / sideLength;
                const normalY = sideX / sideLength;
                
                // Calculate paddle center
                const paddleX = start.x + (end.x - start.x) * paddle.position;
                const paddleY = start.y + (end.y - start.y) * paddle.position;
                
                // Calculate paddle dimensions
                const paddleLength = this.state.dimensions.paddle_length * sideLength;
                const paddleWidth = this.state.dimensions.paddle_width * this.config.scale;
                const hitZoneWidth = (this.state.dimensions.paddle_width + this.state.dimensions.ball_size * 2) * this.config.scale;
                
                // Calculate normalized side vector
                const normalizedSideX = sideX / sideLength;
                const normalizedSideY = sideY / sideLength;
                
                // Draw hit zone first
                const hitZonePoints = [
                    // Bottom left
                    `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
                    // Bottom right
                    `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
                    // Top right
                    `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`,
                    // Top left
                    `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('polygon', {
                    points: hitZonePoints,
                    fill: 'rgba(255, 0, 0, 0.2)',
                    stroke: 'none'
                }));

                // Draw actual paddle
                const paddlePoints = [
                    // Bottom left
                    `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
                    // Bottom right
                    `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
                    // Top right
                    `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`,
                    // Top left
                    `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('polygon', {
                    points: paddlePoints,
                    fill: paddle.side_index === this.playerIndex ? '#00FF00' : '#FF0000',
                    stroke: 'none'
                }));
            }
        }

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
}

// Circular Pong Renderer
export class CircularRenderer extends BasePongRenderer {
    render() {
        if (!this.state || !this.svg) return;
        
        this.svg.innerHTML = '';
        
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
            
            const paddleLength = this.state.dimensions.paddle_length * (2 * Math.PI / this.state.paddles.length);
            const startAngle = angle - paddleLength / 2;
            const endAngle = angle + paddleLength / 2;
            
            // Draw hit zone first
            const hitZoneArc = this.createPaddleArc(
                this.config.center,
                this.config.center,
                this.config.scale,
                startAngle,
                endAngle,
                (this.state.dimensions.paddle_width + this.state.dimensions.ball_size) * this.config.scale
            );
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: hitZoneArc,
                fill: 'rgba(255, 255, 0, 0.2)',
                stroke: 'none'
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
                fill: paddle.side_index === this.playerIndex ? 'green' : 'blue',
                stroke: 'none'
            }));
        });

        this.renderBalls();
        this.renderScores();
    }
}
*/
/*export class PolygonRenderer extends BasePongRenderer {
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
                // Calculate side vector
                const sideX = end.x - start.x;
                const sideY = end.y - start.y;
                const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);
                
                // Calculate paddle center
                const paddleX = start.x + (end.x - start.x) * paddle.position;
                const paddleY = start.y + (end.y - start.y) * paddle.position;
                
                // Normalize vectors
                const normalizedSideX = sideX / sideLength;
                const normalizedSideY = sideY / sideLength;
                const normalX = -sideY / sideLength;
                const normalY = sideX / sideLength;
                
                // Calculate paddle dimensions
                const paddleLength = this.state.dimensions.paddle_length * sideLength;
                const paddleWidth = this.state.dimensions.paddle_width * this.config.scale;
                const totalWidth = (this.state.dimensions.paddle_width + 
                    (this.state.dimensions.ball_size * 2)) * this.config.scale;

                // Draw hit zone first (wider, semi-transparent)
                const hitZonePoints = [
                    // Start with inner points (along the polygon side)
                    `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
                    // Then outer points
                    `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * totalWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * totalWidth}`,
                    `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * totalWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * totalWidth}`
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('polygon', {
                    points: hitZonePoints,
                    fill: paddle.side_index === this.state.collision?.sideIndex ? 
                        'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                    stroke: paddle.side_index === this.state.collision?.sideIndex ? 
                        'red' : 'green',
                    'stroke-width': '1'
                }));

                // Draw actual paddle (thinner, more opaque)
                const paddlePoints = [
                    `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
                    `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`,
                    `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`
                ].join(' ');

                this.svg.appendChild(this.createSVGElement('polygon', {
                    points: paddlePoints,
                    fill: paddle.side_index === this.state.collision?.sideIndex ? 
                        'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                    stroke: paddle.side_index === this.state.collision?.sideIndex ? 
                        'red' : 'blue',
                    'stroke-width': '1'
                }));
            }
        }

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
}

// Update CircularRenderer with similar hit zone logic
*/export class CircularRenderer extends BasePongRenderer {
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
                
console.log(this.state);
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
console.log('Side vector:', {sideX, sideY, sideLength});
console.log('Normal vectors:', {
    normalizedSideX, 
    normalizedSideY, 
    normalX, 
    normalY
});

// Check the paddle position and dimensions
console.log('Paddle position:', {paddleX, paddleY});
console.log('Dimensions:', {
    paddleLength,
    paddleWidth,
    hitZoneWidth
});

// And finally check the actual points being generated
console.log('Hit zone points:', hitZonePoints);
console.log('State dimensions:', this.state.dimensions);
console.log('Config:', this.config);
console.log(this.state);

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
