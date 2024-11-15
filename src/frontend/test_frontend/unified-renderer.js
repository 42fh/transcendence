// unified-renderer.js
import { BasePongRenderer } from './base-renderer.js';
import { CircularRenderer } from './circular-renderer.js';
import { PolygonRenderer } from './polygon-renderer.js';
import { ErrorHandlingMixin } from './error-handling.js';

// unified-renderer.js
export class UnifiedPongRenderer extends BasePongRenderer {
    constructor(config) {
        super(config);
        this.playerIndex = null;
        this.type = null;
        this.vertices = [];
        
        // Initialize specialized renderers
        this.circularRenderer = new CircularRenderer();
        this.polygonRenderer = new PolygonRenderer();
        
        // Mix in error handling
        Object.assign(this, ErrorHandlingMixin);
    }

    initialize(gameState) {
        super.initialize(gameState);
        
        // Ensure we have a valid game type
        this.type = gameState.type || 'circular';
        
        // Handle vertices from either game setup or state
        this.vertices = gameState.vertices || [];
        
        // Pass vertices to specialized renderers
        if (this.type === 'circular') {
            this.circularRenderer.vertices = this.vertices;
        } else {
            this.polygonRenderer.vertices = this.vertices;
        }
    }

    update(gameState) {
        if (!gameState) {
            console.warn('Invalid game state received');
            return;
        }

        this.state = gameState;
        this.type = gameState.type || this.type;
        
        // Update vertices if provided
        if (gameState.vertices) {
            this.vertices = gameState.vertices;
            if (this.type === 'circular') {
                this.circularRenderer.vertices = this.vertices;
            } else {
                this.polygonRenderer.vertices = this.vertices;
            }
        }

        this.render();
    }

    render() {
        if (!this.state || !this.svg) {
            console.warn('Cannot render: missing state or SVG element');
            return;
        }

        // Clear previous content
        this.svg.innerHTML = '';

        try {
            // Ensure we have vertices
            if (!this.vertices || this.vertices.length === 0) {
                throw new Error('No vertices available for rendering');
            }

            // Create a complete state object
            const renderState = {
                ...this.state,
                vertices: this.vertices, // Ensure vertices are included
                type: this.type
            };

            // Choose rendering method based on type
            if (this.type === 'circular') {
                this.circularRenderer.render(
                    this.svg,
                    renderState,
                    this.config,
                    this.playerIndex
                );
            } else if (this.type === 'polygon') {
                this.polygonRenderer.render(
                    this.svg,
                    renderState,
                    this.config,
                    this.playerIndex
                );
            } else {
                throw new Error(`Unknown game type: ${this.type}`);
            }

            // Render balls and scores (shared functionality)
            if (this.state.balls) {
                this.renderBalls();
            }
            this.renderScores();

        } catch (error) {
            console.error('Rendering error:', error);
            this.showError({
                type: 'render',
                message: error.message,
                details: `Failed to render ${this.type} game`,
                stack: error.stack
            });
        }
    }
}