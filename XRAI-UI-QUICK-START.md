# XRAI UI Styles - Quick Start

## Files You Need
- `xrai-ui-styles.css` - Complete UI system
- `xrai-fonts.css` - Font loading
- `StyreneB-Regular.otf` - Display font

## Colors
```css
#212121  /* Black */
#F7FDF4  /* Light Gray */
#FCCC00  /* Yellow */
#FFFFFF  /* White */
```

## Usage
```html
<link rel="stylesheet" href="xrai-fonts.css">
<link rel="stylesheet" href="xrai-ui-styles.css">
```

## Components
```html
<!-- Hero -->
<h1 class="text-hero">XRAI</h1>

<!-- Cards -->
<div class="xrai-card">Content</div>
<div class="xrai-card-elevated">Elevated</div>
<div class="xrai-card-yellow">Yellow</div>

<!-- Buttons -->
<button class="xrai-button">Primary</button>
<button class="xrai-button-secondary">Secondary</button>

<!-- Inputs -->
<input class="xrai-input" placeholder="Enter text">

<!-- Layout -->
<div class="xrai-container">
  <div class="xrai-grid-two-col">
    <div>Left</div>
    <div class="xrai-separator-vertical"></div>
    <div>Right</div>
  </div>
</div>

<!-- Separators -->
<hr class="xrai-separator-horizontal">
<hr class="xrai-separator-section">
```

## Typography
- `text-hero` - Large headers (Styrene A)
- `text-section` - Section headers (Styrene A)
- `text-body` - Body text (Inter)
- `xrai-label` - UI labels (Inter, uppercase)

## Spacing
- `xrai-mb-sm/md/lg/xl` - Margin bottom
- `xrai-mt-sm/md/lg/xl` - Margin top
- `xrai-p-sm/md/lg` - Padding

That's it. Clean, simple, professional.
