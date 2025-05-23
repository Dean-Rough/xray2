/**
 * Documentation generation utilities for the Website Rebuild Prompt Generator
 * Transforms scraped website data into Claude Sonnet-optimized prompts and comprehensive packages
 */

import JSZip from 'jszip';

/**
 * Generate a comprehensive website rebuild package
 * @param siteMapData - Processed site map data
 * @param contentData - Processed content data for each page
 * @param performanceData - Processed performance metrics
 * @param structuredData - Extracted structured data about the website
 * @param analysisId - Unique ID for this analysis
 * @returns A comprehensive package with multiple files and folders
 */
export async function generateWebsiteRebuildPackage(
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>,
  structuredData: Record<string, unknown>,
  analysisId: string
) {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const packageName = `website-rebuild-${timestamp}`;

  // 1. Generate the main AI prompt (Markdown)
  const promptMarkdown = generatePromptMarkdown(siteMapData, contentData, performanceData, structuredData);
  zip.file(`${packageName}/README.md`, promptMarkdown);

  // 2. Save individual page HTML files
  const pagesFolder = zip.folder(`${packageName}/pages`);
  await savePageFiles(pagesFolder!, contentData);

  // 3. Save screenshots
  const screenshotsFolder = zip.folder(`${packageName}/screenshots`);
  await saveScreenshots(screenshotsFolder!, contentData);

  // 4. Save downloaded assets
  const assetsFolder = zip.folder(`${packageName}/assets`);
  await saveAssets(assetsFolder!, contentData);

  // 5. Generate technical documentation
  const docsFolder = zip.folder(`${packageName}/docs`);
  await generateTechnicalDocs(docsFolder!, siteMapData, contentData, performanceData, structuredData);

  // 6. Create package manifest
  const manifest = generatePackageManifest(siteMapData, contentData, performanceData, structuredData, analysisId);
  zip.file(`${packageName}/package.json`, JSON.stringify(manifest, null, 2));

  return {
    zip,
    packageName,
    manifest
  };
}

/**
 * Legacy function for backward compatibility
 * @param siteMapData - Processed site map data
 * @param contentData - Processed content data for each page
 * @param performanceData - Processed performance metrics
 * @param structuredData - Extracted structured data about the website
 * @returns A structured prompt object optimized for Claude Sonnet
 */
export function generateSonnetPrompt(
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>,
  structuredData: Record<string, unknown>
) {
  // Create the base prompt structure
  const prompt = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      generatedFor: 'Claude Sonnet AI IDE',
      promptType: 'website-reconstruction'
    },
    siteOverview: generateSiteOverview(siteMapData, structuredData),
    pageDetails: generatePageDetails(contentData),
    components: identifyComponents(contentData),
    assets: extractAssetReferences(contentData),
    performanceConsiderations: generatePerformanceGuidelines(performanceData),
    reconstructionInstructions: generateReconstructionInstructions(siteMapData, structuredData)
  };

  return prompt;
}

/**
 * Generate a comprehensive site overview section
 * @param siteMapData - Processed site map data
 * @param structuredData - Extracted structured data about the website
 * @returns Site overview section
 */
function generateSiteOverview(siteMapData: Record<string, unknown>, structuredData: Record<string, unknown>) {
  const pageCount = (siteMapData.pages as unknown[])?.length || 0;
  const technologies = (structuredData?.technologies as string[]) || [];
  const designPatterns = (structuredData?.designPatterns as string[]) || [];
  const colorPalette = (structuredData?.colorPalette as string[]) || [];
  const fontFamilies = (structuredData?.fontFamilies as string[]) || [];

  return {
    title: 'Site Overview',
    description: `This website consists of ${pageCount} pages with the following structure and characteristics:`,
    structure: siteMapData.structure || {},
    pageHierarchy: generatePageHierarchy(siteMapData),
    technologies,
    designPatterns,
    colorPalette,
    fontFamilies,
    keyFeatures: (structuredData?.keyFeatures as string[]) || []
  };
}

/**
 * Generate a hierarchical representation of the site's pages
 * @param siteMapData - Processed site map data
 * @returns Hierarchical page structure
 */
function generatePageHierarchy(siteMapData: Record<string, unknown>) {
  const pages = (siteMapData.pages as string[]) || [];
  const hierarchy: Record<string, unknown[]> = {};

  // Group pages by path depth
  pages.forEach((url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter(Boolean);
      const depth = segments.length;

      if (!hierarchy[depth]) {
        hierarchy[depth] = [];
      }

      hierarchy[depth].push({
        url,
        path,
        segments
      });
    } catch (error) {
      console.warn(`Error processing URL for hierarchy: ${url}`, error);
    }
  });

  return hierarchy;
}

/**
 * Generate detailed information for each page
 * @param contentData - Processed content data for each page
 * @returns Page-by-page details
 */
function generatePageDetails(contentData: Record<string, unknown>) {
  const pageDetails: Record<string, unknown> = {};

  // Process each page's content data
  Object.entries(contentData).forEach(([url, data]) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const pageName = path === '/' ? 'Homepage' : path.split('/').filter(Boolean).pop() || path;
      const pageData = data as Record<string, unknown>;

      pageDetails[url] = {
        title: (pageData.metadata as Record<string, unknown>)?.title || pageName,
        path,
        htmlStructure: generateHtmlStructureSummary((pageData.html as string) || ''),
        cssClasses: extractCssClasses((pageData.html as string) || ''),
        metadata: (pageData.metadata as Record<string, unknown>) || {},
        assets: (pageData.assets as unknown[]) || [],
        links: (pageData.links as string[]) || []
      };
    } catch (error) {
      console.warn(`Error processing page details for: ${url}`, error);
    }
  });

  return pageDetails;
}

/**
 * Generate a summary of the HTML structure
 * @param html - Raw HTML content
 * @returns HTML structure summary
 */
function generateHtmlStructureSummary(html: string) {
  // Extract main structural elements
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const headContent = headMatch ? headMatch[1] : '';
  const bodyContent = bodyMatch ? bodyMatch[1] : '';

  // Extract key sections
  const headerMatch = bodyContent.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  const mainMatch = bodyContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const footerMatch = bodyContent.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);

  // Count elements by type
  const elementCounts: Record<string, number> = {};
  const elementRegex = /<([a-z0-9]+)[\s>]/gi;
  let match;

  while ((match = elementRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    elementCounts[tag] = (elementCounts[tag] || 0) + 1;
  }

  return {
    doctype: html.match(/<!DOCTYPE[^>]*>/i)?.[0] || 'No doctype found',
    headElements: {
      title: headContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '',
      metaTags: (headContent.match(/<meta[^>]*>/gi) || []).length,
      styleSheets: (headContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length,
      scripts: (headContent.match(/<script[^>]*>/gi) || []).length
    },
    bodyStructure: {
      hasHeader: !!headerMatch,
      hasMain: !!mainMatch,
      hasFooter: !!footerMatch,
      navMenus: (bodyContent.match(/<nav[^>]*>/gi) || []).length,
      sections: (bodyContent.match(/<section[^>]*>/gi) || []).length,
      articles: (bodyContent.match(/<article[^>]*>/gi) || []).length,
      asides: (bodyContent.match(/<aside[^>]*>/gi) || []).length
    },
    elementCounts
  };
}

/**
 * Extract CSS classes from HTML content
 * @param html - Raw HTML content
 * @returns Array of unique CSS classes
 */
function extractCssClasses(html: string) {
  const classes: Set<string> = new Set();
  const classRegex = /class=["']([^"']+)["']/gi;
  let match;

  while ((match = classRegex.exec(html)) !== null) {
    if (match[1]) {
      match[1].split(/\s+/).forEach(cls => {
        if (cls) classes.add(cls);
      });
    }
  }

  return Array.from(classes);
}

/**
 * Identify common components across pages
 * @param contentData - Processed content data for each page
 * @returns Identified components
 */
function identifyComponents(contentData: Record<string, unknown>) {
  const components: Record<string, unknown[]> = {
    navigation: [],
    footer: [],
    header: [],
    sidebar: [],
    cards: [],
    forms: [],
    custom: []
  };

  // Process each page to identify components
  Object.entries(contentData).forEach(([url, data]) => {
    const pageData = data as Record<string, unknown>;
    const html = (pageData.html as string) || '';

    // Extract navigation components
    const navMatches = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi) || [];
    navMatches.forEach((nav: string, index: number) => {
      components.navigation.push({
        source: url,
        index,
        content: nav
      });
    });

    // Extract footer components
    const footerMatches = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/gi) || [];
    footerMatches.forEach((footer: string, index: number) => {
      components.footer.push({
        source: url,
        index,
        content: footer
      });
    });

    // Extract header components
    const headerMatches = html.match(/<header[^>]*>([\s\S]*?)<\/header>/gi) || [];
    headerMatches.forEach((header: string, index: number) => {
      components.header.push({
        source: url,
        index,
        content: header
      });
    });

    // Extract sidebar components
    const sidebarMatches = html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/gi) || [];
    sidebarMatches.forEach((sidebar: string, index: number) => {
      components.sidebar.push({
        source: url,
        index,
        content: sidebar
      });
    });

    // Extract form components
    const formMatches = html.match(/<form[^>]*>([\s\S]*?)<\/form>/gi) || [];
    formMatches.forEach((form: string, index: number) => {
      components.forms.push({
        source: url,
        index,
        content: form
      });
    });

    // Identify card-like components (divs with certain classes)
    const cardClassRegex = /class=["'][^"']*card[^"']*["']/i;
    const divMatches = html.match(/<div[^>]*>([\s\S]*?)<\/div>/gi) || [];
    divMatches.forEach((div: string, index: number) => {
      if (cardClassRegex.test(div)) {
        components.cards.push({
          source: url,
          index,
          content: div
        });
      }
    });
  });

  // Deduplicate components by comparing content
  const deduplicated: Record<string, unknown[]> = {};
  Object.entries(components).forEach(([type, items]) => {
    const uniqueItems = new Map();
    (items as Record<string, unknown>[]).forEach(item => {
      // Create a simplified version of the content for comparison
      const simplifiedContent = (item.content as string)
        .replace(/\s+/g, ' ')
        .replace(/class=["'][^"']*["']/gi, '')
        .replace(/id=["'][^"']*["']/gi, '')
        .replace(/style=["'][^"']*["']/gi, '');

      if (!uniqueItems.has(simplifiedContent)) {
        uniqueItems.set(simplifiedContent, item);
      }
    });

    deduplicated[type] = Array.from(uniqueItems.values());
  });

  return deduplicated;
}

/**
 * Extract asset references from content data
 * @param contentData - Processed content data for each page
 * @returns Asset references
 */
function extractAssetReferences(contentData: Record<string, unknown>) {
  const assets: Record<string, Set<string>> = {
    css: new Set(),
    javascript: new Set(),
    images: new Set(),
    fonts: new Set(),
    videos: new Set(),
    other: new Set()
  };

  // Process each page to extract asset references
  Object.entries(contentData).forEach(([_url, data]) => {
    const pageData = data as Record<string, unknown>;
    const pageAssets = (pageData.assets as Record<string, unknown>[]) || [];

    pageAssets.forEach((asset: Record<string, unknown>) => {
      const assetUrl = asset.url as string;
      const assetType = (asset.type as string)?.toLowerCase() || 'other';

      switch (assetType) {
        case 'css':
          assets.css.add(assetUrl);
          break;
        case 'javascript':
          assets.javascript.add(assetUrl);
          break;
        case 'image':
          assets.images.add(assetUrl);
          break;
        case 'font':
          assets.fonts.add(assetUrl);
          break;
        case 'video':
          assets.videos.add(assetUrl);
          break;
        default:
          assets.other.add(assetUrl);
          break;
      }
    });
  });

  // Convert Sets to Arrays for the final output
  const result: Record<string, string[]> = {};
  Object.entries(assets).forEach(([type, urls]) => {
    result[type] = Array.from(urls);
  });

  return result;
}

/**
 * Generate performance guidelines based on Lighthouse metrics
 * @param performanceData - Processed performance metrics
 * @returns Performance guidelines
 */
function generatePerformanceGuidelines(performanceData: Record<string, unknown>) {
  if (!performanceData) {
    return {
      title: 'Performance Considerations',
      description: 'No performance data available.',
      recommendations: []
    };
  }

  const performance = (performanceData.performance as Record<string, unknown>) || {};
  const accessibility = (performanceData.accessibility as Record<string, unknown>) || {};
  const seo = (performanceData.seo as Record<string, unknown>) || {};
  const bestPractices = (performanceData.bestPractices as Record<string, unknown>) || {};

  const recommendations: string[] = [];

  // Add performance recommendations
  const perfScore = (performance.score as number) || 0;
  if (perfScore < 0.9) {
    recommendations.push('Optimize page load performance to improve user experience');

    const metrics = (performance.metrics as Record<string, unknown>) || {};
    const fcp = (metrics.firstContentfulPaint as Record<string, unknown>)?.value as number;
    const lcp = (metrics.largestContentfulPaint as Record<string, unknown>)?.value as number;
    const tbt = (metrics.totalBlockingTime as Record<string, unknown>)?.value as number;
    const cls = (metrics.cumulativeLayoutShift as Record<string, unknown>)?.value as number;

    if (fcp > 1000) {
      recommendations.push('Reduce First Contentful Paint time to under 1 second');
    }
    if (lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint to under 2.5 seconds');
    }
    if (tbt > 200) {
      recommendations.push('Reduce Total Blocking Time to improve interactivity');
    }
    if (cls > 0.1) {
      recommendations.push('Minimize Cumulative Layout Shift to improve visual stability');
    }
  }

  // Add accessibility recommendations
  if ((accessibility.score as number) < 0.9) {
    recommendations.push('Improve accessibility to ensure the site is usable by everyone');
  }

  // Add SEO recommendations
  if ((seo.score as number) < 0.9) {
    recommendations.push('Enhance SEO practices to improve search engine visibility');
  }

  // Add best practices recommendations
  if ((bestPractices.score as number) < 0.9) {
    recommendations.push('Follow web best practices for security and quality');
  }

  return {
    title: 'Performance Considerations',
    description: 'Consider these performance metrics when rebuilding the website:',
    scores: {
      performance: (performance.score as number) || 0,
      accessibility: (accessibility.score as number) || 0,
      seo: (seo.score as number) || 0,
      bestPractices: (bestPractices.score as number) || 0
    },
    metrics: {
      firstContentfulPaint: (performance.metrics as Record<string, unknown>)?.firstContentfulPaint,
      largestContentfulPaint: (performance.metrics as Record<string, unknown>)?.largestContentfulPaint,
      totalBlockingTime: (performance.metrics as Record<string, unknown>)?.totalBlockingTime,
      cumulativeLayoutShift: (performance.metrics as Record<string, unknown>)?.cumulativeLayoutShift
    },
    recommendations
  };
}

/**
 * Generate step-by-step reconstruction instructions
 * @param siteMapData - Processed site map data
 * @param structuredData - Extracted structured data about the website
 * @returns Reconstruction instructions
 */
function generateReconstructionInstructions(_siteMapData: Record<string, unknown>, structuredData: Record<string, unknown>) {
  const technologies = (structuredData?.technologies as string[]) || [];
  const hasFrontendFramework = technologies.some((tech: string) =>
    /react|vue|angular|svelte|next|nuxt/i.test(tech)
  );

  const steps = [
    {
      title: '1. Project Setup',
      description: 'Set up the development environment and project structure',
      tasks: [
        'Create a new project directory',
        `Initialize the project with ${hasFrontendFramework ? 'the appropriate framework' : 'HTML, CSS, and JavaScript files'}`,
        'Set up the folder structure for assets, components, and pages',
        'Install necessary dependencies'
      ]
    },
    {
      title: '2. Asset Collection',
      description: 'Gather and organize all required assets',
      tasks: [
        'Download or recreate all CSS files',
        'Download or recreate all JavaScript files',
        'Collect all images, fonts, and other media assets',
        'Organize assets in the appropriate directories'
      ]
    },
    {
      title: '3. Component Development',
      description: 'Build reusable components identified in the analysis',
      tasks: [
        'Create the header component',
        'Create the navigation component',
        'Create the footer component',
        'Develop any sidebar components',
        'Build card and form components',
        'Implement any custom components specific to the site'
      ]
    },
    {
      title: '4. Page Construction',
      description: 'Build individual pages using the components',
      tasks: [
        'Create the homepage with appropriate layout and components',
        'Develop secondary pages following the site hierarchy',
        'Implement responsive design for all pages',
        'Ensure consistent styling across the site'
      ]
    },
    {
      title: '5. Functionality Implementation',
      description: 'Add interactive features and functionality',
      tasks: [
        'Implement navigation and routing',
        'Add form validation and submission handling',
        'Implement any interactive elements (sliders, accordions, etc.)',
        'Add any required API integrations or data fetching'
      ]
    },
    {
      title: '6. Testing and Optimization',
      description: 'Test the site and optimize performance',
      tasks: [
        'Test the site across different browsers and devices',
        'Optimize images and assets for performance',
        'Implement performance best practices',
        'Ensure accessibility compliance',
        'Validate HTML and CSS'
      ]
    },
    {
      title: '7. Deployment',
      description: 'Prepare the site for deployment',
      tasks: [
        'Bundle and minify assets',
        'Configure appropriate caching strategies',
        'Set up any required server configurations',
        'Deploy the site to the hosting environment'
      ]
    }
  ];

  return {
    title: 'Reconstruction Instructions',
    description: 'Follow these steps to rebuild the website with maximum fidelity:',
    steps
  };
}

/**
 * Generate the main AI prompt as Markdown
 * @param siteMapData - Processed site map data
 * @param contentData - Processed content data for each page
 * @param performanceData - Processed performance metrics
 * @param structuredData - Extracted structured data about the website
 * @returns Markdown content for the AI prompt
 */
function generatePromptMarkdown(
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>,
  structuredData: Record<string, unknown>
): string {
  const siteOverview = generateSiteOverview(siteMapData, structuredData);
  const pageDetails = generatePageDetails(contentData);
  const components = identifyComponents(contentData);
  const assets = extractAssetReferences(contentData);
  const performance = generatePerformanceGuidelines(performanceData);
  const instructions = generateReconstructionInstructions(siteMapData, structuredData);

  const pageCount = (siteMapData.pages as unknown[])?.length || 0;
  const technologies = (structuredData?.technologies as string[]) || [];
  const designPatterns = (structuredData?.designPatterns as string[]) || [];

  return `# Elite Website Rebuild Package

## Mission Brief
You're an elite web developer tasked with rebuilding the website: **${(siteMapData.pages as any[])?.[0] || Object.keys(contentData)[0] || 'Target Website'}**

This package contains everything you need for pixel-perfect reconstruction. The analysis includes ${pageCount} pages, complete code extraction, high-resolution screenshots, and performance metrics.

## Deployment Instructions
1. **Visual Reference**: Review screenshots in \`screenshots/\` folder for exact visual targets
2. **Code Analysis**: Examine HTML/CSS in \`pages/\` folder for structure and styling
3. **Asset Inventory**: Check \`assets/\` folder for all required resources
4. **Performance Targets**: Use metrics below to match or exceed original performance
5. **Reconstruction Protocol**: Follow the detailed instructions below

## Site Overview
- **Pages**: ${pageCount}
- **Technologies**: ${technologies.join(', ') || 'Standard HTML/CSS/JS'}
- **Design Patterns**: ${designPatterns.join(', ') || 'Standard web patterns'}

## Key Components Identified
${Object.entries(components).map(([type, items]) =>
  `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${(items as unknown[]).length} unique components`
).join('\n')}

## Assets Summary
${Object.entries(assets).map(([type, items]) =>
  `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${(items as string[]).length} files`
).join('\n')}

## Performance Considerations
${performance.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Reconstruction Instructions

${instructions.steps.map((step: any) => `
### ${step.title}
${step.description}

${step.tasks.map((task: string) => `- ${task}`).join('\n')}
`).join('\n')}

## File Structure
\`\`\`
website-rebuild-package/
├── README.md                 # This file - main AI prompt
├── package.json             # Package manifest and metadata
├── pages/                   # Individual page HTML files
│   ├── homepage.html
│   ├── about.html
│   └── ...
├── screenshots/             # Full-page screenshots
│   ├── homepage.png
│   ├── about.png
│   └── ...
├── assets/                  # Downloaded website assets
│   ├── images/
│   ├── css/
│   ├── js/
│   └── fonts/
└── docs/                    # Technical documentation
    ├── components.md        # Component analysis
    ├── performance.md       # Performance metrics
    └── technical-specs.md   # Technical specifications
\`\`\`

## Usage Instructions for AI
1. Start by examining the screenshots to understand the visual design and layout
2. Review the HTML files to understand the structure and content
3. Use the component analysis to identify reusable elements
4. Follow the reconstruction instructions step by step
5. Refer to the performance guidelines to optimize the rebuild

## Notes
- All screenshots are full-page captures showing the complete design
- HTML files contain the exact markup from the original site
- Assets have been downloaded and organized for easy access
- Performance metrics provide optimization targets for the rebuild

Generated on: ${new Date().toISOString()}
`;
}

/**
 * Save individual page HTML files
 * @param folder - JSZip folder for pages
 * @param contentData - Processed content data for each page
 */
async function savePageFiles(folder: JSZip, contentData: Record<string, unknown>) {
  for (const [url, data] of Object.entries(contentData)) {
    try {
      const pageData = data as Record<string, unknown>;
      const html = (pageData.html as string) || '';
      const markdown = (pageData.markdown as string) || '';

      // Generate a clean filename from the URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      let filename = path === '/' ? 'homepage' : path.split('/').filter(Boolean).join('-');
      if (!filename) filename = 'homepage';

      // Save HTML file
      folder.file(`${filename}.html`, html);

      // Save Markdown file
      folder.file(`${filename}.md`, markdown);

      // Save metadata
      const metadata = {
        url,
        title: (pageData.metadata as Record<string, unknown>)?.title || filename,
        extractedAt: new Date().toISOString(),
        assets: (pageData.assets as unknown[]) || [],
        links: (pageData.links as string[]) || []
      };
      folder.file(`${filename}.json`, JSON.stringify(metadata, null, 2));

    } catch (error) {
      console.warn(`Error saving page file for: ${url}`, error);
    }
  }
}

/**
 * Save screenshots from the scraped data
 * @param folder - JSZip folder for screenshots
 * @param contentData - Processed content data for each page
 */
async function saveScreenshots(folder: JSZip, contentData: Record<string, unknown>) {
  let screenshotCount = 0;

  for (const [url, data] of Object.entries(contentData)) {
    try {
      const pageData = data as Record<string, unknown>;

      // Debug: Log the structure of pageData to understand what Firecrawl returns
      console.log(`Screenshot debug for ${url}:`, Object.keys(pageData));

      // Check multiple possible locations for screenshot data
      const screenshotData = (pageData as any).screenshot ||
                           (pageData as any).screenshotUrl ||
                           (pageData as any).image ||
                           (pageData as any).rawData?.screenshot;

      if (screenshotData) {
        // Generate a clean filename from the URL
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        let filename = path === '/' ? 'homepage' : path.split('/').filter(Boolean).join('-');
        if (!filename) filename = 'homepage';

        // Handle different screenshot data formats
        if (typeof screenshotData === 'string') {
          // If it's a base64 string
          if (screenshotData.startsWith('data:image/')) {
            const base64Data = screenshotData.split(',')[1];
            folder.file(`${filename}.png`, base64Data, { base64: true });
            screenshotCount++;
            console.log(`Saved screenshot for ${url} as ${filename}.png`);
          } else if (screenshotData.startsWith('http')) {
            // If it's a URL, download the image and save it
            try {
              console.log(`Downloading screenshot from URL: ${screenshotData}`);
              const response = await fetch(screenshotData);
              if (response.ok) {
                const imageBuffer = await response.arrayBuffer();
                folder.file(`${filename}.png`, imageBuffer);
                screenshotCount++;
                console.log(`Downloaded and saved screenshot for ${url} as ${filename}.png`);
              } else {
                console.warn(`Failed to download screenshot from ${screenshotData}: ${response.status}`);
                folder.file(`${filename}-screenshot-url.txt`, screenshotData);
              }
            } catch (error) {
              console.warn(`Error downloading screenshot from ${screenshotData}:`, error);
              folder.file(`${filename}-screenshot-url.txt`, screenshotData);
            }
          } else {
            // Try to save as base64 anyway
            folder.file(`${filename}.png`, screenshotData, { base64: true });
            screenshotCount++;
            console.log(`Saved screenshot (assumed base64) for ${url} as ${filename}.png`);
          }
        }
      } else {
        console.warn(`No screenshot data found for: ${url}`);
        // Create a placeholder file to indicate missing screenshot
        folder.file(`${url.replace(/[^a-zA-Z0-9]/g, '_')}-no-screenshot.txt`,
                   `Screenshot not available for ${url}\nThis may be due to:\n- Firecrawl API limitations\n- Website blocking screenshots\n- Configuration issues`);
      }

    } catch (error) {
      console.warn(`Error saving screenshot for: ${url}`, error);
    }
  }

  console.log(`Total screenshots saved: ${screenshotCount}`);

  // If no screenshots were saved, add a README explaining why
  if (screenshotCount === 0) {
    folder.file('README.txt',
      `No screenshots were captured during the scan.

This could be due to:
1. Firecrawl API configuration issues
2. Website blocking screenshot capture
3. API rate limits or timeouts
4. Missing screenshot format in API request

To enable screenshots:
- Verify FIRECRAWL_API_KEY is set correctly
- Check Firecrawl account limits
- Ensure target website allows screenshot capture`);
  }
}

/**
 * Save downloaded assets
 * @param folder - JSZip folder for assets
 * @param contentData - Processed content data for each page
 */
async function saveAssets(folder: JSZip, contentData: Record<string, unknown>) {
  const allAssets = new Set<string>();

  // Collect all unique assets from all pages
  Object.values(contentData).forEach(data => {
    const pageData = data as Record<string, unknown>;
    const assets = (pageData.assets as Record<string, unknown>[]) || [];

    assets.forEach(asset => {
      const assetUrl = asset.url as string;
      if (assetUrl) {
        allAssets.add(assetUrl);
      }
    });
  });

  // Create asset manifest
  const assetManifest = {
    totalAssets: allAssets.size,
    assetTypes: {} as Record<string, string[]>,
    downloadInstructions: 'Assets listed below should be downloaded from their original URLs',
    generatedAt: new Date().toISOString()
  };

  // Categorize assets by type
  allAssets.forEach(assetUrl => {
    try {
      // Handle relative URLs by creating a proper URL
      let url: URL;
      if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
        url = new URL(assetUrl);
      } else if (assetUrl.startsWith('//')) {
        url = new URL('https:' + assetUrl);
      } else {
        // For relative URLs, use the first page URL as base
        const baseUrl = Object.keys(contentData)[0] || 'https://example.com';
        url = new URL(assetUrl, baseUrl);
      }
      const pathname = url.pathname.toLowerCase();

      let category = 'other';
      if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
        category = 'images';
      } else if (pathname.match(/\.(css)$/)) {
        category = 'css';
      } else if (pathname.match(/\.(js)$/)) {
        category = 'javascript';
      } else if (pathname.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        category = 'fonts';
      } else if (pathname.match(/\.(mp4|webm|ogg|avi)$/)) {
        category = 'videos';
      }

      if (!assetManifest.assetTypes[category]) {
        assetManifest.assetTypes[category] = [];
      }
      assetManifest.assetTypes[category].push(assetUrl);

    } catch (error) {
      console.warn(`Error categorizing asset: ${assetUrl}`, error);
    }
  });

  // Save asset manifest
  folder.file('manifest.json', JSON.stringify(assetManifest, null, 2));

  // Create download script
  const downloadScript = `#!/bin/bash
# Asset Download Script
# Run this script to download all assets from the original website

mkdir -p images css javascript fonts videos other

${Object.entries(assetManifest.assetTypes).map(([category, urls]) =>
  urls.map((url: string) => {
    const filename = url.split('/').pop() || 'unknown';
    return `curl -o "${category}/${filename}" "${url}"`;
  }).join('\n')
).join('\n')}

echo "Asset download complete!"
`;

  folder.file('download-assets.sh', downloadScript);

  // Create Windows batch file version
  const windowsScript = downloadScript.replace('#!/bin/bash', '@echo off');
  folder.file('download-assets.bat', windowsScript);
}

/**
 * Generate technical documentation files
 * @param folder - JSZip folder for documentation
 * @param siteMapData - Processed site map data
 * @param contentData - Processed content data for each page
 * @param performanceData - Processed performance metrics
 * @param structuredData - Extracted structured data about the website
 */
async function generateTechnicalDocs(
  folder: JSZip,
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>,
  structuredData: Record<string, unknown>
) {
  // Generate component analysis
  const components = identifyComponents(contentData);
  const componentsMd = `# Component Analysis

This document provides a detailed analysis of the components identified across the website.

${Object.entries(components).map(([type, items]) => `
## ${type.charAt(0).toUpperCase() + type.slice(1)} Components

Found ${(items as unknown[]).length} unique ${type} components:

${(items as any[]).map((item, index) => `
### ${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}
- **Source**: ${item.source}
- **Content Preview**: ${(item.content as string).substring(0, 200)}...

`).join('')}
`).join('')}
`;

  folder.file('components.md', componentsMd);

  // Generate performance analysis
  const performance = generatePerformanceGuidelines(performanceData);
  const performanceMd = `# Performance Analysis

${performance.description}

## Scores
${Object.entries(performance.scores || {}).map(([metric, score]) =>
  `- **${metric.charAt(0).toUpperCase() + metric.slice(1)}**: ${Math.round((score as number) * 100)}%`
).join('\n')}

## Key Metrics
${Object.entries(performance.metrics || {}).map(([metric, data]) =>
  `- **${metric}**: ${JSON.stringify(data)}`
).join('\n')}

## Recommendations
${performance.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
`;

  folder.file('performance.md', performanceMd);

  // Generate technical specifications
  const techSpecsMd = `# Technical Specifications

## Site Structure
- **Total Pages**: ${(siteMapData.pages as unknown[])?.length || 0}
- **Technologies**: ${(structuredData?.technologies as string[])?.join(', ') || 'Standard HTML/CSS/JS'}
- **Design Patterns**: ${(structuredData?.designPatterns as string[])?.join(', ') || 'Standard web patterns'}

## Page Hierarchy
${JSON.stringify(generatePageHierarchy(siteMapData), null, 2)}

## Asset Summary
${Object.entries(extractAssetReferences(contentData)).map(([type, items]) =>
  `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${(items as string[]).length} files`
).join('\n')}

## Color Palette
${(structuredData?.colorPalette as string[])?.map(color => `- ${color}`).join('\n') || 'Not specified'}

## Font Families
${(structuredData?.fontFamilies as string[])?.map(font => `- ${font}`).join('\n') || 'Not specified'}

## Key Features
${(structuredData?.keyFeatures as string[])?.map(feature => `- ${feature}`).join('\n') || 'Not specified'}
`;

  folder.file('technical-specs.md', techSpecsMd);
}

/**
 * Generate package manifest
 * @param siteMapData - Processed site map data
 * @param contentData - Processed content data for each page
 * @param performanceData - Processed performance metrics
 * @param structuredData - Extracted structured data about the website
 * @param analysisId - Unique ID for this analysis
 * @returns Package manifest object
 */
function generatePackageManifest(
  siteMapData: Record<string, unknown>,
  contentData: Record<string, unknown>,
  performanceData: Record<string, unknown>,
  structuredData: Record<string, unknown>,
  analysisId: string
) {
  return {
    name: 'website-rebuild-package',
    version: '1.0.0',
    description: 'Comprehensive website rebuild package generated by WRPG',
    analysisId,
    generatedAt: new Date().toISOString(),
    source: {
      pages: (siteMapData.pages as string[]) || [],
      totalPages: (siteMapData.pages as unknown[])?.length || 0
    },
    technologies: (structuredData?.technologies as string[]) || [],
    designPatterns: (structuredData?.designPatterns as string[]) || [],
    colorPalette: (structuredData?.colorPalette as string[]) || [],
    fontFamilies: (structuredData?.fontFamilies as string[]) || [],
    keyFeatures: (structuredData?.keyFeatures as string[]) || [],
    performance: {
      scores: (performanceData as any)?.performance?.score ? {
        performance: (performanceData as any).performance.score,
        accessibility: (performanceData as any).accessibility?.score,
        seo: (performanceData as any).seo?.score,
        bestPractices: (performanceData as any).bestPractices?.score
      } : null
    },
    assets: extractAssetReferences(contentData),
    components: Object.fromEntries(
      Object.entries(identifyComponents(contentData)).map(([type, items]) => [
        type,
        (items as unknown[]).length
      ])
    ),
    files: {
      'README.md': 'Main AI prompt and instructions',
      'package.json': 'Package manifest and metadata',
      'pages/': 'Individual page HTML and Markdown files',
      'screenshots/': 'Full-page screenshots of all pages',
      'assets/': 'Asset manifest and download scripts',
      'docs/': 'Technical documentation and analysis'
    },
    usage: {
      quickStart: [
        'Review screenshots/ folder for visual design',
        'Examine pages/ folder for HTML structure',
        'Check assets/ folder for resources',
        'Follow README.md reconstruction instructions'
      ],
      aiInstructions: 'Use this package with Claude Sonnet or similar AI for website reconstruction'
    }
  };
}