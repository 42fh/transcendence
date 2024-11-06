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
    constructor(config) {
        super(config);
        this.playerIndex = null;
    }

    generatePaddleCenters() {
        const centers = [];
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;

        this.state.paddles.forEach((paddle, index) => {
            if (!paddle.active) return;

            // Calculate base sector angle
            const baseSectorAngle = paddle.side_index * sectorSize;
            
            // Calculate maximum allowed offset within sector
            const paddleLength = this.state.dimensions.paddle_length * sectorSize;
            const hitZoneAngle = this.state.dimensions.ball_size || 0.1; // Default if not provided
            const totalAngleNeeded = paddleLength + (hitZoneAngle * 2);
            
            let maxOffset = 0;
            if (totalAngleNeeded < sectorSize) {
                maxOffset = (sectorSize - totalAngleNeeded) / 2;
            }

            // Calculate final angle with constrained offset
            const offsetAngle = (paddle.position - 0.5) * 2 * maxOffset;
            let finalAngle = baseSectorAngle + offsetAngle;

            // Normalize angle to positive range
            while (finalAngle < 0) finalAngle += 2 * Math.PI;
            while (finalAngle >= 2 * Math.PI) finalAngle -= 2 * Math.PI;

            centers.push({
                angle: finalAngle,
                paddle: paddle,
                index: index
            });
        });

        return centers;
    }

    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        
        // Calculate points
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);

        const largeArcFlagOuter = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        const largeArcFlagInner = largeArcFlagOuter;

        return `M ${x1} ${y1} ` +
               `A ${radius} ${radius} 0 ${largeArcFlagOuter} 1 ${x2} ${y2} ` +
               `L ${x3} ${y3} ` +
               `A ${innerRadius} ${innerRadius} 0 ${largeArcFlagInner} 0 ${x4} ${y4} ` +
               'Z';
    }

    render() {
        if (!this.state || !this.svg) return;
        
        this.svg.innerHTML = '';
        
        // Draw boundary circle
        this.svg.appendChild(this.createSVGElement('circle', {
            cx: this.config.center,
            cy: this.config.center,
            r: this.config.scale,
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1'
        }));

        // Draw inner circles for visual reference
        this.svg.appendChild(this.createSVGElement('circle', {
            cx: this.config.center,
            cy: this.config.center,
            r: this.config.scale * (1 - this.state.dimensions.paddle_width),
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        // Get paddle centers with their corresponding paddle data
        const paddleCentersWithData = this.generatePaddleCenters();
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;
        const paddleLength = this.state.dimensions.paddle_length * sectorSize;

        paddleCentersWithData.forEach(({angle, paddle, index}) => {
            const startAngle = angle - paddleLength / 2;
            const endAngle = angle + paddleLength / 2;
            
            // Draw hit zone
            const hitZoneWidth = (this.state.dimensions.paddle_width + 
                (this.state.dimensions.ball_size || 0.1) * 2) * this.config.scale;
            
            const hitZoneArc = this.createPaddleArc(
                this.config.center,
                this.config.center,
                this.config.scale,
                startAngle,
                endAngle,
                hitZoneWidth
            );
            
            const isColliding = this.state.collision?.sideIndex === paddle.side_index;
            const isCurrentPlayer = index === this.playerIndex;
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: hitZoneArc,
                fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                stroke: isColliding ? 'red' : 'green',
                'stroke-width': '1',
                'stroke-dasharray': '4'
            }));
            
            // Draw paddle
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
                fill: isCurrentPlayer ? 'rgba(255,165,0,0.3)' : 'rgba(0,0,255,0.3)',
                stroke: isCurrentPlayer ? 'orange' : 'blue',
                'stroke-width': '1'
            }));
            
            // Add paddle number
            const labelAngle = (startAngle + endAngle) / 2;
            const labelRadius = this.config.scale + 20;
            const labelX = this.config.center + labelRadius * Math.cos(labelAngle);
            const labelY = this.config.center + labelRadius * Math.sin(labelAngle);
            
            this.svg.appendChild(this.createSVGElement('text', {
                x: labelX,
                y: labelY,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                fill: isCurrentPlayer ? 'orange' : 'blue',
                'font-size': '12px'
            })).textContent = `P${index + 1}`;
        });

        // Draw balls
        if (this.state.balls) {
            this.renderBalls();
        }
        
        this.renderScores();
    }

/*
generatePaddleCenters() {
	  console.log("Current game state:", this.state);
        console.log("Paddles:", this.state.paddles);
        const centers = [];
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;

        this.state.paddles.forEach((paddle, i) => {
            if (!paddle.active) return;

            // Calculate base sector angle
            const baseSectorAngle = paddle.side_index * sectorSize;
            
            // Calculate maximum allowed offset within sector
            const paddleLength = this.state.dimensions.paddle_length * sectorSize;
            const hitZoneAngle = this.state.dimensions.ball_size;
            const totalAngleNeeded = paddleLength + (hitZoneAngle * 2);
            
            let maxOffset = 0;
            if (totalAngleNeeded < sectorSize) {
                maxOffset = (sectorSize - totalAngleNeeded) / 2;
            }

            // Calculate final angle with constrained offset
            const offsetAngle = (paddle.position - 0.5) * 2 * maxOffset;
            let finalAngle = baseSectorAngle + offsetAngle;

            // Normalize angle to positive range
            while (finalAngle < 0) finalAngle += 2 * Math.PI;
            while (finalAngle >= 2 * Math.PI) finalAngle -= 2 * Math.PI;

            centers.push({
                angle: finalAngle,
                paddle: paddle
            });
        });
console.log("Generated centers:", centers);
        return centers;
    }

    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        
        // Calculate points
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);

        const largeArcFlagOuter = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        const largeArcFlagInner = largeArcFlagOuter;

        return `M ${x1} ${y1} ` +
               `A ${radius} ${radius} 0 ${largeArcFlagOuter} 1 ${x2} ${y2} ` +
               `L ${x3} ${y3} ` +
               `A ${innerRadius} ${innerRadius} 0 ${largeArcFlagInner} 0 ${x4} ${y4} ` +
               'Z';
    }

    render() {
        if (!this.state || !this.svg) return;
         console.log("Starting render with state:", this.state);
        this.svg.innerHTML = '';
        
        // Draw boundary circle
        this.svg.appendChild(this.createSVGElement('circle', {
            cx: this.config.center,
            cy: this.config.center,
            r: this.config.scale,
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1'
        }));

        // Draw inner circles for visual reference
        this.svg.appendChild(this.createSVGElement('circle', {
            cx: this.config.center,
            cy: this.config.center,
            r: this.config.scale * (1 - this.state.dimensions.paddle_width),
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        // Get paddle centers with their corresponding paddle data
        const paddleCentersWithData = this.generatePaddleCenters();
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;
        const paddleLength = this.state.dimensions.paddle_length * sectorSize;
i
	
        console.log("About to render paddles:", {
            paddleCentersWithData,
            sectorSize: sectorSize * (180/Math.PI),
            paddleLength: paddleLength * (180/Math.PI)
        });

        paddleCentersWithData.forEach(({angle, paddle}) => {
            const startAngle = angle - paddleLength / 2;
            const endAngle = angle + paddleLength / 2;
            
            // Draw hit zone
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
            
            const isColliding = this.state.collision?.sideIndex === paddle.side_index;
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: hitZoneArc,
                fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                stroke: isColliding ? 'red' : 'green',
                'stroke-width': '1',
                'stroke-dasharray': '4'
            }));
            
            // Draw paddle
        console.log(`Added hit zone path for paddle ${index}`);   
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
                fill: isColliding ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                stroke: isColliding ? 'red' : 'blue',
                'stroke-width': '1'
            }));
        });

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }

    renderBalls() {
        if (!this.state.balls) return;
        
        this.state.balls.forEach(ball => {
            const ballX = this.config.center + ball.x * this.config.scale;
            const ballY = this.config.center - ball.y * this.config.scale; // Note the minus for Y coordinate
            
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


/*    generatePaddleCenters() {
        const centers = [];
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;

        this.state.paddles.forEach((paddle, i) => {
            if (!paddle.active) return;

            // Calculate base sector angle
            const baseSectorAngle = i * sectorSize;
            
            // Calculate maximum allowed offset within sector
            const paddleLength = this.state.dimensions.paddle_length * sectorSize;
            const hitZoneAngle = this.state.dimensions.ball_size;
            const totalAngleNeeded = paddleLength + (hitZoneAngle * 2);
            
            let maxOffset = 0;
            if (totalAngleNeeded < sectorSize) {
                maxOffset = (sectorSize - totalAngleNeeded) / 2;
            }

            // Calculate final angle with constrained offset
            const offsetAngle = (paddle.position - 0.5) * 2 * maxOffset;
            let finalAngle = baseSectorAngle + offsetAngle;

            // Normalize angle to positive range
            while (finalAngle < 0) finalAngle += 2 * Math.PI;
            while (finalAngle >= 2 * Math.PI) finalAngle -= 2 * Math.PI;

            centers.push(finalAngle);
        });

        return centers;
    }

    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        
        // Calculate points
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);

        // Determine if the arc sweep is greater than 180 degrees
        const largeArcFlagOuter = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        const largeArcFlagInner = largeArcFlagOuter;

        return `M ${x1} ${y1} ` + // Move to start point
               `A ${radius} ${radius} 0 ${largeArcFlagOuter} 1 ${x2} ${y2} ` + // Outer arc
               `L ${x3} ${y3} ` + // Line to inner arc start
               `A ${innerRadius} ${innerRadius} 0 ${largeArcFlagInner} 0 ${x4} ${y4} ` + // Inner arc
               'Z'; // Close path
    }

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

        // Get paddle centers using sector-based calculation
        const paddleCenters = this.generatePaddleCenters();
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;
        const paddleLength = this.state.dimensions.paddle_length * sectorSize;

        paddleCenters.forEach((centerAngle, index) => {
            const paddle = this.state.paddles[index];
            if (!paddle.active) return;

            const startAngle = centerAngle - paddleLength / 2;
            const endAngle = centerAngle + paddleLength / 2;
            
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
            
            // Determine if this paddle is involved in a collision
            const isColliding = this.state.collision?.sideIndex === paddle.side_index;
            
            this.svg.appendChild(this.createSVGElement('path', {
                d: hitZoneArc,
                fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                stroke: isColliding ? 'red' : 'green',
                'stroke-width': '1',
                'stroke-dasharray': '4'
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
                fill: isColliding ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
                stroke: isColliding ? 'red' : 'blue',
                'stroke-width': '1'
            }));
        });

        // Draw balls
        this.renderBalls();
        this.renderScores();
    }
/*	    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
		const innerRadius = radius - width;
		
		// Convert angles to radians
		const startRad = startAngle;
		const endRad = endAngle;
		
		// Calculate points
		const x1 = cx + radius * Math.cos(startRad);
		const y1 = cy + radius * Math.sin(startRad);
		const x2 = cx + radius * Math.cos(endRad);
		const y2 = cy + radius * Math.sin(endRad);
		
		const x3 = cx + innerRadius * Math.cos(endRad);
		const y3 = cy + innerRadius * Math.sin(endRad);
		const x4 = cx + innerRadius * Math.cos(startRad);
		const y4 = cy + innerRadius * Math.sin(startRad);

		// Determine if the arc sweep is greater than 180 degrees
		const largeArcFlagOuter = Math.abs(endRad - startRad) > Math.PI ? 1 : 0;
		const largeArcFlagInner = largeArcFlagOuter;

		// Create the SVG path
		return `M ${x1} ${y1} ` + // Move to start point
		       `A ${radius} ${radius} 0 ${largeArcFlagOuter} 1 ${x2} ${y2} ` + // Outer arc
		       `L ${x3} ${y3} ` + // Line to inner arc start
		       `A ${innerRadius} ${innerRadius} 0 ${largeArcFlagInner} 0 ${x4} ${y4} ` + // Inner arc
		       'Z'; // Close path
	    }

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
    }*/
}


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
*/
/*export class PolygonRenderer extends BasePongRenderer {
    constructor(config) {
        super(config);
        this.vertices = [];
        this.initialized = false;
    }

    initialize(gameState) {
        super.initialize(gameState);
        this.updateVertices();
        this.initialized = true;
    }

    updateVertices() {
        if (!this.state) return;
        
        // Calculate vertices based on number of sides
        const numSides = this.state.paddles.length;
        const angleStep = (2 * Math.PI) / numSides;
        
        this.vertices = Array.from({ length: numSides }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2; // Start from top
            return {
                x: this.config.center + this.config.scale * Math.cos(angle),
                y: this.config.center + this.config.scale * Math.sin(angle)
            };
        });
    }

    update(gameState) {
        this.state = gameState;
        if (!this.initialized) {
            this.updateVertices();
            this.initialized = true;
        }
        this.render();
    }

    renderPolygonOutline() {
        // Create polygon outline path
        const pathData = this.vertices
            .map((vertex, i) => `${i === 0 ? 'M' : 'L'} ${vertex.x} ${vertex.y}`)
            .join(' ');

        this.svg.appendChild(this.createSVGElement('path', {
            d: `${pathData} Z`,
            fill: 'none',
            stroke: '#808080',
            'stroke-width': '2'
        }));
    }

    renderPaddle(paddle, startVertex, endVertex) {
        if (!paddle.active) return;

        const sideX = endVertex.x - startVertex.x;
        const sideY = endVertex.y - startVertex.y;
        const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);
        
        // Normalize vectors
        const normalizedSideX = sideX / sideLength;
        const normalizedSideY = sideY / sideLength;
        const normalX = -sideY / sideLength;
        const normalY = sideX / sideLength;
        
        // Calculate paddle center position
        const paddleX = startVertex.x + sideX * paddle.position;
        const paddleY = startVertex.y + sideY * paddle.position;
        
        // Calculate dimensions
        const paddleLength = this.state.dimensions.paddle_length * sideLength;
        const paddleWidth = this.state.dimensions.paddle_width * this.config.scale;
        const hitZoneWidth = (this.state.dimensions.paddle_width + 
            (this.state.dimensions.ball_size || 0.1) * 2) * this.config.scale;

        // Draw hit zone
        const isCurrentPlayer = this.state.paddles.indexOf(paddle) === this.playerIndex;
        const isColliding = this.state.collision?.side_index === paddle.side_index;

        const hitZonePoints = [
            `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`,
            `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`
        ].join(' ');

        // Draw hit zone with appropriate color
        this.svg.appendChild(this.createSVGElement('polygon', {
            points: hitZonePoints,
            fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
            stroke: isColliding ? 'red' : 'green',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        // Draw paddle
        const paddlePoints = [
            `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`,
            `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`
        ].join(' ');

        // Draw paddle with appropriate color
        this.svg.appendChild(this.createSVGElement('polygon', {
            points: paddlePoints,
            fill: isCurrentPlayer ? 'rgba(255,165,0,0.6)' : 'rgba(0,0,255,0.6)',
            stroke: isCurrentPlayer ? 'orange' : 'blue',
            'stroke-width': '1'
        }));

        // Add paddle label
        const labelX = paddleX + normalX * (hitZoneWidth + 20);
        const labelY = paddleY + normalY * (hitZoneWidth + 20);
        const playerIndex = this.state.paddles.indexOf(paddle);

        this.svg.appendChild(this.createSVGElement('text', {
            x: labelX,
            y: labelY,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            fill: isCurrentPlayer ? 'orange' : 'blue',
            'font-size': '12px'
        })).textContent = `P${playerIndex + 1}`;
    }

    render() {
        if (!this.state || !this.svg) return;
        this.svg.innerHTML = '';

        // Draw polygon outline
        this.renderPolygonOutline();

        // Render each paddle
        this.state.paddles.forEach((paddle, index) => {
            const startVertex = this.vertices[paddle.side_index];
            const endVertex = this.vertices[(paddle.side_index + 1) % this.vertices.length];
            this.renderPaddle(paddle, startVertex, endVertex);
        });

        // Draw balls
        this.renderBalls();
        
        // Update scores
        this.renderScores();
    }
}*/
export class PolygonRenderer extends BasePongRenderer {
    constructor(config) {
        super(config);
        this.vertices = [];
        this.playerIndex = null;
        this.initialized = false;
    }

    initialize(gameState) {
        super.initialize(gameState);
        this.initialized = true;
    }

    transformVertices(vertices) {
        // Transform backend coordinates to screen coordinates
        return vertices.map(vertex => ({
            x: this.config.center + vertex.x * this.config.scale,
            y: this.config.center + vertex.y * this.config.scale
        }));
    }

    update(gameState) {
        this.state = gameState;
        this.render();
    }

    renderPolygonOutline() {
        if (!this.vertices || this.vertices.length === 0) return;

        const transformedVertices = this.transformVertices(this.vertices);
        const pathData = transformedVertices
            .map((vertex, i) => `${i === 0 ? 'M' : 'L'} ${vertex.x} ${vertex.y}`)
            .join(' ');

        this.svg.appendChild(this.createSVGElement('path', {
            d: `${pathData} Z`,
            fill: 'none',
            stroke: '#808080',
            'stroke-width': '2'
        }));
    }

    renderPaddle(paddle, sideIndex) {
        if (!paddle.active || !this.vertices) return;

        const transformedVertices = this.transformVertices(this.vertices);
        const startVertex = transformedVertices[sideIndex];
        const endVertex = transformedVertices[(sideIndex + 1) % transformedVertices.length];

        const sideX = endVertex.x - startVertex.x;
        const sideY = endVertex.y - startVertex.y;
        const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);
        
        // Normalize vectors
        const normalizedSideX = sideX / sideLength;
        const normalizedSideY = sideY / sideLength;
        const normalX = -sideY / sideLength;
        const normalY = sideX / sideLength;
        
        // Calculate paddle center position
        const paddleX = startVertex.x + sideX * paddle.position;
        const paddleY = startVertex.y + sideY * paddle.position;
        
        // Calculate dimensions
        const paddleLength = this.state.dimensions.paddle_length * sideLength;
        const paddleWidth = this.state.dimensions.paddle_width * this.config.scale;
        const hitZoneWidth = (this.state.dimensions.paddle_width + 
            (this.state.dimensions.ball_size || 0.1) * 2) * this.config.scale;

        // Check if this is current player's paddle or if there's a collision
        const isCurrentPlayer = this.state.paddles.indexOf(paddle) === this.playerIndex;
        const isColliding = this.state.collision?.side_index === paddle.side_index;

        // Draw hit zone
        const hitZonePoints = [
            `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`,
            `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * hitZoneWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * hitZoneWidth}`
        ].join(' ');

        this.svg.appendChild(this.createSVGElement('polygon', {
            points: hitZonePoints,
            fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
            stroke: isColliding ? 'red' : 'green',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        // Draw paddle
        const paddlePoints = [
            `${paddleX - (normalizedSideX * paddleLength / 2)},${paddleY - (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2)},${paddleY + (normalizedSideY * paddleLength / 2)}`,
            `${paddleX + (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY + (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`,
            `${paddleX - (normalizedSideX * paddleLength / 2) + normalX * paddleWidth},${paddleY - (normalizedSideY * paddleLength / 2) + normalY * paddleWidth}`
        ].join(' ');

        this.svg.appendChild(this.createSVGElement('polygon', {
            points: paddlePoints,
            fill: isCurrentPlayer ? 'rgba(255,165,0,0.6)' : 'rgba(0,0,255,0.6)',
            stroke: isCurrentPlayer ? 'orange' : 'blue',
            'stroke-width': '1'
        }));

        // Add paddle label
        const labelX = paddleX + normalX * (hitZoneWidth + 20);
        const labelY = paddleY + normalY * (hitZoneWidth + 20);
        const playerIndex = this.state.paddles.indexOf(paddle);

        this.svg.appendChild(this.createSVGElement('text', {
            x: labelX,
            y: labelY,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            fill: isCurrentPlayer ? 'orange' : 'blue',
            'font-size': '12px'
        })).textContent = `P${playerIndex + 1}`;
    }

    render() {
	 if (!this.state) {
        console.warn('Rendering failed: No game state available');
        return;
    }
    
    if (!this.svg) {
        console.warn('Rendering failed: No SVG element found');
        return;
    }
    
    if (!this.vertices) {
        console.warn('Rendering failed: Vertices are undefined');
        console.log('Current vertices:', this.vertices);
        return;
    }
    
    if (this.vertices.length === 0) {
        console.warn('Rendering failed: Vertices array is empty');
        console.log('Current vertices:', this.vertices);
        return;
    }

    // If we get here, all checks passed
    console.log('Rendering with:', {
        verticesCount: this.vertices.length,
        paddlesCount: this.state.paddles.length,
        svgElement: this.svg.id
    });
        if (!this.state || !this.svg || !this.vertices || this.vertices.length === 0) {
            console.warn('Missing required data for rendering');
            return;
        }

        this.svg.innerHTML = '';

        // Draw polygon outline
        this.renderPolygonOutline();

        // Render each paddle
        this.state.paddles.forEach((paddle) => {
            this.renderPaddle(paddle, paddle.side_index);
        });

        // Draw balls
        this.renderBalls();
        
        // Update scores
        this.renderScores();
    }
}
