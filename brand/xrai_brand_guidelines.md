Application that prioritizes clean typography and refined aesthetics. The brand identity emphasizes technical precision through carefully selected typefaces and a restrained color palette.

## Typography

### Primary Typeface: Timmons NY
- **Usage**: Headers, app titles, primary navigation, section titles
- **Style**: Geometric, stark, precise letterforms
- **Character**: Technical precision, professional-grade aesthetic
- **Implementation**: Use for all H1-H3 elements, main navigation, feature titles

### Secondary Typeface: Styrene B
- **Usage**: Body text, interface labels, secondary information, buttons
- **Style**: Clean sans-serif, exceptional readability
- **Character**: Clinical precision, optimal legibility
- **Implementation**: Use for all body text, form labels, parameter values, tooltips

## Color Palette

### Primary Colors
- **Pure Black**: `#000000`
  - Primary text, headers, high-contrast elements
- **Pure White**: `#FFFFFF` 
  - Background, negative space, contrast elements

### Accent Colors
- **Signal Yellow**: `#FFD700`
  - Interactive elements, highlights, active states, CTAs
- **Warm Gray**: `#F5F5F5`
  - Secondary backgrounds, subtle separators

### Functional Colors
- **Dark Gray**: `#333333`
  - Secondary text, inactive states
- **Medium Gray**: `#666666`
  - Placeholder text, disabled elements
- **Light Gray**: `#E0E0E0`
  - Borders, dividers, input fields

## Visual Principles

### Radical Simplicity
- Every visual element serves a functional purpose
- Eliminate decorative elements that don't enhance usability
- Prioritize content over ornamentation

### Whitespace Mastery
- Generous spacing between elements
- Allow typography to breathe
- Create premium feel through restraint

### Technical Precision  
- Align all elements to a consistent grid
- Use consistent spacing increments (8px, 16px, 24px, 32px)
- Maintain pixel-perfect accuracy

### Hierarchy Through Typography
- Use font weight and size to establish clear information hierarchy
- Limit to 3-4 text sizes maximum
- Rely on spacing and typography rather than color for emphasis

## Implementation Guidelines

### Layout
- 24px base grid system
- Minimum 16px padding on mobile
- Maximum content width: 1200px
- Consistent 8px spacing increments

### Interactive Elements
- Use Signal Yellow for primary actions
- Maintain 44px minimum touch targets
- Subtle hover states using opacity changes
- No rounded corners (maintain geometric precision)

### Audio Interface Specifics
- Waveforms in Pure Black on White background
- Transport controls use Signal Yellow for active/playing states
- Parameter values in Styrene B, labels in Timmons NY
- VU meters and level indicators use gradient from Black to Signal Yellow

## Usage Examples

```css
/* Headers */
h1, h2, h3 { 
  font-family: 'Timmons NY', sans-serif; 
  color: #000000; 
}

/* Body Text */
body, p, label { 
  font-family: 'Styrene B', sans-serif; 
  color: #333333; 
}

/* Primary Button */
.btn-primary { 
  background: #FFD700; 
  color: #000000; 
  font-family: 'Styrene B', sans-serif; 
}
```

## Don'ts
- No gradients except for functional UI elements (sliders, meters)
- No drop shadows or decorative effects
- No colored text except for error states
- No script or decorative typefaces
- No rounded corners on containers
