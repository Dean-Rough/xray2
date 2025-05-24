# 🎯 CLAUDE SONNET WEBSITE RECONSTRUCTION PROMPT

## 🚀 MISSION CONTEXT
You are Claude Sonnet, an elite AI developer with access to a comprehensive website analysis package. Your task is to rebuild the website **https://repeat.studiofreight.com** with pixel-perfect accuracy using modern web development practices.

## 📦 PACKAGE CONTENTS
This analysis package contains:
- **7 pages** with full-page screenshots and extracted code
- **21 identified components** across 7 categories
- **7 assets** categorized and ready for download
- **Performance benchmarks** from Lighthouse analysis
- **Technical specifications** and component documentation

## 🎨 VISUAL ANALYSIS WORKFLOW

### Step 1: Screenshot Review Protocol
1. **Open screenshots/ folder** - These are full-page captures showing exact visual targets
2. **Analyze layout patterns** - Identify grid systems, spacing, typography hierarchy
3. **Note responsive breakpoints** - Look for mobile/tablet/desktop variations
4. **Catalog interactive elements** - Buttons, forms, navigation, animations
5. **Document color palette** - Extract exact colors from visual elements

### Step 2: Code Structure Analysis
1. **Review pages/ folder** - Contains extracted HTML/CSS for each page
2. **Identify semantic structure** - Headers, main content, sidebars, footers
3. **Extract CSS patterns** - Classes, IDs, styling approaches
4. **Note JavaScript functionality** - Interactive elements and behaviors

## 🏗️ CLAUDE SONNET RECONSTRUCTION STRATEGY

### Phase 1: Foundation Setup
```bash
# Create project structure optimized for modern development
mkdir website-rebuild && cd website-rebuild
npm init -y
npm install -D tailwindcss postcss autoprefixer vite
# OR use your preferred framework (Next.js, Nuxt, SvelteKit)
```

### Phase 2: Component-First Development
Based on the analysis, implement these components in order:


#### Navigation Components (1 identified)
- **Priority**: HIGH
- **Implementation**: Create reusable navigation component(s)
- **Files**: Check docs/components.md for detailed analysis

#### Footer Components (1 identified)
- **Priority**: MEDIUM
- **Implementation**: Create reusable footer component(s)
- **Files**: Check docs/components.md for detailed analysis

#### Header Components (1 identified)
- **Priority**: HIGH
- **Implementation**: Create reusable header component(s)
- **Files**: Check docs/components.md for detailed analysis

#### Sidebar Components (4 identified)
- **Priority**: LOW
- **Implementation**: Create reusable sidebar component(s)
- **Files**: Check docs/components.md for detailed analysis

#### Cards Components (13 identified)
- **Priority**: LOW
- **Implementation**: Create reusable cards component(s)
- **Files**: Check docs/components.md for detailed analysis

#### Forms Components (1 identified)
- **Priority**: LOW
- **Implementation**: Create reusable forms component(s)
- **Files**: Check docs/components.md for detailed analysis

#### Custom Components (0 identified)
- **Priority**: LOW
- **Implementation**: Create reusable custom component(s)
- **Files**: Check docs/components.md for detailed analysis


### Phase 3: Page Assembly
Reconstruct pages in this order:
1. **Homepage** (primary entry point)
2. **Navigation pages** (main menu items)
3. **Content pages** (secondary pages)
4. **Utility pages** (404, contact, etc.)

## 🎯 CLAUDE SONNET SPECIFIC INSTRUCTIONS

### Code Quality Standards
- **Use semantic HTML5** - Proper heading hierarchy, landmarks, ARIA labels
- **Implement responsive design** - Mobile-first approach with progressive enhancement
- **Optimize performance** - Meet or exceed original Lighthouse scores
- **Follow accessibility guidelines** - WCAG 2.1 AA compliance
- **Use modern CSS** - Flexbox, Grid, custom properties, logical properties

### Technology Recommendations
Based on analysis, the original site uses: **Standard HTML/CSS/JS**

**Recommended modern stack:**
- **Framework**: Vite + vanilla JS
- **Styling**: CSS Modules or Styled Components
- **Build tool**: Vite for optimal development experience

### Performance Targets
- Optimize page load performance to improve user experience

## 📋 IMPLEMENTATION CHECKLIST

### ✅ Visual Fidelity
- [ ] Layout matches screenshots exactly
- [ ] Typography hierarchy preserved
- [ ] Color palette accurate
- [ ] Spacing and proportions correct
- [ ] Interactive states implemented

### ✅ Technical Excellence
- [ ] Semantic HTML structure
- [ ] Responsive design working
- [ ] Performance optimized
- [ ] Accessibility compliant
- [ ] Cross-browser compatible

### ✅ Functionality
- [ ] Navigation working
- [ ] Forms functional
- [ ] Interactive elements responsive
- [ ] Loading states implemented
- [ ] Error handling in place

## 🔧 DEBUGGING RESOURCES

### File References
- **Visual targets**: `screenshots/` folder
- **Code examples**: `pages/` folder
- **Component analysis**: `docs/components.md`
- **Performance data**: `docs/performance.md`
- **Asset inventory**: `assets/manifest.json`

### Common Issues & Solutions
1. **Missing assets**: Use `assets/download-assets.sh` script
2. **Layout differences**: Compare with screenshots pixel by pixel
3. **Performance issues**: Reference original Lighthouse scores
4. **Responsive problems**: Test across all device sizes

## 🎨 DESIGN SYSTEM EXTRACTION

### Colors Identified
- Extract from screenshots

### Typography
- Analyze from page HTML

### Design Patterns
- Standard web patterns identified

## 🚀 DEPLOYMENT READINESS

When reconstruction is complete:
1. **Test thoroughly** across devices and browsers
2. **Validate HTML/CSS** using W3C validators
3. **Run Lighthouse audit** to verify performance
4. **Deploy to staging** for final review
5. **Go live** with confidence

---

**Generated**: 2025-05-23T23:56:28.619Z
**Package Version**: 2.0.0 (Claude Sonnet Optimized)
**Analysis ID**: he1hgxdka

> 💡 **Claude Sonnet Tip**: Start with the homepage screenshot and work systematically through each component. Your attention to detail and modern development practices will ensure a superior rebuild.
