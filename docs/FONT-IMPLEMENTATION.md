# XRAI Font Implementation Guide

## 📝 Font Stack Overview

### Primary Fonts
1. **Styrene B Bold** - Display text, headers, emphasis
2. **Inter** - Body text, UI elements, readable content

### Font Files Required
```
fonts/
├── StyreneB-Bold.otf          # Primary display font
├── Inter-Regular.woff2        # Body text (400 weight)
├── Inter-Medium.woff2         # Emphasis text (500 weight)
└── Inter-Bold.woff2           # Strong emphasis (700 weight)
```

## 🎯 CSS Font Face Declarations

```css
/* Styrene B Bold - Display Font */
@font-face {
  font-family: 'Styrene B';
  src: url('./fonts/StyreneB-Bold.otf') format('opentype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

/* Inter Regular - Body Text */
@font-face {
  font-family: 'Inter';
  src: url('./fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Inter Medium - Emphasis */
@font-face {
  font-family: 'Inter';
  src: url('./fonts/Inter-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

/* Inter Bold - Strong Emphasis */
@font-face {
  font-family: 'Inter';
  src: url('./fonts/Inter-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

## 📐 Typography Usage Rules

### Styrene B Bold Usage
- **Hero headlines** (2.5rem, bold)
- **Section headers** (1.5rem, bold)
- **Important labels** (0.875rem, bold, uppercase)
- **Brand elements** and emphasis

### Inter Usage
- **Body text** (1rem, 400 weight)
- **UI labels** (0.875rem, 500 weight)
- **Button text** (0.875rem, 500 weight, uppercase)
- **Form inputs** (1rem, 400 weight)

## 🔧 Implementation Steps

### 1. Download Font Files
- Styrene B Bold: Available in `/brand/App-fonts/StyreneB-Bold.otf`
- Inter fonts: Download from Google Fonts or use CDN

### 2. Add Font Face Declarations
Include the CSS above in your main stylesheet or create a separate fonts.css file.

### 3. Apply Font Stack
Use the CSS variables from the complete style system:
```css
:root {
  --font-display: 'Styrene B', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 4. Fallback Strategy
Always include system font fallbacks:
- `-apple-system` for macOS/iOS
- `BlinkMacSystemFont` for Chrome on macOS
- `sans-serif` as final fallback

## 🌐 CDN Alternative (Inter Only)

For Inter fonts, you can use Google Fonts CDN:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

## ⚡ Performance Optimization

### Font Loading Strategy
```css
/* Use font-display: swap for better performance */
@font-face {
  font-family: 'Styrene B';
  src: url('./fonts/StyreneB-Bold.otf') format('opentype');
  font-weight: bold;
  font-style: normal;
  font-display: swap; /* Shows fallback font first, then swaps */
}
```

### Preload Critical Fonts
```html
<link rel="preload" href="./fonts/StyreneB-Bold.otf" as="font" type="font/otf" crossorigin>
<link rel="preload" href="./fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

## 🎨 Typography Scale Reference

```css
/* Hero Text - Styrene B Bold */
.text-hero {
  font-family: var(--font-display);
  font-weight: bold;
  font-size: 2.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* Section Headers - Styrene B Bold */
.text-section {
  font-family: var(--font-display);
  font-weight: bold;
  font-size: 1.5rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

/* Body Text - Inter Regular */
.text-body {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.5;
}

/* Labels - Inter Medium */
.xrai-label {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## 🚫 Font Usage Restrictions

### DO NOT USE:
- **Courier or monospace fonts** - Not part of brand
- **Decorative fonts** - Maintain professional restraint
- **Multiple font families** - Stick to Styrene B + Inter only
- **Italic styles** - Use weight variations instead
- **Condensed or extended variants** - Standard widths only

### REQUIRED:
- **Consistent font stack** across all elements
- **Proper fallbacks** for accessibility
- **Performance optimization** with font-display: swap
- **Semantic font usage** (display vs body text)

---

**This font implementation guide ensures perfect typography consistency across any XRAI implementation.**
