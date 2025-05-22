/**
 * Documentation generation utilities for the Website Rebuild Prompt Generator
 * Transforms scraped website data into Claude Sonnet-optimized prompts
 */

// Import types are available but not used in this file

/**
 * Generate a Claude Sonnet-optimized prompt for website reconstruction
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