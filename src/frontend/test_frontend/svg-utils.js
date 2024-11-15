// svg-utils.js

export class SVGUtils {
    /**
     * Creates an SVG element with the specified attributes
     */
    static createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    /**
     * Creates an arc path for circular paddles
     */
    static createPaddleArc(cx, cy, radius, startAngle, endAngle, width) {
        const innerRadius = radius - width;
        
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        
        const x3 = cx + innerRadius * Math.cos(endAngle);
        const y3 = cy + innerRadius * Math.sin(endAngle);
        const x4 = cx + innerRadius * Math.cos(startAngle);
        const y4 = cy + innerRadius * Math.sin(startAngle);

        const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

        return `M ${x1} ${y1} ` +
               `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} ` +
               `L ${x3} ${y3} ` +
               `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} ` +
               'Z';
    }

    /**
     * Creates a polygon points string from an array of points
     */
    static createPolygonPoints(points) {
        return points.map(p => `${p.x},${p.y}`).join(' ');
    }

    /**
     * Creates a linear gradient definition
     */
    static createLinearGradient(svg, id, color1, color2, angle = 90) {
        const gradient = this.createSVGElement('linearGradient', {
            id,
            gradientUnits: 'userSpaceOnUse'
        });

        // Convert angle to x1,y1 and x2,y2
        const radian = (angle - 90) * Math.PI / 180;
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', `${Math.cos(radian) * 100}%`);
        gradient.setAttribute('y2', `${Math.sin(radian) * 100}%`);

        const stop1 = this.createSVGElement('stop', {
            offset: '0%',
            'stop-color': color1
        });

        const stop2 = this.createSVGElement('stop', {
            offset: '100%',
            'stop-color': color2
        });

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);

        const defs = svg.querySelector('defs') || svg.insertBefore(this.createSVGElement('defs'), svg.firstChild);
        defs.appendChild(gradient);

        return `url(#${id})`;
    }

    /**
     * Creates a glow filter
     */
    static createGlowFilter(svg, id, color, strength = 3) {
        const filter = this.createSVGElement('filter', {
            id,
            width: '300%',
            height: '300%',
            x: '-100%',
            y: '-100%'
        });

        const colorMatrix = this.createSVGElement('feColorMatrix', {
            type: 'matrix',
            values: '0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0'
        });

        const gaussianBlur = this.createSVGElement('feGaussianBlur', {
            stdDeviation: strength,
            result: 'coloredBlur'
        });

        const merge = this.createSVGElement('feMerge');
        merge.appendChild(this.createSVGElement('feMergeNode', { in: 'coloredBlur' }));
        merge.appendChild(this.createSVGElement('feMergeNode', { in: 'SourceGraphic' }));

        filter.appendChild(colorMatrix);
        filter.appendChild(gaussianBlur);
        filter.appendChild(merge);

        const defs = svg.querySelector('defs') || svg.insertBefore(this.createSVGElement('defs'), svg.firstChild);
        defs.appendChild(filter);

        return `url(#${id})`;
    }
}
