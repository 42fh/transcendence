// gameLogic.js

const GameLogic = {
    // Configuration and state
    config: {
        viewboxSize: 300,
        scale: 300 / 4,
        center: 300 / 2
    },

    state: {
        point: { x: 0.9, y: 0.7 },
        paddleSize: 0.5,
        paddleWidth: 0.2,
        ballSize: 0.2,
        sectorCount: 3,
        paddleOffsets: [], // Array to store normalized offsets (0-1) for each paddle
        constrainToSector: true,
        scores: [],
    },

    // Initialization functions
    initializeGame() {
        this.initializePaddleOffsets();
        this.initializeScores();
    },

    initializePaddleOffsets() {
        this.state.paddleOffsets = new Array(this.state.sectorCount).fill(0);
    },

    initializeScores() {
        this.state.scores = new Array(this.state.sectorCount).fill(0);
    },

    // Core calculation functions
    calculateDistance(point) {
        return Math.sqrt(point.x * point.x + point.y * point.y);
    },

    calculateAngle(point) {
        let angle = Math.atan2(point.y, point.x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        return angle;
    },

    // Paddle-related calculations
    getMaxOffsetForSector(sectorIndex) {
        const sectorSize = 360 / this.state.sectorCount;
        const hitZoneAngle = this.state.ballSize * 180 / Math.PI * 0.5;
        const paddleAngle = sectorSize * this.state.paddleSize;
        const totalAngleNeeded = paddleAngle + (hitZoneAngle * 2);
        
        if (totalAngleNeeded >= sectorSize) {
            return 0;
        }
        return (sectorSize - totalAngleNeeded) / 2;
    },

    generatePaddleCenters() {
        const centers = [];
        const sectorSize = 360 / this.state.sectorCount;

        for (let i = 0; i < this.state.sectorCount; i++) {
            let offsetAngle;
            if (this.state.constrainToSector) {
                const maxOffset = this.getMaxOffsetForSector(i);
                offsetAngle = (this.state.paddleOffsets[i] - 0.5) * 2 * maxOffset;
            } else {
                offsetAngle = this.state.paddleOffsets[i] * 360;
            }
            
            let position = (i * sectorSize) + offsetAngle;
            while (position >= 360) position -= 360;
            while (position < 0) position += 360;
            centers.push(position);
        }
        return centers;
    },

    // Collision detection
    calculatePaddleHit(angle, distance) {
        const sectorSize = 360 / this.state.sectorCount;
        const actualPaddleSize = sectorSize * this.state.paddleSize;
        const angularHitZone = this.state.ballSize * 180 / Math.PI * 0.5;
        
        const radialHitZoneWidth = this.state.ballSize;
        const outerRadius = 1.0;
        const innerRadius = outerRadius - this.state.paddleWidth;
        
        const isInRadialRange = distance >= (innerRadius - radialHitZoneWidth) && 
                               distance <= outerRadius;
        
        if (!isInRadialRange) return null;

        const paddleCenters = this.generatePaddleCenters();
        
        for (let i = 0; i < paddleCenters.length; i++) {
            const center = paddleCenters[i];
            const halfSize = actualPaddleSize / 2;
            
            let angleDiff = angle - center;
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;
            
            if (Math.abs(angleDiff) <= (halfSize + angularHitZone)) {
                let normalizedOffset;
                if (Math.abs(angleDiff) <= halfSize) {
                    normalizedOffset = angleDiff / halfSize;
                } else {
                    const hitZoneDiff = Math.abs(angleDiff) - halfSize;
                    const hitZoneNorm = hitZoneDiff / angularHitZone;
                    normalizedOffset = angleDiff > 0 ? 
                        1 + hitZoneNorm : 
                        -1 - hitZoneNorm;
                }
                
                return {
                    paddleNumber: i + 1,
                    offset: angleDiff,
                    normalizedOffset: Math.max(-2, Math.min(2, normalizedOffset)),
                    radialPosition: (distance - (innerRadius - radialHitZoneWidth)) / 
                                   (this.state.paddleWidth + radialHitZoneWidth),
                    hitZoneWidth: radialHitZoneWidth,
                    angularHitZone,
                    actualDistance: distance,
                    isEdgeHit: Math.abs(angleDiff) > halfSize
                };
            }
        }
        return null;
    },
	
	    findNearestPaddle(angle) {
        const paddleCenters = this.generatePaddleCenters();
        let nearestPaddleIndex = 0;
        let smallestAngleDiff = 360;

        paddleCenters.forEach((center, index) => {
            let angleDiff = Math.abs(angle - center);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            if (angleDiff < smallestAngleDiff) {
                smallestAngleDiff = angleDiff;
                nearestPaddleIndex = index;
            }
        });

        return nearestPaddleIndex;
    },

    // Game state updates
    updateGameState() {
        const distance = this.calculateDistance(this.state.point);
        const angle = this.calculateAngle(this.state.point);
        
        if (distance > 1.0) {
		let responsiblePaddleIndex;
	if (this.state.constrainToSector) {
            const sectorSize = 360 / this.state.sectorCount;
	            const shiftedAngle = (angle + (sectorSize/2)) % 360;
        	responsiblePaddleIndex = Math.floor(shiftedAngle / sectorSize);
		} else {
                // New nearest-paddle logic
                responsiblePaddleIndex = this.findNearestPaddle(angle);
            	}
            // Update scores
            this.state.scores = this.state.scores.map((score, index) => 
                index !== responsiblePaddleIndex ? score + 1 : score
            );
            
            // Reset ball position
            
            return true; // Indicates a score update occurred
        }
        return false;
    },

    // State getters
    getGameState() {
        const distance = this.calculateDistance(this.state.point);
        const angle = this.calculateAngle(this.state.point);
        const hitInfo = this.calculatePaddleHit(angle, distance);
        
        return {
            distance,
            angle,
            hitInfo,
            state: { ...this.state },
            config: { ...this.config }
        };
    },

    // State setters
    setState(newState) {
        Object.assign(this.state, newState);
    },

    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }
};

