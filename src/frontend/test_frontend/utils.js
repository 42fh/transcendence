// utils.js
export const SVGUtils = {
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
    },

    transformVertices(vertices, config) {
        return vertices.map(vertex => ({
            x: config.center + vertex.x * config.scale,
            y: config.center - vertex.y * config.scale
        }));
    }
};
