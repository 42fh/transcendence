// Configuration and state
const config = {
    viewboxSize: 300,
    scale: 300 / 4,
    center: 300 / 2
};

let state = {
    point: { x: 0.9, y: 0.7 },
    paddleSize: 0.5,
    paddleWidth: 0.2,
    ballSize: 0.2,
    sectorCount: 3,
    paddleOffsets: [], // Array to store normalized offsets (0-1) for each paddle
    constrainToSector: true,
	scores: [],
};





// Utility functions
function calculateDistance(point) {
    return Math.sqrt(point.x * point.x + point.y * point.y);
}

function calculateAngle(point) {
    let angle = Math.atan2(point.y, point.x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
}

function getPointOnCircle(angleInDegrees, radius = 1) {
    const angleInRadians = angleInDegrees * (Math.PI / 180);
    return {
        x: config.center + config.scale * radius * Math.cos(angleInRadians),
        y: config.center - config.scale * radius * Math.sin(angleInRadians)
    };
}

// Initialize paddle offsets
function initializePaddleOffsets() {
    state.paddleOffsets = new Array(state.sectorCount).fill(0);
}

   


// Paddle-related functions
function generatePaddleCenters() {
    const centers = [];
    const sectorSize = 360 / state.sectorCount;
  
    // Calculate max movement considering hit zones
    function getMaxOffsetForSector(sectorIndex, paddleOffsets) {
        const hitZoneAngle = state.ballSize * 180 / Math.PI * 0.5;
        const paddleAngle = sectorSize * state.paddleSize;
        const totalAngleNeeded = paddleAngle + (hitZoneAngle * 2);
        
        // Ensure there's enough space in the sector
        if (totalAngleNeeded >= sectorSize) {
            return 0; // No movement allowed if paddle + hit zones are too big
        }
        return (sectorSize - totalAngleNeeded) / 2;
   }


  for (let i = 0; i < state.sectorCount; i++) {
        let offsetAngle;
        if (state.constrainToSector) {
            // Map 0-1 to the available space within sector
		//const maxOffset = (sectorSize - sectorSize * state.paddleSize) / 2;
		const maxOffset = getMaxOffsetForSector(i, state.paddleOffsets);
        // Convert 0-1 to sector position
		offsetAngle = (state.paddleOffsets[i] - 0.5) * 2 * maxOffset;
	} else {
            // Original behavior - full 360° movement
            offsetAngle = state.paddleOffsets[i] * 360;
        }
        
        let position = (i * sectorSize) + offsetAngle;
        // Normalize the angle to 0-360 range
        while (position >= 360) position -= 360;
        while (position < 0) position += 360;
        centers.push(position);
    }
    return centers;
}

function getPaddleBoundaries(centerAngle, includeHitZone = false) {
    const sectorSize = 360 / state.sectorCount;
    const actualPaddleSize = sectorSize * state.paddleSize;
    const angularHitZone = includeHitZone ? state.ballSize * 180 / Math.PI * 0.5 : 0;
    const halfSize = actualPaddleSize / 2;
    const startAngle = centerAngle - halfSize - angularHitZone;
    const endAngle = centerAngle + halfSize + angularHitZone;
    return {
        start: startAngle,
        end: endAngle,
        startDegree: Math.round(startAngle),
        endDegree: Math.round(endAngle)
    };
}

function generatePaddleShape(centerAngle, isHitZone = false) {
    const boundaries = getPaddleBoundaries(centerAngle, isHitZone);
    const outer = 1.0;
    const inner = isHitZone ? 
        1.0 - state.paddleWidth - state.ballSize :
        1.0 - state.paddleWidth;

    const points = [];
    for (let degree = boundaries.startDegree; degree <= boundaries.endDegree; degree++) {
        const pt = getPointOnCircle(degree, outer);
        points.push(`${pt.x},${pt.y}`);
    }
    for (let degree = boundaries.endDegree; degree >= boundaries.startDegree; degree--) {
        const pt = getPointOnCircle(degree, inner);
        points.push(`${pt.x},${pt.y}`);
    }
    return points.join(' ');
}

// Collision detection
function calculatePaddleHit(angle, distance) {
    const sectorSize = 360 / state.sectorCount;
    const actualPaddleSize = sectorSize * state.paddleSize;
    const angularHitZone = state.ballSize * 180 / Math.PI * 0.5;
    
    const radialHitZoneWidth = state.ballSize;
    const outerRadius = 1.0;
    const innerRadius = outerRadius - state.paddleWidth;
    
    const isInRadialRange = distance >= (innerRadius - radialHitZoneWidth) && 
                           distance <= outerRadius;
    
    if (!isInRadialRange) return null;

    const paddleCenters = generatePaddleCenters();
    
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
                               (state.paddleWidth + radialHitZoneWidth),
                hitZoneWidth: radialHitZoneWidth,
                angularHitZone,
                actualDistance: distance,
                isEdgeHit: Math.abs(angleDiff) > halfSize
            };
        }
    }
    return null;
}

// SVG manipulation
function createSVGElement(type, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
}

// Rendering functions
function renderPointInfo(distance, angle, hitInfo) {
    const pointInfo = document.getElementById('pointInfo');
    let html = `
        <p>Actual Position: (${state.point.x.toFixed(2)}, ${state.point.y.toFixed(2)})</p>
        <p>Distance from center: ${distance.toFixed(2)}</p>
        <p>Angle: ${angle.toFixed(1)}°</p>
    `;

    if (hitInfo) {
        const paddleIndex = hitInfo.paddleNumber - 1;
        const sectorSize = 360 / state.sectorCount;
        const offsetAngle = state.paddleOffsets[paddleIndex] * 360;
        html += `
            <p>Hit Paddle: ${hitInfo.paddleNumber}</p>
            <p>Paddle Base Angle: ${(sectorSize * paddleIndex).toFixed(1)}°</p>
            <p>Paddle Offset: ${state.paddleOffsets[paddleIndex].toFixed(2)} (${offsetAngle.toFixed(1)}°)</p>
            <p>Final Paddle Position: ${(sectorSize * paddleIndex + offsetAngle).toFixed(1)}°</p>
            <p>Angular offset: ${hitInfo.offset.toFixed(1)}°</p>
            <p>Normalized offset: ${hitInfo.normalizedOffset.toFixed(2)}
               ${hitInfo.isEdgeHit ? " (edge hit)" : ""}</p>
            <p>Radial position: ${hitInfo.radialPosition.toFixed(2)} (0-1)</p>
            <p>Ball radius: ${state.ballSize.toFixed(2)}</p>
            <p>Edge hit zone: ${hitInfo.angularHitZone.toFixed(1)}°</p>
        `;
    } else {
        html += '<p>Status: Miss</p>';
    }

    pointInfo.innerHTML = html;
}

// Initialize scores array
function initializeScores() {
    state.scores = new Array(state.sectorCount).fill(0);
}

// Check if ball is outside circle and update scores
function checkBallAndUpdateScores() {
    const distance = calculateDistance(state.point);
    const angle = calculateAngle(state.point);
    
    // If ball is outside the circle
    if (distance > 1.0) {
        // Find which paddle should have hit the ball
        const sectorSize = 360 / state.sectorCount;
        const responsiblePaddleIndex = Math.floor(angle / sectorSize);
        
        // Give points to all other paddles
        state.scores = state.scores.map((score, index) => 
            index !== responsiblePaddleIndex ? score + 1 : score
        );
        
        // Reset ball to center
        state.point = { x: 0, y: 0 };
        
        // Render updates
        renderPong();
    }
}





function renderPong() {
    const svg = document.getElementById('pongSvg');
    svg.innerHTML = '';

    const distance = calculateDistance(state.point);
    const angle = calculateAngle(state.point);
    const hitInfo = calculatePaddleHit(angle, distance);

    // Circle outline
    svg.appendChild(createSVGElement('circle', {
        cx: config.center,
        cy: config.center,
        r: config.scale,
        fill: 'none',
        stroke: 'gray',
        'stroke-width': '1'
    }));

    // Inner circle
    svg.appendChild(createSVGElement('circle', {
        cx: config.center,
        cy: config.center,
        r: config.scale * (1 - state.paddleWidth),
        fill: 'none',
        stroke: 'gray',
        'stroke-width': '1',
        'stroke-dasharray': '4'
    }));

    // Inner hit zone boundary
    svg.appendChild(createSVGElement('circle', {
        cx: config.center,
        cy: config.center,
        r: config.scale * (1 - state.paddleWidth - state.ballSize),
        fill: 'none',
        stroke: 'gray',
        'stroke-width': '1',
        'stroke-dasharray': '2'
    }));
 if (distance > 1.0) {
        const sectorSize = 360 / state.sectorCount;
        const responsiblePaddleIndex = Math.floor(angle / sectorSize);
        
        // Display scoring information for each paddle
        generatePaddleCenters().forEach((centerAngle, i) => {
            const textPoint = getPointOnCircle(centerAngle, 1.1);
            const scoreText = createSVGElement('text', {
                x: textPoint.x,
                y: textPoint.y,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                fill: i === responsiblePaddleIndex ? 'red' : 'green',
                'font-size': '12px'
            });
            scoreText.textContent = i === responsiblePaddleIndex ? 'Miss!' : '+1';
            svg.appendChild(scoreText);
        });
    }

    // Ball visualization
    svg.appendChild(createSVGElement('circle', {
        cx: config.center + state.point.x * config.scale,
        cy: config.center - state.point.y * config.scale,
        r: config.scale * state.ballSize,
        fill: 'rgba(255, 255, 0, 0.2)',
        stroke: 'black',
        'stroke-width': '1',
        'stroke-dasharray': '2'
    }));


    // Add movement range visualizations when constrained
    if (state.constrainToSector) {
//		renderMovementSectors()        
    }



    // Render paddles
    generatePaddleCenters().forEach((centerAngle, i) => {
        const isHit = hitInfo?.paddleNumber === i + 1;

        // Hit zone
        svg.appendChild(createSVGElement('polygon', {
            points: generatePaddleShape(centerAngle, true),
            fill: isHit ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,255,0.1)',
            stroke: isHit ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));

        // Base paddle
        svg.appendChild(createSVGElement('polygon', {
            points: generatePaddleShape(centerAngle, false),
            fill: isHit ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)',
            stroke: isHit ? 'red' : 'blue',
            'stroke-width': '1'
        }));
    });

    // Line from origin through point
    svg.appendChild(createSVGElement('line', {
        x1: config.center,
        y1: config.center,
        x2: config.center + state.point.x * config.scale,
        y2: config.center - state.point.y * config.scale,
        stroke: 'gray',
        'stroke-width': '1'
    }));

    // Point marker
    svg.appendChild(createSVGElement('circle', {
        cx: config.center + state.point.x * config.scale,
        cy: config.center - state.point.y * config.scale,
        r: '3',
        fill: 'yellow',
        stroke: 'black',
        'stroke-width': '1'
    }));

    // Update point info
    renderPointInfo(distance, angle, hitInfo);
//checkBallAndUpdateScores();
}

// Update HTML to include offset controls
/*function createOffsetControls() {
    const container = document.getElementById('offsetControls');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing controls
    
    for (let i = 0; i < state.sectorCount; i++) {
        const div = document.createElement('div');
        div.className = 'control-group';
        
        const label = document.createElement('label');
        label.textContent = `Paddle ${i + 1} Offset:`;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = '0';
        input.max = '1';
        input.value = state.paddleOffsets[i];
        input.step = '0.01';
        input.id = `paddleOffset${i}`;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = state.paddleOffsets[i].toFixed(2);
        
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            state.paddleOffsets[i] = value;
            valueDisplay.textContent = value.toFixed(2);
            renderPong();
        });
        
        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(valueDisplay);
        container.appendChild(div);
    }
}*/

// Helper function to get the actual angle from normalized offset
function getActualAngleFromOffset(sectorIndex, normalizedOffset) {
    const sectorSize = 360 / state.sectorCount;
    const maxOffset = (sectorSize - sectorSize * state.paddleSize) / 2;
    const offsetAngle = (normalizedOffset - 0.5) * 2 * maxOffset;
    let position = (sectorIndex * sectorSize) + offsetAngle;
    while (position >= 360) position -= 360;
    while (position < 0) position += 360;
    return position;
}



function createOffsetControls() {
    const container = document.getElementById('offsetControls');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing controls
    
    // Add constraint toggle
    const constraintDiv = document.createElement('div');
    constraintDiv.className = 'control-group';
    
    const constraintLabel = document.createElement('label');
    constraintLabel.textContent = 'Constrain to Sector: ';
    
    const constraintCheck = document.createElement('input');
    constraintCheck.type = 'checkbox';
    constraintCheck.checked = state.constrainToSector;
    constraintCheck.addEventListener('change', (e) => {
        state.constrainToSector = e.target.checked;
        renderPong();
    });
    
    constraintDiv.appendChild(constraintLabel);
    constraintDiv.appendChild(constraintCheck);
    container.appendChild(constraintDiv);
    
    const sectorSize = 360 / state.sectorCount;
    
    for (let i = 0; i < state.sectorCount; i++) {
        const div = document.createElement('div');
        div.className = 'control-group';
        
        const label = document.createElement('label');
        const sectorStart = (i * sectorSize).toFixed(1);
        const sectorEnd = ((i + 1) * sectorSize).toFixed(1);
        label.textContent = `Paddle ${i + 1} Offset :`;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = '0';
        input.max = '1';
        input.value = state.paddleOffsets[i];
        input.step = '0.01';
        input.id = `paddleOffset${i}`;
        
        const valueDisplay = document.createElement('span');
                // Create angle display
        //const angleDisplay = document.createElement('span');
        
        const updateDisplays = (value) => {
            valueDisplay.textContent = value.toFixed(2);
            if (state.constrainToSector) {
                const actualAngle = getActualAngleFromOffset(i, value);
            //    angleDisplay.textContent = ` (${actualAngle.toFixed(1)}°)`;
            } else {
                const angle = value * 360;
          //      angleDisplay.textContent = ` (${angle.toFixed(1)}°)`;
            }
        };
        
        updateDisplays(state.paddleOffsets[i]);
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            state.paddleOffsets[i] = value;
            updateDisplays(value);
		renderPong();
        });
        
        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(valueDisplay);
	//div.appendChild(angleDisplay);
        container.appendChild(div);
    }
}

// Modified initializeControls to handle offset updates
function initializeControls() {
    // Existing controls
    document.getElementById('pointX').addEventListener('change', (e) => {
        state.point.x = parseFloat(e.target.value);
        renderPong();
    });

    document.getElementById('pointY').addEventListener('change', (e) => {
        state.point.y = parseFloat(e.target.value);
        renderPong();
    });

    document.getElementById('sectorCount').addEventListener('change', (e) => {
        state.sectorCount = Math.max(2, parseInt(e.target.value));
        initializePaddleOffsets();
        createOffsetControls();
        renderPong();
    });

    document.getElementById('paddleSize').addEventListener('change', (e) => {
        state.paddleSize = Math.min(1, Math.max(0, parseFloat(e.target.value)));
        renderPong();
    });

    document.getElementById('paddleWidth').addEventListener('change', (e) => {
        state.paddleWidth = Math.min(1, Math.max(0, parseFloat(e.target.value)));
        renderPong();
    });

    document.getElementById('ballSize').addEventListener('change', (e) => {
        state.ballSize = Math.min(1, Math.max(0, parseFloat(e.target.value)));
        renderPong();
    });
document.getElementById('sectorCount').addEventListener('change', (e) => {
        state.sectorCount = Math.max(2, parseInt(e.target.value));
        initializePaddleOffsets();
        initializeScores(); // Reset scores when changing sector count
        createOffsetControls();
        renderPong();
    });
}






// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializePaddleOffsets();
initializeScores();    
    initializeControls();
createOffsetControls();
    renderPong();
});
