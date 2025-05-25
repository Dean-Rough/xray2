# XRAI Component Library v2.4.0
**Production-Ready Components for Professional Website Analysis Tool**

## 🎯 Core Components

### 1. Hero Section
```jsx
// React Component
const XraiHero = () => (
  <div className="xrai-container xrai-text-center xrai-mb-xl">
    <h1 className="text-hero xrai-mb-md">XRAI</h1>
    <p className="text-body">Professional Website Analysis Tool</p>
  </div>
);

// HTML Version
<div class="xrai-container xrai-text-center xrai-mb-xl">
  <h1 class="text-hero xrai-mb-md">XRAI</h1>
  <p class="text-body">Professional Website Analysis Tool</p>
</div>
```

### 2. Two-Column Layout
```jsx
// React Component
const XraiTwoColumn = ({ leftContent, rightContent }) => (
  <div className="xrai-container">
    <div className="xrai-grid-two-col">
      <div className="xrai-card">
        {leftContent}
      </div>
      <div className="xrai-separator-vertical" />
      <div className="xrai-card">
        {rightContent}
      </div>
    </div>
  </div>
);

// HTML Version
<div class="xrai-container">
  <div class="xrai-grid-two-col">
    <div class="xrai-card">
      <!-- Left content -->
    </div>
    <div class="xrai-separator-vertical"></div>
    <div class="xrai-card">
      <!-- Right content -->
    </div>
  </div>
</div>
```

### 3. Input Form
```jsx
// React Component
const XraiInputForm = ({ onSubmit, placeholder = "Enter website URL" }) => (
  <form onSubmit={onSubmit} className="xrai-mb-lg">
    <label className="xrai-label xrai-mb-sm">Website URL</label>
    <input 
      type="url" 
      className="xrai-input xrai-mb-md" 
      placeholder={placeholder}
      required 
    />
    <button type="submit" className="xrai-button">
      Analyze Website
    </button>
  </form>
);

// HTML Version
<form class="xrai-mb-lg">
  <label class="xrai-label xrai-mb-sm">Website URL</label>
  <input 
    type="url" 
    class="xrai-input xrai-mb-md" 
    placeholder="Enter website URL"
    required 
  />
  <button type="submit" class="xrai-button">
    Analyze Website
  </button>
</form>
```

### 4. Status Card
```jsx
// React Component
const XraiStatusCard = ({ status, message, progress }) => (
  <div className="xrai-card-elevated">
    <h3 className="text-section xrai-mb-md">{status}</h3>
    <hr className="xrai-separator-horizontal" />
    <div className="xrai-mb-md">
      <p className="text-body">{message}</p>
    </div>
    {progress && (
      <div className="xrai-card-yellow xrai-p-sm">
        <span className="xrai-label">{progress}</span>
      </div>
    )}
  </div>
);

// HTML Version
<div class="xrai-card-elevated">
  <h3 class="text-section xrai-mb-md">Analysis Status</h3>
  <hr class="xrai-separator-horizontal" />
  <div class="xrai-mb-md">
    <p class="text-body">Processing your website...</p>
  </div>
  <div class="xrai-card-yellow xrai-p-sm">
    <span class="xrai-label">75% Complete</span>
  </div>
</div>
```

### 5. Results Display
```jsx
// React Component
const XraiResults = ({ results }) => (
  <div className="xrai-card">
    <h3 className="text-section xrai-mb-md">Analysis Complete</h3>
    <hr className="xrai-separator-horizontal" />
    
    <div className="xrai-mb-lg">
      <label className="xrai-label xrai-mb-sm">Pages Analyzed</label>
      <p className="text-body">{results.pageCount} pages</p>
    </div>
    
    <div className="xrai-mb-lg">
      <label className="xrai-label xrai-mb-sm">Processing Time</label>
      <p className="text-body">{results.processingTime}</p>
    </div>
    
    <button className="xrai-button">Download Package</button>
  </div>
);

// HTML Version
<div class="xrai-card">
  <h3 class="text-section xrai-mb-md">Analysis Complete</h3>
  <hr class="xrai-separator-horizontal" />
  
  <div class="xrai-mb-lg">
    <label class="xrai-label xrai-mb-sm">Pages Analyzed</label>
    <p class="text-body">12 pages</p>
  </div>
  
  <div class="xrai-mb-lg">
    <label class="xrai-label xrai-mb-sm">Processing Time</label>
    <p class="text-body">3 minutes 42 seconds</p>
  </div>
  
  <button class="xrai-button">Download Package</button>
</div>
```

### 6. Error State
```jsx
// React Component
const XraiError = ({ error, onRetry }) => (
  <div className="xrai-card">
    <h3 className="text-section xrai-mb-md">✗ Analysis Failed</h3>
    <hr className="xrai-separator-horizontal" />
    
    <div className="xrai-card-elevated xrai-mb-lg">
      <p className="text-body">{error}</p>
    </div>
    
    <div className="xrai-mb-md">
      <h4 className="xrai-label xrai-mb-sm">Suggestions:</h4>
      <ul className="text-body">
        <li>Check if the website is accessible</li>
        <li>Verify Firecrawl API key is valid</li>
        <li>Try resuming the failed analysis</li>
        <li>Contact support if the issue persists</li>
      </ul>
    </div>
    
    <button className="xrai-button" onClick={onRetry}>
      Retry Analysis
    </button>
  </div>
);

// HTML Version
<div class="xrai-card">
  <h3 class="text-section xrai-mb-md">✗ Analysis Failed</h3>
  <hr class="xrai-separator-horizontal" />
  
  <div class="xrai-card-elevated xrai-mb-lg">
    <p class="text-body">Failed after 0s</p>
  </div>
  
  <div class="xrai-mb-md">
    <h4 class="xrai-label xrai-mb-sm">Suggestions:</h4>
    <ul class="text-body">
      <li>Check if the website is accessible</li>
      <li>Verify Firecrawl API key is valid</li>
      <li>Try resuming the failed analysis</li>
      <li>Contact support if the issue persists</li>
    </ul>
  </div>
  
  <button class="xrai-button">Retry Analysis</button>
</div>
```

### 7. Navigation/Header
```jsx
// React Component
const XraiHeader = () => (
  <header className="xrai-container xrai-mb-xl">
    <div className="xrai-grid-two-col">
      <div>
        <h1 className="text-hero">XRAI</h1>
      </div>
      <div className="xrai-text-center">
        <nav>
          <button className="xrai-button-secondary xrai-mr-md">
            Documentation
          </button>
          <button className="xrai-button">
            New Analysis
          </button>
        </nav>
      </div>
    </div>
    <hr className="xrai-separator-section" />
  </header>
);

// HTML Version
<header class="xrai-container xrai-mb-xl">
  <div class="xrai-grid-two-col">
    <div>
      <h1 class="text-hero">XRAI</h1>
    </div>
    <div class="xrai-text-center">
      <nav>
        <button class="xrai-button-secondary xrai-mr-md">
          Documentation
        </button>
        <button class="xrai-button">
          New Analysis
        </button>
      </nav>
    </div>
  </div>
  <hr class="xrai-separator-section" />
</header>
```

## 🎨 Layout Patterns

### Full Page Layout
```jsx
const XraiApp = () => (
  <div className="xrai-app">
    <XraiHeader />
    <main className="xrai-container">
      <XraiTwoColumn 
        leftContent={<XraiInputForm />}
        rightContent={<XraiStatusCard />}
      />
    </main>
  </div>
);
```

### Responsive Considerations
- Two-column layout stacks on mobile
- Vertical separators hide on mobile
- Font sizes scale down appropriately
- Touch-friendly button sizes maintained

## 🔧 Implementation Notes

### Required CSS
Include the complete XRAI styles:
```html
<link rel="stylesheet" href="xrai-complete-styles.css">
```

### Font Loading
Include font declarations before the main stylesheet:
```html
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="xrai-complete-styles.css">
```

### Accessibility
- All interactive elements have focus states
- Semantic HTML structure maintained
- ARIA labels where appropriate
- Color contrast meets WCAG standards

---

**This component library provides everything needed to build professional XRAI interfaces with perfect brand consistency.**
