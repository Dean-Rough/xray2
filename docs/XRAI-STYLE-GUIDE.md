# XRAI Style Guide v2.4.0
**Professional Website Analysis Tool - Complete Brand & Design System**

## 🎨 Brand Colors (STRICT ADHERENCE REQUIRED)

### Primary Palette
```css
--color-black: #212121        /* Primary text, borders, structural elements */
--color-light-gray: #F7FDF4   /* Card backgrounds, elevated surfaces */
--color-yellow: #FCCC00       /* Primary accent, buttons, highlights */
--color-white: #FFFFFF        /* Main background, contrast elements */
```

### Usage Rules
- **ONLY these 4 colors allowed** - No variations, no semi-transparent, no additional colors
- **No opacity/alpha values** - All colors must be solid hex values
- **No gradients** - Flat design only
- **No color bleeding** - Strict adherence to palette

## 📝 Typography

### Font Stack
```css
/* Headers & Display Text */
font-family: 'Styrene B', -apple-system, BlinkMacSystemFont, sans-serif;

/* Body Text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Weights
- **Styrene B Bold** - Headers, important labels, emphasis
- **Inter Regular (400)** - Body text, descriptions, content
- **Inter Medium (500)** - Subtle emphasis, secondary headers

### Typography Scale
```css
.text-hero {
  font-family: 'Styrene B', sans-serif;
  font-weight: bold;
  font-size: 2.5rem;
  line-height: 1.2;
  color: var(--color-black);
}

.text-section {
  font-family: 'Styrene B', sans-serif;
  font-weight: bold;
  font-size: 1.5rem;
  line-height: 1.3;
  color: var(--color-black);
}

.text-body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-black);
}

.xrai-label {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## 🏗️ Layout System

### Spacing Variables
```css
:root {
  --space-xs: 0.25rem;    /* 4px */
  --space-sm: 0.5rem;     /* 8px */
  --space-md: 1rem;       /* 16px */
  --space-lg: 1.5rem;     /* 24px */
  --space-xl: 2rem;       /* 32px */
  --space-2xl: 3rem;      /* 48px */
  --space-3xl: 4rem;      /* 64px */
}
```

### Grid System
- **Two-column layout** for main content areas
- **Flexbox** for component alignment
- **Max-width containers** for content centering
- **Consistent spacing** using CSS variables

## 🎯 Component Library

### Card Components
```css
.xrai-card {
  background: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--space-md);
  transition: all 0.2s ease;
}

.xrai-card:hover {
  border-color: var(--color-yellow);
}

.xrai-card-elevated {
  background: var(--color-light-gray);
  border: 1px solid var(--color-black);
  padding: var(--space-md);
}

.xrai-card-yellow {
  background: var(--color-yellow);
  border: 1px solid var(--color-black);
  padding: var(--space-md);
}
```

### Button Components
```css
.xrai-button {
  background: var(--color-yellow);
  color: var(--color-black);
  border: 1px solid var(--color-black);
  padding: var(--space-sm) var(--space-lg);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.xrai-button:hover {
  background: var(--color-black);
  color: var(--color-yellow);
}

.xrai-button-secondary {
  background: var(--color-white);
  color: var(--color-black);
  border: 1px solid var(--color-black);
}

.xrai-button-secondary:hover {
  background: var(--color-light-gray);
}
```

### Input Components
```css
.xrai-input {
  background: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--space-sm) var(--space-md);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: var(--color-black);
  width: 100%;
}

.xrai-input:focus {
  outline: none;
  border-color: var(--color-yellow);
}

.xrai-input::placeholder {
  color: var(--color-black);
  opacity: 0.6;
}
```

### Separator Components
```css
.xrai-separator-horizontal {
  width: 100%;
  height: 1px;
  background: var(--color-black);
  margin: var(--space-lg) 0;
}

.xrai-separator-vertical {
  width: 1px;
  height: 100%;
  background: var(--color-black);
  margin: 0 var(--space-lg);
}

.xrai-separator-section {
  width: 100%;
  height: 2px;
  background: var(--color-yellow);
  margin: var(--space-2xl) 0;
}
```

## 🖼️ Visual Elements

### Logo Usage
- **90-degree rotation** for side placement
- **Black version** on light backgrounds
- **Consistent sizing** across applications
- **Proper spacing** from other elements

### Favicon
- **Minimal X design** on black background
- **Yellow X** (#FCCC00) on black (#212121)
- **Square format** with clean geometry
- **Scalable** for all device sizes

## 📐 Design Principles

### Minimalism
- **Clean lines** and geometric precision
- **Ample whitespace** for breathing room
- **No visual clutter** or unnecessary elements
- **Professional restraint** in all design choices

### Sophistication
- **Award-worthy aesthetics** following Awwwards/Behance standards
- **Subtle effects** over flashy animations
- **Professional tool feel** rather than consumer SaaS
- **Editorial design influence** with structured layouts

### Consistency
- **Strict brand compliance** across all elements
- **Unified component system** for scalability
- **Predictable interactions** and behaviors
- **Systematic approach** to all design decisions

## 🎭 Interaction Design

### Hover States
- **Border color changes** to yellow on hover
- **Background transitions** for buttons
- **Subtle animations** (0.2s ease)
- **No dramatic effects** - professional restraint

### Focus States
- **Yellow border** for focused inputs
- **Clear visual feedback** for accessibility
- **Consistent across all interactive elements**

### Loading States
- **Informative text** explaining process duration
- **Progress indication** without flashy animations
- **Professional status messaging**

## 🚫 What NOT to Do

### Forbidden Elements
- **No emojis** anywhere in the interface
- **No rounded corners** - sharp, geometric design only
- **No drop shadows** - flat design principles
- **No color variations** outside the 4-color palette
- **No decorative fonts** - stick to Styrene B and Inter
- **No gradients** or complex visual effects
- **No semi-transparent colors** or opacity effects

### Anti-Patterns
- **Consumer SaaS aesthetics** - avoid flashy, marketing-heavy design
- **Overly playful elements** - maintain professional restraint
- **Inconsistent spacing** - use CSS variables religiously
- **Color bleeding** - strict adherence to brand palette only

## 📦 Complete Package Contents

### Files Included
```
docs/
├── XRAI-STYLE-GUIDE.md           # This comprehensive style guide
├── xrai-complete-styles.css      # Production-ready CSS system
├── FONT-IMPLEMENTATION.md        # Font setup and usage guide
├── XRAI-COMPONENT-LIBRARY.md     # React/HTML component examples
├── StyreneB-Bold.otf             # Primary display font file
├── xrai-dark.svg                 # Official logo file
└── IMPLEMENTATION-CHECKLIST.md   # Step-by-step setup guide
```

### Quick Start
1. **Copy all files** to your project
2. **Include CSS** in your HTML head
3. **Load fonts** using the font implementation guide
4. **Use components** from the component library
5. **Follow brand rules** strictly

## 🚀 Implementation Priority

### Phase 1: Core Setup
- [ ] Include `xrai-complete-styles.css`
- [ ] Load `StyreneB-Bold.otf` font
- [ ] Set up CSS variables
- [ ] Test basic typography

### Phase 2: Components
- [ ] Implement card components
- [ ] Add button styles
- [ ] Create input forms
- [ ] Build layout grid

### Phase 3: Polish
- [ ] Add hover states
- [ ] Implement separators
- [ ] Test responsive design
- [ ] Validate brand compliance

---

**This style guide represents the complete XRAI v2.4.0 design system. Every element has been carefully crafted for professional sophistication and brand consistency.**
