const GameLogic = {
    config: {
        viewboxSize: 300,
        scale: 300 / 4,
        center: 300 / 2
    },

    state: {
        point: { x: 0, y: 0 },
        paddleSize: 0.3,    // Size of paddle relative to side length
        paddleWidth: 0.2,   // Width of paddle extending inward
        ballSize: 0.1,      // Size of the ball
        sideCount: 3,       // Number of polygon sides (min 3)
	paddleCount: 2,  // New property for number of paddles
        paddleOffsets: [],  // Array to store normalized offsets (0-1) for each paddle
        activeSides: [],    // Array to store which sides have paddles
        scores: [],
    },

    initializeGame() {
        this.initializePaddleOffsets();
        this.initializeActiveSides();
        this.initializeScores();
    },

    initializePaddleOffsets() {
        this.state.paddleOffsets = new Array(this.state.sideCount).fill(0.5);
    },

    initializeActiveSides() {
    const { sideCount, paddleCount } = this.state;
        // Ensure paddleCount doesn't exceed sideCount
        const actualPaddleCount = Math.min(paddleCount, sideCount);
        
        // Reset active sides
        this.state.activeSides = new Array(sideCount).fill(false);
        
        if (actualPaddleCount > 0) {
            // Calculate spacing between paddles
            const spacing = Math.floor(sideCount / actualPaddleCount);
            
            // Activate sides for paddles with even spacing
            for(let i = 0; i < actualPaddleCount; i++) {
                const sideIndex = (i * spacing) % sideCount;
                this.state.activeSides[sideIndex] = true;
            }
        }
	},

    initializeScores() {
        this.state.scores = new Array(this.state.sideCount).fill(0);
    },

    // Polygon geometry utilities
    getPolygonVertices() {
        const vertices = [];
        const angleStep = (2 * Math.PI) / this.state.sideCount;
        
        for (let i = 0; i < this.state.sideCount; i++) {
            const angle = i * angleStep - Math.PI / 2; // Start from top
            vertices.push({
                x: Math.cos(angle),
                y: Math.sin(angle)
            });
        }
        return vertices;
    },

    // Calculate distance and position along a side
    calculateDistanceToSide(point, sideIndex) {
        const vertices = this.getPolygonVertices();
        const start = vertices[sideIndex];
        const end = vertices[(sideIndex + 1) % this.state.sideCount];
        
        const segmentX = end.x - start.x;
        const segmentY = end.y - start.y;
        const pointX = point.x - start.x;
        const pointY = point.y - start.y;
        
        const segmentLengthSq = segmentX * segmentX + segmentY * segmentY;
        let t = Math.max(0, Math.min(1, (pointX * segmentX + pointY * segmentY) / segmentLengthSq));
        
        const projectionX = start.x + t * segmentX;
        const projectionY = start.y + t * segmentY;
        
        const dx = point.x - projectionX;
        const dy = point.y - projectionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
	    distance: distance,
            position: t,
            projection: { x: projectionX, y: projectionY },
            normal: distance > 0 ? { x: dx/distance, y: dy/distance } : { x: 0, y: 0 }
        };
    },

    // Find the nearest side and collision information
/*    findNearestCollision(point) {
        let nearestSide = 0;
        let minDistance = Infinity;
        let collisionInfo = null;

        for (let i = 0; i < this.state.sideCount; i++) {
        	let collisionInfo;
    
	const info = this.calculateDistanceToSide(point, i);
            const isColliding = info.distance <= this.state.ballSize;
            if (isColliding && info.distance < minDistance) {
                minDistance = info.distance;
                nearestSide = i;
                collisionInfo = info;
            }
        }

        // If we're close enough for a collision
        if (collisionInfo) {
            // Check if it's a paddle or wall
            if (this.state.activeSides[nearestSide]) {
                return this.calculatePaddleCollision(nearestSide, collisionInfo);
            } else {
                return {
                    type: 'wall',
                    sideIndex: nearestSide,
                    ...collisionInfo
                };
            }
        }

        return null;
    }*/
findNearestCollision(point) {
    let nearestSide = 0;
    let minDistance = Infinity;
    let bestCollisionInfo = null;

    for (let i = 0; i < this.state.sideCount; i++) {
        let collisionInfo;
        
        // For active sides (paddles), check full paddle collision first
        if (this.state.activeSides[i]) {
            // Get basic distance info for the side
            const sideInfo = this.calculateDistanceToSide(point, i);
            // Check complete paddle collision including edges
            collisionInfo = this.calculatePaddleCollision(i, sideInfo);
            // Only consider it if it's a real paddle hit
            if (collisionInfo.type !== 'paddle') {
		if (collisionInfo.distance <= this.state.ballSize) {
            // Keep the miss only if it's at the wall edge
            collisionInfo.type = 'miss';
        } else {
            collisionInfo = null;
            }}
        } else {
            // For walls, just check distance to line + ball radius
            const sideInfo = this.calculateDistanceToSide(point, i);
            if (sideInfo.distance <= this.state.ballSize) {
                collisionInfo = {
                    type: 'wall',
                    sideIndex: i,
                    ...sideInfo
                };
            }
        }
        
        // If we found a collision and it's the nearest so far, keep it
        if (collisionInfo && collisionInfo.distance < minDistance) {
            minDistance = collisionInfo.distance;
            nearestSide = i;
            bestCollisionInfo = collisionInfo;
        }
    }

    return bestCollisionInfo;
}
,

/*
    calculatePaddleCollision(sideIndex, collisionInfo) {
        const paddleOffset = this.state.paddleOffsets[sideIndex];
        const vertices = this.getPolygonVertices();
        const start = vertices[sideIndex];
        const end = vertices[(sideIndex + 1) % this.state.sideCount];
        
        // Calculate side length
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const sideLength = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate paddle dimensions
        const paddleLength = sideLength * this.state.paddleSize;
        const halfPaddleLength = paddleLength / 2;

	 // Total collision width is paddle width plus ball radius
    	const totalCollisionWidth = this.state.paddleWidth + this.state.ballSize; 
       
        // Calculate hit position relative to paddle center
        const hitPosition = collisionInfo.position * sideLength;
        const paddlePosition = paddleOffset * sideLength;
        const positionDiff = hitPosition - paddlePosition;

	// Check if hit is within paddle bounds
    	const isWithinPaddleLength = Math.abs(positionDiff) <= halfPaddleLength;
    	const isWithinCollisionWidth = collisionInfo.distance <= totalCollisionWidth;


        // Check if hit is within paddle bounds
        if (isWithinPaddleLength && isWithinCollisionWidth) {
            return {
                type: 'paddle',
                sideIndex: sideIndex,
                paddleNumber: sideIndex + 1,
                offset: positionDiff,
                normalizedOffset: positionDiff / halfPaddleLength,
                ...collisionInfo,
                isEdgeHit: Math.abs(positionDiff) > halfPaddleLength * 0.9,
 		collisionDepth: totalCollisionWidth - collisionInfo.distance // How deep into the collision zone
            };
        }

        return {
            type: 'miss',
            sideIndex: sideIndex,
            ...collisionInfo
        };
    }*/
calculatePaddleCollision(sideIndex, collisionInfo) {
    const paddleOffset = this.state.paddleOffsets[sideIndex];
    const vertices = this.getPolygonVertices();
    const start = vertices[sideIndex];
    const end = vertices[(sideIndex + 1) % this.state.sideCount];
    
    // Calculate side vector and normal
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const sideLength = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize vectors
    const normalX = -dy / sideLength;  // Perpendicular to side vector
    const normalY = dx / sideLength;
    
    // Paddle dimensions
    const paddleLength = sideLength * this.state.paddleSize;
    const halfPaddleLength = paddleLength / 2;
    const totalCollisionWidth = this.state.paddleWidth + this.state.ballSize;

    // Paddle center position
    const paddlePosition = paddleOffset * sideLength;
    
    // Vector from start to ball center
    const toPointX = this.state.point.x - start.x;
    const toPointY = this.state.point.y - start.y;
    
    // Project point onto side line
    const projectedLen = (toPointX * dx + toPointY * dy) / sideLength;
    
    // Distance along normal direction (perpendicular to side)
    const normalDist = Math.abs(toPointX * normalX + toPointY * normalY);
    
    // Check if within paddle length
    const distFromPaddleCenter = Math.abs(projectedLen - paddlePosition);
    let isWithinPaddleLength = distFromPaddleCenter <= halfPaddleLength;
    
    // Check if within total collision width (paddle + ball)
    const isWithinCollisionWidth = normalDist <= totalCollisionWidth;
    
    // For edge collisions, we need to check circle intersection with paddle corners
    if (!isWithinPaddleLength && normalDist <= totalCollisionWidth) {
        // Get paddle corner points
        const cornerDists = [
            paddlePosition - halfPaddleLength,
            paddlePosition + halfPaddleLength
        ].map(cornerPos => {
            const cornerX = start.x + (dx * cornerPos/sideLength);
            const cornerY = start.y + (dy * cornerPos/sideLength);
            const cornerNormalX = cornerX + normalX * this.state.paddleWidth;
            const cornerNormalY = cornerY + normalY * this.state.paddleWidth;
            
            // Distance from ball center to corner
            const deltaX = this.state.point.x - cornerNormalX;
            const deltaY = this.state.point.y - cornerNormalY;
            return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        });
        
        // If ball intersects with either corner
        const intersectsCorner = cornerDists.some(dist => dist <= this.state.ballSize);
        if (intersectsCorner) {
            isWithinPaddleLength = true;  // Treat as valid paddle hit
        }
    }

    if (isWithinPaddleLength && isWithinCollisionWidth) {
        const positionDiff = projectedLen - paddlePosition;
        return {
            type: 'paddle',
            sideIndex: sideIndex,
            paddleNumber: sideIndex + 1,
            offset: positionDiff,
            normalizedOffset: positionDiff / halfPaddleLength,
            distance: normalDist,
            position: projectedLen / sideLength,
            projection: {
                x: start.x + (dx * projectedLen/sideLength),
                y: start.y + (dy * projectedLen/sideLength)
            },
            isEdgeHit: Math.abs(positionDiff) > halfPaddleLength * 0.9,
            collisionDepth: totalCollisionWidth - normalDist
        };
    }

    return {
        type: 'miss',
        sideIndex: sideIndex,
        ...collisionInfo
    };
}
,

    getGameState() {
        const collision = this.findNearestCollision(this.state.point);
        
        return {
            	collision,
            	state: { ...this.state },
            	config: { ...this.config },
		activePaddles: this.state.activeSides.reduce((acc, isActive, index) => 
		{
                if (isActive) acc.push(index);
                	return acc;
            	}, [])
        };
    }
};
