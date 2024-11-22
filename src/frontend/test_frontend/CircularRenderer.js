import { BasePongRenderer } from './BasePongRenderer.js';

export class CircularRenderer extends BasePongRenderer {
    constructor(config) {
        super(config);
        this.playerIndex = null;
        this.vertices = [];
    }

    generateSectorGeometry(paddle, index) {
        // Calculate total number of sectors and sector size
        const sectorSize = (2 * Math.PI) / this.state.paddles.length;
        
        // Start at 0 radians (positive x-axis) and go counterclockwise
        // No offset needed as we match the backend coordinates exactly
        const sectorStartAngle = index * sectorSize;
        
        const paddleLength = this.state.dimensions.paddle_length * sectorSize;
        const hitZoneAngle = this.state.dimensions.ball_size || 0.1;
        const totalAngleNeeded = paddleLength + (hitZoneAngle * 2);
        
        // Calculate available space within sector
        const availableSpace = sectorSize - totalAngleNeeded;
        const maxOffset = Math.max(0, availableSpace / 2);

        // Calculate paddle position within sector
        const offsetAngle = (paddle.position - 0.5) * availableSpace;
        const paddleCenterAngle = sectorStartAngle + (sectorSize / 2) + offsetAngle;

        return {
            paddleArc: {
                start: paddleCenterAngle - (paddleLength / 2),
                end: paddleCenterAngle + (paddleLength / 2)
            },
            hitZoneArc: {
                start: paddleCenterAngle - (paddleLength / 2) - hitZoneAngle,
                end: paddleCenterAngle + (paddleLength / 2) + hitZoneAngle
            },
            maxOffset,
            centerAngle: paddleCenterAngle,
            sectorStartAngle,
            sectorEndAngle: sectorStartAngle + sectorSize
        };
    }

    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        
        try {
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy - radius * Math.sin(startAngle); // Invert y to match SVG coordinates
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy - radius * Math.sin(endAngle); // Invert y to match SVG coordinates
            
            const x3 = cx + innerRadius * Math.cos(endAngle);
            const y3 = cy - innerRadius * Math.sin(endAngle); // Invert y to match SVG coordinates
            const x4 = cx + innerRadius * Math.cos(startAngle);
            const y4 = cy - innerRadius * Math.sin(startAngle); // Invert y to match SVG coordinates

            const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

            return {
                path: `M ${x1} ${y1} ` +
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} ` +
                      `L ${x3} ${y3} ` +
                      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} ` +
                      'Z',
                points: { x1, y1, x2, y2, x3, y3, x4, y4 }
            };
        } catch (error) {
            console.error('Error generating arc path:', error);
            return null;
        }
    }

    render() {
        if (!this.state || !this.svg) {
            console.warn('Missing required data for rendering');
            return;
        }

        this.svg.innerHTML = '';
        
        try {
            // Draw boundary circle
            this.svg.appendChild(this.createSVGElement('circle', {
                cx: this.config.center,
                cy: this.config.center,
                r: this.config.scale,
                fill: 'none',
                stroke: 'gray',
                'stroke-width': '1'
            }));

            // Draw sector guidelines and labels
            const sectorSize = (2 * Math.PI) / this.state.paddles.length;
            for (let i = 0; i < this.state.paddles.length; i++) {
                const angle = i * sectorSize;
                const x = this.config.center + Math.cos(angle) * this.config.scale;
                const y = this.config.center - Math.sin(angle) * this.config.scale; // Invert y for SVG
                
                // Draw sector lines
                this.svg.appendChild(this.createSVGElement('line', {
                    x1: this.config.center,
                    y1: this.config.center,
                    x2: x,
                    y2: y,
                    stroke: 'rgba(128,128,128,0.3)',
                    'stroke-width': '1',
                    'stroke-dasharray': '4'
                }));

                // Add sector labels
                const labelRadius = this.config.scale + 35;
                const labelX = this.config.center + Math.cos(angle + sectorSize/2) * labelRadius;
                const labelY = this.config.center - Math.sin(angle + sectorSize/2) * labelRadius;
                this.svg.appendChild(this.createSVGElement('text', {
                    x: labelX,
                    y: labelY,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    fill: 'gray',
                    'font-size': '10px'
                })).textContent = `side ${i}`;
            }
            
            // Render paddles
            this.state.paddles.forEach((paddle, index) => {
                if (!paddle.active) return;

                const sectorGeometry = this.generateSectorGeometry(paddle, index);
                const isCurrentPlayer = index === this.playerIndex;
                const isColliding = this.state.collision?.sideIndex === paddle.side_index;

                // Draw hit zone
                const hitZoneArc = this.createPaddleArc(
                    this.config.center,
                    this.config.center,
                    this.config.scale,
                    sectorGeometry.hitZoneArc.start,
                    sectorGeometry.hitZoneArc.end,
                    (this.state.dimensions.paddle_width + (this.state.dimensions.ball_size || 0.1) * 2) * this.config.scale
                );

                if (hitZoneArc) {
                    this.svg.appendChild(this.createSVGElement('path', {
                        d: hitZoneArc.path,
                        fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                        stroke: isColliding ? 'red' : 'green',
                        'stroke-width': '1',
                        'stroke-dasharray': '4'
                    }));
                }

                // Draw paddle
                const paddleArc = this.createPaddleArc(
                    this.config.center,
                    this.config.center,
                    this.config.scale,
                    sectorGeometry.paddleArc.start,
                    sectorGeometry.paddleArc.end,
                    this.state.dimensions.paddle_width * this.config.scale
                );

                if (paddleArc) {
                    this.svg.appendChild(this.createSVGElement('path', {
                        d: paddleArc.path,
                        fill: isCurrentPlayer ? 'rgba(255,165,0,0.3)' : 'rgba(0,0,255,0.3)',
                        stroke: isCurrentPlayer ? 'orange' : 'blue',
                        'stroke-width': '1'
                    }));
                }

                // Add player label
                const labelAngle = sectorGeometry.centerAngle;
                const labelRadius = this.config.scale + 20;
                this.svg.appendChild(this.createSVGElement('text', {
                    x: this.config.center + Math.cos(labelAngle) * labelRadius,
                    y: this.config.center - Math.sin(labelAngle) * labelRadius,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    fill: isCurrentPlayer ? 'orange' : 'blue',
                    'font-size': '12px'
                })).textContent = `P${index + 1}`;
            });

            // Draw balls
            this.renderBalls();
            
            // Update scores
            this.renderScores();

        } catch (error) {
            console.error('Error in circular render:', error);
        }
    }
}

export default CircularRenderer;
