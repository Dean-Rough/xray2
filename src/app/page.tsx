"use client";

import { useState, useCallback, useEffect } from 'react';
import './globals.css';

type AnalysisStatus = 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// AnalysisResult interface removed - not used in this component

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // More robust URL validation
  const validateUrl = useCallback((inputUrl: string) => {
    try {
      const parsedUrl = new URL(inputUrl.trim());
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Poll for analysis status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (analysisId && analysisStatus !== 'COMPLETED' && analysisStatus !== 'FAILED') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/generate-prompt?id=${analysisId}`);
          const data = await response.json();

          if (response.ok) {
            setAnalysisStatus(data.status);

            // Update status message based on current status
            switch (data.status) {
              case 'MAPPING':
                setStatusMessage('Mapping website structure...');
                break;
              case 'SCRAPING':
                setStatusMessage('Scraping website content...');
                break;
              case 'PROCESSING':
                setStatusMessage('Processing data and generating prompt...');
                break;
              case 'COMPLETED':
                setStatusMessage('Analysis complete!');
                setAnalysisResult(data.result);
                setIsLoading(false);
                break;
              case 'FAILED':
                setStatusMessage('Analysis failed. Please try again.');
                setIsLoading(false);
                break;
              default:
                setStatusMessage('Processing...');
            }

            // Stop polling if we've reached a terminal state
            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              clearInterval(intervalId);
            }
          } else {
            console.error('Error checking analysis status:', data.error);
            setStatusMessage('Error checking status. Please try again.');
            setIsLoading(false);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error polling for status:', error);
          setStatusMessage('Connection error. Please try again.');
          setIsLoading(false);
          clearInterval(intervalId);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [analysisId, analysisStatus]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Check for empty input
    if (!trimmedUrl) {
      setError('Please enter a website URL to analyze');
      return;
    }

    // Validate URL using more strict method
    if (!validateUrl(trimmedUrl)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    // Clear any previous errors and results
    setError('');
    setIsLoading(true);
    setAnalysisId(null);
    setAnalysisStatus(null);
    setAnalysisResult(null);
    setStatusMessage('Starting analysis...');

    try {
      // Make the actual API call to generate prompt
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: trimmedUrl,
          fullSite: false, // Default to analyzing just the main page
          includeScreenshots: true,
          includeLighthouse: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the analysis ID for status polling
        setAnalysisId(data.id);
        setAnalysisStatus(data.status);
        setStatusMessage('Analysis started. Mapping website structure...');
      } else {
        setError(data.error || 'Failed to start analysis. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error submitting URL:', error);
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  }, [url, validateUrl]);

  // Function to download analysis result as JSON
  const handleDownload = useCallback(() => {
    if (!analysisResult) return;

    const dataStr = JSON.stringify(analysisResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `website-analysis-${analysisId}.json`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analysisResult, analysisId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Website Rebuild Prompt Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL to Rebuild
            </label>
            <input
              id="url"
              name="url"
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://www.example.com"
              aria-describedby="url-error"
              disabled={isLoading}
            />
            {error && (
              <p
                id="url-error"
                className="mt-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing Website...' : 'Generate Rebuild Prompt'}
            </button>
          </div>
        </form>

        {/* Status and Results Display */}
        {isLoading && (
          <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-gray-700">{statusMessage}</span>
            </div>
            {analysisId && (
              <div className="mt-2 text-xs text-gray-500">
                Analysis ID: {analysisId}
              </div>
            )}
          </div>
        )}

        {/* Results section - only shown when analysis is complete */}
        {analysisStatus === 'COMPLETED' && analysisResult && (
          <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Analysis Results</h3>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">URL Analyzed</h4>
                <p className="text-sm text-gray-800 break-all">{url}</p>
              </div>

              {/* Summary of results */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Summary</h4>
                <p className="text-sm text-gray-800">
                  Analysis complete! The prompt has been generated and is ready for download.
                </p>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download Prompt JSON
              </button>
            </div>
          </div>
        )}

        {/* Error message for failed analysis */}
        {analysisStatus === 'FAILED' && (
          <div className="mt-6 p-4 border border-red-200 rounded-md bg-red-50">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-800">Analysis failed. Please try again.</span>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <h2 className="text-sm font-medium text-gray-700 mb-2">How It Works</h2>
          <p className="text-xs text-gray-600">
            Enter a website URL. Our AI will generate a comprehensive rebuild prompt for Claude Sonnet to analyze and recreate the site.
          </p>
        </div>
      </div>
    </div>
  );
}
