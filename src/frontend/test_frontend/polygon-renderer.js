// polygon-renderer.js
import { SVGUtils } from './svg-utils.js';
import { GeometryUtils } from './geometry-utils.js';

export class PolygonRenderer {
    constructor() {
        this.debugMode = false;
    }

    render(svg, state, config, playerIndex) {
        if (!state || !state.vertices || state.vertices.length === 0) {
            console.warn('Invalid state or vertices for polygon renderer');
            return;
        }

        const transformedVertices = GeometryUtils.transformVertices(state.vertices, config);
        
        // Draw boundary
        this.renderBoundary(svg, transformedVertices);
        
        // Draw paddles and hit zones
        state.paddles.forEach((paddle) => {
            if (paddle.active) {
                this.renderPaddleAndHitZone(svg, paddle, state, config, transformedVertices, playerIndex);
            }
        });

        // Draw debug information if enabled
        if (this.debugMode) {
            this.renderDebugInfo(svg, transformedVertices, state);
        }
    }

    renderBoundary(svg, transformedVertices) {
        // Create polygon outline path
        const pathData = transformedVertices
            .map((vertex, i) => `${i === 0 ? 'M' : 'L'} ${vertex.x} ${vertex.y}`)
            .join(' ');

        svg.appendChild(SVGUtils.createSVGElement('path', {
            d: `${pathData} Z`,
            fill: 'none',
            stroke: '#808080',
            'stroke-width': '2'
        }));
    }

    renderPaddleAndHitZone(svg, paddle, state, config, transformedVertices, playerIndex) {
        const sideIndex = paddle.side_index;
        const nextIndex = (sideIndex + 1) % transformedVertices.length;
        
        const startVertex = transformedVertices[sideIndex];
        const endVertex = transformedVertices[nextIndex];
        
        // Calculate paddle position and dimensions
        const {
            paddlePoints,
            hitZonePoints
        } = GeometryUtils.calculatePaddleGeometry(
            startVertex,
            endVertex,
            paddle.position,
            state.dimensions,
            config.scale
        );

        // Draw hit zone
        const isColliding = state.collision?.sideIndex === paddle.side_index;
        svg.appendChild(SVGUtils.createSVGElement('polygon', {
            points: hitZonePoints,
            fill: isColliding ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
            stroke: isColliding ? 'red' : 'green',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        // Draw paddle
        const isCurrentPlayer = state.paddles.indexOf(paddle) === playerIndex;
        svg.appendChild(SVGUtils.createSVGElement('polygon', {
            points: paddlePoints,
            fill: isCurrentPlayer ? 'rgba(255,165,0,0.3)' : 'rgba(0,0,255,0.3)',
            stroke: isCurrentPlayer ? 'orange' : 'blue',
            'stroke-width': '1'
        }));

        // Add paddle label
        const centerPoint = GeometryUtils.calculatePaddleCenter(startVertex, endVertex, paddle.position);
        const normal = GeometryUtils.calculateNormal(startVertex, endVertex);
        const labelOffset = 20; // pixels away from the paddle

        svg.appendChild(SVGUtils.createSVGElement('text', {
            x: centerPoint.x + normal.x * labelOffset,
            y: centerPoint.y + normal.y * labelOffset,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            fill: isCurrentPlayer ? 'orange' : 'blue',
            'font-size': '12px'
        })).textContent = `P${state.paddles.indexOf(paddle) + 1}`;
    }

    renderDebugInfo(svg, transformedVertices, state) {
        // Add side indices
        transformedVertices.forEach((vertex, index) => {
            const nextVertex = transformedVertices[(index + 1) % transformedVertices.length];
            const midX = (vertex.x + nextVertex.x) / 2;
            const midY = (vertex.y + nextVertex.y) / 2;
            
            svg.appendChild(SVGUtils.createSVGElement('text', {
                x: midX,
                y: midY,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-size': '10px',
                fill: 'gray'
            })).textContent = `Side ${index}`;
        });

        // Add vertex indices
        transformedVertices.forEach((vertex, index) => {
            svg.appendChild(SVGUtils.createSVGElement('text', {
                x: vertex.x,
                y: vertex.y,
                'text-anchor': 'start',
                'dominant-baseline': 'bottom',
                'font-size': '10px',
                fill: 'gray'
            })).textContent = `V${index}`;
        });
    }
}
