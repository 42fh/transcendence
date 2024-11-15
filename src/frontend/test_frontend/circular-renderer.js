// circular-renderer.js
import { BasePongRenderer } from './pong-renderers.js';

export class CircularRenderer extends BasePongRenderer {
    constructor(config) {
        super(config);
        this.playerIndex = null;
        this.vertices = [];
    }

    initialize(gameState) {
        super.initialize(gameState);
        this.vertices = gameState.vertices || [];
    }

    update(gameState) {
        this.state = gameState;
        this.vertices = gameState.vertices || this.vertices;
        this.render();
    }

    createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        
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

    generateSectorPaths() {
        if (!this.state.vertices || this.state.vertices.length === 0) {
            console.warn('No vertices available for sector generation');
            return [];
        }

        const sectors = [];
        const sectorAngle = (2 * Math.PI) / this.state.vertices.length;
        
        this.state.vertices.forEach((vertex, index) => {
            if (!vertex) {
                console.warn(`Invalid vertex at index ${index}`);
                return;
            }

            const paddle = this.state.paddles?.find(p => p.side_index === index);
            const isWall = !paddle?.active;

            // Calculate base angles for the sector
            const baseSectorStart = index * sectorAngle;
            const baseSectorEnd = (index + 1) * sectorAngle;
            
            let paddleArc = null;
            let hitZoneArc = null;
            
            if (!isWall && paddle) {
                try {
                    // Calculate paddle dimensions
                    const paddleLength = this.state.dimensions.paddle_length * sectorAngle;
                    const hitZoneAngle = this.state.dimensions.ball_size || 0.1;
                    const totalAngleNeeded = paddleLength + (hitZoneAngle * 2);
                    
                    // Calculate maximum allowed offset
                    const availableSpace = sectorAngle - totalAngleNeeded;
                    const maxOffset = Math.max(0, availableSpace / 2);

                    // Calculate paddle position within sector
                    const offsetAngle = (paddle.position - 0.5) * availableSpace;
                    const paddleCenterAngle = baseSectorStart + (sectorAngle / 2) + offsetAngle;
                    
                    paddleArc = {
                        start: paddleCenterAngle - (paddleLength / 2),
                        end: paddleCenterAngle + (paddleLength / 2),
                        isColliding: this.state.collision?.sideIndex === paddle.side_index,
                        isCurrentPlayer: index === this.playerIndex
                    };
                    
                    hitZoneArc = {
                        start: paddleArc.start - hitZoneAngle,
                        end: paddleArc.end + hitZoneAngle
                    };
                } catch (error) {
                    console.error('Error calculating paddle arcs:', error);
                }
            }
            
            sectors.push({
                index,
                startAngle: baseSectorStart,
                endAngle: baseSectorEnd,
                isWall,
                paddleArc,
                hitZoneArc,
                vertex
            });
        });
        
        return sectors;
    }

    render() {
        if (!this.state || !this.svg || !this.state.vertices) {
            console.warn('Missing required data for rendering');
            return;
        }

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

        const sectors = this.generateSectorPaths();
        
        sectors.forEach(sector => {
            // Draw base sector arc (wall or active side)
            const sectorPath = this.createPaddleArc(
                this.config.center,
                this.config.center,
                this.config.scale,
                sector.startAngle,
                sector.endAngle,
                this.state.dimensions.paddle_width * this.config.scale
            );
            
            // Draw sector
            this.svg.appendChild(this.createSVGElement('path', {
                d: sectorPath,
                fill: sector.isWall ? '#444444' : 'none',
                stroke: sector.isWall ? '#666666' : 'gray',
                'stroke-width': sector.isWall ? '2' : '1',
                'stroke-dasharray': sector.isWall ? 'none' : '4'
            }));
            
            if (!sector.isWall && sector.paddleArc) {
                // Draw hit zone
                const hitZonePath = this.createPaddleArc(
                    this.config.center,
                    this.config.center,
                    this.config.scale,
                    sector.hitZoneArc.start,
                    sector.hitZoneArc.end,
                    (this.state.dimensions.paddle_width + 
                        (this.state.dimensions.ball_size || 0.1) * 2) * this.config.scale
                );
                
                this.svg.appendChild(this.createSVGElement('path', {
                    d: hitZonePath,
                    fill: sector.paddleArc.isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
                    stroke: sector.paddleArc.isColliding ? 'red' : 'green',
                    'stroke-width': '1',
                    'stroke-dasharray': '4'
                }));
                
                // Draw paddle
                const paddlePath = this.createPaddleArc(
                    this.config.center,
                    this.config.center,
                    this.config.scale,
                    sector.paddleArc.start,
                    sector.paddleArc.end,
                    this.state.dimensions.paddle_width * this.config.scale
                );
                
                this.svg.appendChild(this.createSVGElement('path', {
                    d: paddlePath,
                    fill: sector.paddleArc.isCurrentPlayer ? 'rgba(255,165,0,0.3)' : 'rgba(0,0,255,0.3)',
                    stroke: sector.paddleArc.isCurrentPlayer ? 'orange' : 'blue',
                    'stroke-width': '1'
                }));
                
                // Add label
                const labelAngle = (sector.paddleArc.start + sector.paddleArc.end) / 2;
                const labelRadius = this.config.scale + 20;
                const labelX = this.config.center + labelRadius * Math.cos(labelAngle);
                const labelY = this.config.center + labelRadius * Math.sin(labelAngle);
                
                this.svg.appendChild(this.createSVGElement('text', {
                    x: labelX,
                    y: labelY,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    fill: sector.paddleArc.isCurrentPlayer ? 'orange' : 'blue',
                    'font-size': '12px'
                })).textContent = `P${sector.index + 1}`;
            }
        });
        
        // Draw balls and scores last so they're on top
        if (this.state.balls) {
            this.renderBalls();
        }
        
        this.renderScores();
    }
}
