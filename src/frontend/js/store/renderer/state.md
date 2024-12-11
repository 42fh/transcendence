# SVG Dimensions and ViewBox Guide

## SVG Dimensions (width/height)

SVG dimensions can be set in three ways:

1. HTML attributes:

```html
<svg width="800" height="600"></svg>
```

2. Inline CSS:

```html
<svg style="width: 800px; height: 600px"></svg>
```

3. CSS stylesheet:

```css
svg {
  width: 800px;
  height: 600px;
}
```

### Key Differences:

- HTML attributes define the intrinsic size (default if CSS isn't specified)
- CSS dimensions override HTML attributes and offer:
  - Responsive sizing (%, vh, vw)
  - Media query support
  - Animation capabilities
  - Easier maintenance in stylesheets

### Best Practices:

- Use CSS for responsive designs
- Use HTML attributes as fallbacks
- Be consistent within your application

## ViewBox

The viewBox attribute defines the SVG's coordinate system and aspect ratio.

### Syntax:

<svg viewBox="min-x min-y width height">

### Default Behavior:

- When viewBox is omitted:
  - No transformation is applied
  - Coordinate system matches the SVG's width/height
  - One unit equals one pixel
  - Origin (0,0) is top-left corner

### Examples:

1. No viewBox (natural coordinates):
   <svg width="800" height="600">
   <!-- Coordinates match pixels 1:1 -->
   <circle cx="400" cy="300" r="50"/>
   </svg>

2. ViewBox matching dimensions (identity transform):
   <svg width="800" height="600" viewBox="0 0 800 600">
   <!-- Behaves the same as no viewBox -->
   <circle cx="400" cy="300" r="50"/>
   </svg>

3. ViewBox scaling:
   <svg width="800" height="600" viewBox="0 0 400 300">
   <!-- Everything is scaled 2x -->
   <!-- To appear at center, use: -->
   <circle cx="200" cy="150" r="25"/>
   </svg>

### Important Concepts:

1. ViewBox is a transformation matrix
2. It maps the specified coordinate space to the SVG's container size
3. Content outside viewBox bounds may not be visible
4. Affects coordinate system but not physical size

### Use Cases:

- Zoom levels
- Responsive scaling
- Coordinate system transformations
- Maintaining aspect ratios

### Best Practices:

1. Match viewBox to intended coordinate system
2. Consider using viewBox for:
   - Consistent scaling across different screen sizes
   - Logical coordinate systems (e.g., -1 to 1)
   - Zoom functionality
3. Document coordinate system choices

### Example with Multiple Concepts:

<!-- Physical size via CSS for responsiveness -->
<style>
.game-svg {
    width: 100%;
    max-width: 800px;
    height: auto;
    aspect-ratio: 4/3;
}
</style>

<!-- Coordinate system via viewBox -->
<svg class="game-svg" viewBox="-100 -100 200 200">
    <!-- Centered coordinate system -->
    <circle cx="0" cy="0" r="50"/>
</svg>

This setup provides:

- Responsive sizing
- Centered coordinate system
- Consistent scaling
- Preserved aspect ratio
