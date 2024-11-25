# Frontend Style Guidelines

## CSS Architecture

### 1. Layout System

#### 1.1 Base Container Pattern

Every page in the application uses a common base container with modifiers for specific pages:

Base container - common layout properties:

```css
.page-container {
  width: var(--page-width);
  height: var(--page-height);
  min-height: var(--page-min-height);
  padding-bottom: var(--page-padding-bottom);
  position: relative;
  align-items: center;
}

page-specificmodifiers: .page-container--home {
  display: grid;
  grid-template-rows: 1fr 2fr;
}

.page-container--tournament {
  display: flex;
  flex-direction: column;
}
```

#### 1.2 CSS Variables

Common values are stored as CSS variables for consistency:

```css
:root {
  --page-width: 80vw;
  --page-height: 80vh;
  --page-min-height: calc(100vh - var(--bottom-nav-height));
  --page-padding-bottom: var(--bottom-nav-height);
}
```

### 2. BEM Naming Convention

We follow the BEM (Block Element Modifier) methodology:

- Block: The main component (e.g., page-container)
- Element: A part of the block (e.g., page-container\_\_title)
- Modifier: A variation of the block (e.g., page-container--home)

Example:

```html
<div class="page-container page-container--home">
  <h1 class="page-container__title">PONG</h1>
  <div class="page-container__content">
    <!-- Content here -->
  </div>
</div>
```

### 3. Implementation Guidelines

#### 3.1 Creating New Pages

When creating a new page:

1. Use the base container class:
<div class="page-container page-container--your-page">

2. Create specific modifiers for layout:

```css
.page-container--your-page {
  /* Your specific layout rules  */
}
```

3. Use BEM for child elements:

```css
.page-container__your-element {
  /* Element styles  */
}
```

### 4. Responsive Design

- Use mobile-first approach
- Define breakpoints using variables:

```css
:root {
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
}
```

### 5. Code Organization & Best Practices

- Use variables for repeated values

### 6. Random Resources

**Buttons**

_Collections_

- https://dev.to/webdeasy/top-20-css-buttons-animations-f41
- https://freefrontend.com/css-buttons/
- https://webdeasy.de/en/css-buttons-en/
- https://getcssscan.com/css-buttons-examples

_Picked up_

- https://codepen.io/kocsten/pen/rggjXp
- https://codepen.io/webLeister/pen/XwGENz/
- https://codepen.io/valentingalmand/pen/MYMZZK (click it!)
- https://codepen.io/hakimel/pen/ZYRgwB (click this as well!)
- https://codepen.io/nP-NIHAD-PASA-/pen/BaxJNjw
