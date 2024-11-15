// geometry-utils.js

export class GeometryUtils {
    /**
     * Transforms game coordinates to SVG viewport coordinates
     */
    static transformVertices(vertices, config) {
        return vertices.map(vertex => ({
            x: config.center + vertex.x * config.scale,
            y: config.center - vertex.y * config.scale
        }));
    }

    /**
     * Calculates the normal vector of a line segment
     */
    static calculateNormal(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        return {
            x: -dy / length,
            y: dx / length
        };
    }

    /**
     * Calculates paddle center point
     */
    static calculatePaddleCenter(start, end, position) {
        return {
            x: start.x + (end.x - start.x) * position,
            y: start.y + (end.y - start.y) * position
        };
    }

    /**
     * Calculates all geometry needed for paddle rendering
     */
    static calculatePaddleGeometry(start, end, position, dimensions, scale) {
        const sideX = end.x - start.x;
        const sideY = end.y - start.y;
        const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);
        
        // Normalize vectors
        const normalizedSideX = sideX / sideLength;
        const normalizedSideY = sideY / sideLength;
        const normalX = -sideY / sideLength;
        const normalY = sideX / sideLength;
        
        // Calculate paddle center position
        const paddleX = start.x + sideX * position;
        const paddleY = start.y + sideY * position;
        
        // Calculate dimensions
        const paddleLength = dimensions.paddle_length * sideLength;
        const paddleWidth = dimensions.paddle_width * scale;
        const hitZoneWidth = (dimensions.paddle_width + 
            (dimensions.ball_size || 0.1) * 2) * scale;

        // Generate paddle points
        const paddlePoints = this.generatePaddlePoints(
            paddleX, paddleY,
            normalizedSideX, normalizedSideY,
            normalX, normalY,
            paddleLength, paddleWidth
        );

        // Generate hit zone points
        const hitZonePoints = this.generatePaddlePoints(
            paddleX, paddleY,
            normalizedSideX, normalizedSideY,
            normalX, normalY,
            paddleLength, hitZoneWidth
        );

        return {
            paddlePoints: paddlePoints.map(p => `${p.x},${p.y}`).join(' '),
            hitZonePoints: hitZonePoints.map(p => `${p.x},${p.y}`).join(' '),
            center: { x: paddleX, y: paddleY },
            normal: { x: normalX, y: normalY }
        };
    }

    /**
     * Generates the four corner points of a paddle or hit zone
     */
    static generatePaddlePoints(centerX, centerY, dirX, dirY, normalX, normalY, length, width) {
        return [
            {
                x: centerX - (dirX * length / 2),
                y: centerY - (dirY * length / 2)
            },
            {
                x: centerX + (dirX * length / 2),
                y: centerY + (dirY * length / 2)
            },
            {
                x: centerX + (dirX * length / 2) + normalX * width,
                y: centerY + (dirY * length / 2) + normalY * width
            },
            {
                x: centerX - (dirX * length / 2) + normalX * width,
                y: centerY - (dirY * length / 2) + normalY * width
            }
        ];
    }

    /**
     * Calculates angle between two vectors
     */
    static calculateAngle(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const det = v1.x * v2.y - v1.y * v2.x;
        return Math.atan2(det, dot);
    }

    /**
     * Checks if a point is inside a polygon
     */
    static isPointInPolygon(point, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const intersect = ((vertices[i].y > point.y) !== (vertices[j].y > point.y))
                && (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) 
                    / (vertices[j].y - vertices[i].y) + vertices[i].x);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}
