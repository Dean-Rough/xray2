#!/usr/bin/env node

/**
 * XRAY Package Quality Test Runner
 *
 * This script performs automated quality checks on generated packages
 * to ensure they meet the minimum standards for AI reconstruction.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_WEBSITES = [
  'https://example.com',
  'https://github.com',
  // Add more test sites as needed
];

const QUALITY_THRESHOLDS = {
  MINIMUM_SCORE: 8,
  BLOCKING_ISSUES: 0,
  REQUIRED_FILES: [
    'README.md',
    'package.json',
    'pages/homepage.html',
    'docs/components.md',
    'assets/manifest.json'
  ]
};

class PackageQualityTester {
  constructor(packagePath) {
    this.packagePath = packagePath;
    this.results = {
      score: 0,
      blockingIssues: [],
      warnings: [],
      passed: false
    };
  }

  async runTests() {
    console.log('🧪 Running XRAY Package Quality Tests...\n');

    try {
      await this.testFileStructure();
      await this.testScreenshots();
      await this.testCSSExtraction();
      await this.testComponentAnalysis();
      await this.testAssetCompleteness();

      this.calculateFinalScore();
      this.printResults();

    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async testFileStructure() {
    console.log('📁 Testing file structure...');

    for (const requiredFile of QUALITY_THRESHOLDS.REQUIRED_FILES) {
      const filePath = path.join(this.packagePath, requiredFile);

      if (!fs.existsSync(filePath)) {
        this.results.blockingIssues.push(`Missing required file: ${requiredFile}`);
      } else {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          this.results.blockingIssues.push(`Empty file: ${requiredFile}`);
        }
      }
    }

    console.log('   ✓ File structure check complete\n');
  }

  async testScreenshots() {
    console.log('📸 Testing screenshot capture...');

    const screenshotsPath = path.join(this.packagePath, 'screenshots');

    if (!fs.existsSync(screenshotsPath)) {
      this.results.blockingIssues.push('Screenshots folder missing');
      return;
    }

    const files = fs.readdirSync(screenshotsPath);
    const imageFiles = files.filter(f => f.match(/\.(png|jpg|jpeg)$/i));

    if (imageFiles.length === 0) {
      // Check for "No screenshots" message
      const readmeFile = path.join(screenshotsPath, 'README.txt');
      if (fs.existsSync(readmeFile)) {
        const content = fs.readFileSync(readmeFile, 'utf8');
        if (content.includes('No screenshots were captured')) {
          this.results.blockingIssues.push('Screenshots not captured - check Firecrawl configuration');
        }
      } else {
        this.results.blockingIssues.push('No screenshot files found');
      }
    } else {
      console.log(`   ✓ Found ${imageFiles.length} screenshot(s)`);
    }

    console.log('   ✓ Screenshot test complete\n');
  }

  async testCSSExtraction() {
    console.log('🎨 Testing CSS extraction...');

    const htmlFile = path.join(this.packagePath, 'pages/homepage.html');

    if (!fs.existsSync(htmlFile)) {
      this.results.blockingIssues.push('Homepage HTML file missing');
      return;
    }

    const htmlContent = fs.readFileSync(htmlFile, 'utf8');

    // Check for CSS files or inline styles
    const hasLinkedCSS = htmlContent.includes('<link') && htmlContent.includes('stylesheet');
    const hasInlineStyles = htmlContent.includes('style=') || htmlContent.includes('<style');

    if (!hasLinkedCSS && !hasInlineStyles) {
      this.results.warnings.push('No CSS styling information found in HTML');
    }

    // Check for actual CSS files in package
    const cssPath = path.join(this.packagePath, 'assets/css');
    if (!fs.existsSync(cssPath) || fs.readdirSync(cssPath).length === 0) {
      this.results.blockingIssues.push('No CSS files extracted - only HTML with class names');
    }

    console.log('   ✓ CSS extraction test complete\n');
  }

  async testComponentAnalysis() {
    console.log('🧩 Testing component analysis...');

    const componentsFile = path.join(this.packagePath, 'docs/components.md');

    if (!fs.existsSync(componentsFile)) {
      this.results.blockingIssues.push('Component analysis file missing');
      return;
    }

    const content = fs.readFileSync(componentsFile, 'utf8');

    // Check for truncated components (indicated by "...")
    if (content.includes('...')) {
      this.results.blockingIssues.push('Component analysis contains truncated content');
    }

    // Check for meaningful component count
    const componentMatches = content.match(/Found \d+ unique/g);
    if (componentMatches) {
      const totalComponents = componentMatches.reduce((sum, match) => {
        const num = parseInt(match.match(/\d+/)[0]);
        return sum + num;
      }, 0);

      if (totalComponents === 0) {
        this.results.warnings.push('No components identified - may indicate analysis issues');
      }
    }

    console.log('   ✓ Component analysis test complete\n');
  }

  async testAssetCompleteness() {
    console.log('📦 Testing asset completeness...');

    const manifestFile = path.join(this.packagePath, 'assets/manifest.json');

    if (!fs.existsSync(manifestFile)) {
      this.results.blockingIssues.push('Asset manifest missing');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

    if (!manifest.totalAssets || manifest.totalAssets === 0) {
      this.results.warnings.push('No assets identified in manifest');
    }

    // Check if CSS and JS assets are included
    const assetTypes = manifest.assetTypes || {};
    if (!assetTypes.css || assetTypes.css.length === 0) {
      this.results.blockingIssues.push('No CSS assets in manifest');
    }

    console.log('   ✓ Asset completeness test complete\n');
  }

  calculateFinalScore() {
    let score = 10; // Start with perfect score

    // Deduct for blocking issues
    score -= this.results.blockingIssues.length * 3;

    // Deduct for warnings
    score -= this.results.warnings.length * 1;

    // Ensure score doesn't go below 0
    this.results.score = Math.max(0, score);

    // Determine if package passes
    this.results.passed = this.results.score >= QUALITY_THRESHOLDS.MINIMUM_SCORE &&
                         this.results.blockingIssues.length === 0;
  }

  printResults() {
    console.log('📊 TEST RESULTS');
    console.log('================');
    console.log(`Package Quality Score: ${this.results.score}/10`);
    console.log(`Status: ${this.results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('');

    if (this.results.blockingIssues.length > 0) {
      console.log('🚨 BLOCKING ISSUES:');
      this.results.blockingIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
      console.log('');
    }

    if (this.results.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
      console.log('');
    }

    if (!this.results.passed) {
      console.log('💡 NEXT STEPS:');
      console.log('   1. Fix all BLOCKING issues');
      console.log('   2. Address warnings if possible');
      console.log('   3. Re-run tests until score ≥ 8/10');
      console.log('   4. Run full AI evaluation (see docs/TESTING-PROTOCOL.md)');
    } else {
      console.log('🎉 Package meets quality standards!');
      console.log('   Next: Run full AI evaluation for final validation');
    }
  }
}

// Main execution
async function main() {
  const packagePath = process.argv[2];

  if (!packagePath) {
    console.error('Usage: node test-package-quality.js <package-path>');
    console.error('Example: node test-package-quality.js ./temp/website-rebuild-2025-01-15');
    process.exit(1);
  }

  if (!fs.existsSync(packagePath)) {
    console.error(`Package path does not exist: ${packagePath}`);
    process.exit(1);
  }

  const tester = new PackageQualityTester(packagePath);
  await tester.runTests();

  process.exit(tester.results.passed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PackageQualityTester };
