"use client";

import { useState, useCallback, useEffect } from 'react';
import './globals.css';

type AnalysisStatus = 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hasPlayedChime, setHasPlayedChime] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [canResume, setCanResume] = useState<boolean>(false);
  const [resumableAnalyses, setResumableAnalyses] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);

  // Comprehensive task progression system for authentic UX
  const analysisTasksSequence = [
    { name: "Initializing scanner", icon: "🔍", duration: 2000 },
    { name: "Mapping site architecture", icon: "🗺️", duration: 3500 },
    { name: "Scanning fonts & typography", icon: "🔤", duration: 2800 },
    { name: "Extracting CSS stylesheets", icon: "🎨", duration: 4200 },
    { name: "Capturing full-page screenshots", icon: "📸", duration: 5500 },
    { name: "Indexing file directory", icon: "📁", duration: 3200 },
    { name: "Examining DOM structure", icon: "🏗️", duration: 2900 },
    { name: "Analyzing component hierarchy", icon: "🧩", duration: 3800 },
    { name: "Linking image assets", icon: "🖼️", duration: 2600 },
    { name: "Parsing JavaScript modules", icon: "⚡", duration: 4100 },
    { name: "Measuring responsive breakpoints", icon: "📱", duration: 3400 },
    { name: "Detecting animation frameworks", icon: "🎪", duration: 2700 },
    { name: "Mapping color palette", icon: "🎨", duration: 2300 },
    { name: "Analyzing layout grids", icon: "📐", duration: 3100 },
    { name: "Extracting SVG graphics", icon: "🎯", duration: 2800 },
    { name: "Scanning meta tags", icon: "🏷️", duration: 1900 },
    { name: "Profiling performance metrics", icon: "📊", duration: 3600 },
    { name: "Detecting third-party scripts", icon: "🔌", duration: 2400 },
    { name: "Analyzing accessibility features", icon: "♿", duration: 3300 },
    { name: "Compiling rebuild package", icon: "📦", duration: 4500 },
    { name: "Optimizing delivery", icon: "🚀", duration: 2200 },
    { name: "Finalizing AI analysis", icon: "🤖", duration: 3000 }
  ];

  // Enhanced URL formatting and validation with preprocessing
  const formatAndValidateUrl = useCallback((inputUrl: string) => {
    let cleanUrl = inputUrl.trim();

    // Return early if empty
    if (!cleanUrl) {
      return { isValid: false, formattedUrl: '', error: 'URL cannot be empty' };
    }

    // Remove common prefixes and suffixes that users might accidentally include
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
    cleanUrl = cleanUrl.replace(/\/$/, ''); // Remove trailing slash
    cleanUrl = cleanUrl.replace(/^\/+/, ''); // Remove leading slashes

    // Handle common user input patterns
    if (cleanUrl.includes(' ')) {
      // If there are spaces, take only the first part (likely the domain)
      cleanUrl = cleanUrl.split(' ')[0];
    }

    // Remove common query parameters that might be accidentally included
    cleanUrl = cleanUrl.split('?')[0].split('#')[0];

    // Handle common domain patterns
    if (!cleanUrl.includes('.')) {
      // If no TLD, assume .com for common sites
      const commonDomains = ['google', 'microsoft', 'apple', 'amazon', 'facebook', 'twitter', 'github', 'stackoverflow'];
      if (commonDomains.includes(cleanUrl.toLowerCase())) {
        cleanUrl = `${cleanUrl}.com`;
      } else {
        return { isValid: false, formattedUrl: cleanUrl, error: 'Please include a valid domain extension (e.g., .com, .org)' };
      }
    }

    // Handle subdomain-only inputs (e.g., "docs" -> needs context)
    const parts = cleanUrl.split('.');
    if (parts.length === 1 && parts[0].length > 0) {
      return { isValid: false, formattedUrl: cleanUrl, error: 'Please enter a complete domain (e.g., example.com)' };
    }

    // Add https:// prefix
    const formattedUrl = `https://${cleanUrl}`;

    try {
      const parsedUrl = new URL(formattedUrl);

      // Enhanced validation
      const hostname = parsedUrl.hostname.toLowerCase();

      // Check for valid hostname structure
      if (!hostname || !hostname.includes('.')) {
        return { isValid: false, formattedUrl, error: 'Invalid domain format' };
      }

      // Check for minimum domain length
      if (hostname.length < 4) {
        return { isValid: false, formattedUrl, error: 'Domain too short' };
      }

      // Check for valid TLD
      const tldPattern = /\.[a-z]{2,}$/i;
      if (!tldPattern.test(hostname)) {
        return { isValid: false, formattedUrl, error: 'Invalid domain extension' };
      }

      // Check for localhost or IP addresses (not suitable for web scraping)
      if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return { isValid: false, formattedUrl, error: 'Please enter a public website URL' };
      }

      // Check for common invalid patterns
      const invalidPatterns = [
        /^https?:\/\/$/,
        /\.\./,
        /\s/,
        /[<>]/
      ];

      for (const pattern of invalidPatterns) {
        if (pattern.test(formattedUrl)) {
          return { isValid: false, formattedUrl, error: 'Invalid URL format' };
        }
      }

      return { isValid: true, formattedUrl, error: null };
    } catch (error) {
      return { isValid: false, formattedUrl, error: 'Invalid URL format' };
    }
  }, []);

  // Realistic task progression system with stuttering progress
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isLoading && analysisStatus !== 'COMPLETED' && analysisStatus !== 'FAILED' && taskIndex < analysisTasksSequence.length) {
      const currentTaskData = analysisTasksSequence[taskIndex];
      setCurrentTask(`${currentTaskData.icon} ${currentTaskData.name}`);
      setTaskProgress(0);

      // Simulate realistic progress with stuttering
      let progress = 0;
      const baseIncrement = Math.random() * 2 + 1; // Random increment between 1-3%
      const stutterChance = 0.15; // 15% chance to stutter

      progressInterval = setInterval(() => {
        // Simulate network delays and processing stutters
        if (Math.random() < stutterChance) {
          // Stutter - don't increment this time
          return;
        }

        // Variable progress increment
        let increment = baseIncrement + (Math.random() * 1.5);

        // Slow down near completion (realistic behavior)
        if (progress > 85) {
          increment = Math.random() * 0.8;
        }

        progress += increment;

        if (progress >= 100) {
          progress = 100;
          setTaskProgress(100);
          clearInterval(progressInterval);

          // Mark task as completed
          setCompletedTasks(prev => [...prev, currentTaskData.name]);

          // Move to next task after a brief pause
          setTimeout(() => {
            if (taskIndex + 1 < analysisTasksSequence.length) {
              setTaskIndex(prev => prev + 1);
            }
          }, 500);
        } else {
          setTaskProgress(progress);
        }
      }, 100 + Math.random() * 150); // Random interval between 100-250ms for realistic feel
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading, analysisStatus, taskIndex]);

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
                setStatusMessage('🎯 Deep scanning website architecture...');
                break;
              case 'SCRAPING':
                setStatusMessage('📸 Capturing high-res screenshots & extracting code...');
                break;
              case 'PROCESSING':
                setStatusMessage('🔮 AI assembling your rebuild package...');
                break;
              case 'COMPLETED':
                setStatusMessage('✨ Your site clone package is ready!');
                setAnalysisResult(data.result);
                setIsLoading(false);
                // Play completion chime
                if (!hasPlayedChime) {
                  playCompletionChime();
                  setHasPlayedChime(true);
                }
                break;
              case 'FAILED':
                setStatusMessage('❌ Analysis failed. Please try again.');
                setIsLoading(false);
                break;
              default:
                // Use current task from progression system
                setStatusMessage(currentTask || 'Processing...');
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
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [analysisId, analysisStatus, currentTask]);

  // Timer effect for elapsed time
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (isLoading && startTime) {
      timerInterval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isLoading, startTime]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for empty input
    if (!url.trim()) {
      setError('Please enter a website URL to analyze');
      return;
    }

    // Format and validate URL
    const { isValid, formattedUrl, error: validationError } = formatAndValidateUrl(url);

    if (!isValid) {
      setError(validationError || 'Please enter a valid website URL (e.g., microsoft.com)');
      return;
    }

    // Clear any previous errors and results
    setError('');
    setErrorDetails(null);
    setCanResume(false);
    setIsLoading(true);
    setAnalysisId(null);
    setAnalysisStatus(null);
    setAnalysisResult(null);
    setStatusMessage('Starting analysis...');
    setHasPlayedChime(false);
    setStartTime(new Date());

    // Reset task progression state
    setCurrentTask('🔍 Initializing scanner');
    setTaskProgress(0);
    setCompletedTasks([]);
    setTaskIndex(0);

    try {
      // Make the actual API call to generate prompt
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl, // Use the formatted URL
          fullSite: true, // ENABLE FULL SITE CRAWLING - screenshots of ALL indexed pages
          includeScreenshots: true,
          includeLighthouse: true,
          maxPages: 100
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the analysis ID for status polling
        setAnalysisId(data.id);
        setAnalysisStatus(data.status);
        setStatusMessage('🔍 Initializing scanner');
        // Update the URL field to show the formatted URL
        setUrl(formattedUrl);
      } else {
        // Handle structured errors from the API
        if (data.type && data.canResume !== undefined) {
          setErrorDetails(data);
          setCanResume(data.canResume);
          setAnalysisId(data.analysisId);
          setError(`${data.error} ${data.canResume ? '(Can be resumed)' : ''}`);
        } else {
          setError(data.error || 'Failed to start analysis. Please try again.');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error submitting URL:', error);
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  }, [url, formatAndValidateUrl]);

  // Function to download the complete package as ZIP
  const handleDownloadPackage = useCallback(() => {
    if (!analysisId) return;

    // Create a download link for the ZIP package
    const downloadUrl = `/api/download-package?id=${analysisId}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `website-rebuild-package-${analysisId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [analysisId]);

  // Function to download analysis result as JSON (legacy format)
  const handleDownload = useCallback(() => {
    if (!analysisResult) return;

    // Extract legacy format from the result
    const legacyData = (analysisResult as any)?.legacy || analysisResult;
    const dataStr = JSON.stringify(legacyData, null, 2);
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

  // Function to play completion chime using Web Audio API
  const playCompletionChime = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create a simple chime sound using oscillators
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Set frequencies for a pleasant chime (C and E notes)
      oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5

      // Set oscillator types
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';

      // Connect oscillators to gain node
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

      // Start and stop oscillators
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 1.5);
      oscillator2.stop(audioContext.currentTime + 1.5);

    } catch (error) {
      console.log('Could not play chime:', error);
    }
  }, []);

  // Function to resume a failed analysis
  const handleResumeAnalysis = useCallback(async (resumeAnalysisId?: string) => {
    const idToResume = resumeAnalysisId || analysisId;
    if (!idToResume) return;

    setIsLoading(true);
    setError('');
    setErrorDetails(null);
    setStatusMessage('Resuming analysis...');
    setStartTime(new Date());

    try {
      const response = await fetch('/api/resume-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: idToResume
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisId(data.id);
        setAnalysisStatus('processing_resumed');
        setStatusMessage('Analysis resumed successfully...');
        setCanResume(false);
      } else {
        setError(data.error || 'Failed to resume analysis.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error resuming analysis:', error);
      setError('Connection error while resuming. Please try again.');
      setIsLoading(false);
    }
  }, [analysisId]);

  // Function to fetch resumable analyses
  const fetchResumableAnalyses = useCallback(async () => {
    try {
      const response = await fetch('/api/resume-analysis?type=resumable');
      const data = await response.json();

      if (response.ok) {
        setResumableAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching resumable analyses:', error);
    }
  }, []);

  // Fetch resumable analyses on component mount
  useEffect(() => {
    fetchResumableAnalyses();
  }, [fetchResumableAnalyses]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--xrai-bg) 0%, var(--xrai-surface) 100%)' }}>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-hero mb-4">
              Xrai
            </h1>
            <p className="text-lg text-neutral-300 max-w-md mx-auto leading-relaxed font-medium">
              X-ray your website. Get the rebuild package.
            </p>
            <p className="text-mono text-sm text-neutral-500 mt-2">
              xrai.it.com
            </p>
          </div>

          {/* Main Card */}
          <div className="xrai-panel p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-xs text-mono text-neutral-400 mb-3 uppercase tracking-wider">
                  Target URL
                </label>
                <div className="relative">
                  <input
                    id="url"
                    name="url"
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-4 bg-black/60 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 text-mono backdrop-blur-sm"
                    placeholder="stripe.com"
                    disabled={isLoading}
                  />
                  {error && (
                    <p className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-400/30 rounded p-2">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full xrai-button disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="xrai-status">
                    <span className="xrai-status-dot"></span>
                    Scanning... Chime on completion
                  </span>
                ) : (
                  'Xrai it'
                )}
              </button>
            </form>

            {/* Status Display */}
            {isLoading && (
              <div className="mt-6 space-y-4">
                {/* Current Task Progress */}
                <div className="relative xrai-card p-6">
                  <div className="xray-scanner"></div>
                  <div className="space-y-4">
                    {/* Current Task */}
                    <div className="flex items-center space-x-4">
                      <div className="xrai-status-dot"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{currentTask || statusMessage}</p>
                        {analysisId && (
                          <p className="text-mono text-xs mt-1 text-neutral-500">
                            ID: {analysisId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                      <div className="text-mono text-xs text-neutral-400">
                        {taskIndex + 1}/{analysisTasksSequence.length}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {currentTask && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-400">Progress</span>
                          <span className="text-primary font-mono">{Math.round(taskProgress)}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
                            style={{ width: `${taskProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed Tasks Summary */}
                {completedTasks.length > 0 && (
                  <div className="xrai-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-mono text-xs text-neutral-400 uppercase tracking-wider">Completed Tasks</span>
                      <span className="text-mono text-xs text-primary">{completedTasks.length} done</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {completedTasks.slice(-5).map((task, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs text-neutral-500">
                          <span className="text-primary">✓</span>
                          <span>{task}</span>
                        </div>
                      ))}
                      {completedTasks.length > 5 && (
                        <div className="text-xs text-neutral-600 italic">
                          ... and {completedTasks.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timer and Estimate Card */}
                <div className="xrai-card p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-mono text-xs text-neutral-400 uppercase tracking-wider">Process Timer</span>
                    <span className="text-primary text-mono text-lg font-bold">{elapsedTime}</span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    <p>Estimated completion: 5-10 minutes</p>
                    <p className="mt-1">Deep x-ray analysis in progress...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results section - only shown when analysis is complete */}
            {analysisStatus === 'COMPLETED' && analysisResult && (
              <div className="mt-4 bg-black/60 backdrop-blur-sm rounded border border-green-400/30 p-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg text-green-400 mb-2 uppercase tracking-wider">Scan Complete</h3>
                  <div className="flex items-center justify-center space-x-2 text-green-400">
                    <span className="text-xs">✓</span>
                    <span className="text-xs">Package ready for download</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs text-green-400/70 uppercase tracking-wider mb-2">Target:</h4>
                  <p className="text-green-400 bg-black/40 rounded px-2 py-1 break-all font-mono text-xs">{url}</p>
                </div>

                {/* Package contents */}
                <div className="mb-4">
                  <h4 className="text-xs text-green-400/70 uppercase tracking-wider mb-2">Contents:</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {[
                      "Screenshots",
                      "HTML/Markdown",
                      "Assets manifest",
                      "AI prompt",
                      "Documentation"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-green-400 bg-black/40 rounded px-2 py-1">
                        <span>✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownloadPackage}
                  className="w-full bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/50 py-3 px-4 rounded transition-all duration-200 text-sm uppercase tracking-wider"
                >
                  Download Package
                </button>
              </div>
            )}

            {/* Enhanced error message for failed analysis */}
            {(analysisStatus === 'FAILED' || (error && errorDetails)) && (
              <div className="mt-4 bg-red-900/20 backdrop-blur-sm rounded border border-red-400/30 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-red-400 text-xs">✗</span>
                  <span className="text-red-400 text-xs">Scan failed</span>
                </div>

                {errorDetails && (
                  <div className="space-y-3">
                    <div className="text-xs text-red-300 bg-red-900/30 rounded p-2">
                      <p className="font-mono">{errorDetails.message}</p>
                      {errorDetails.processingTime && (
                        <p className="mt-1 text-red-400/70">
                          Failed after {Math.round(errorDetails.processingTime)}s
                        </p>
                      )}
                    </div>

                    {errorDetails.suggestions && (
                      <div>
                        <p className="text-xs text-red-400/70 mb-2 uppercase tracking-wider">Suggestions:</p>
                        <ul className="text-xs text-red-300 space-y-1">
                          {errorDetails.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-red-400/50">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {canResume && analysisId && (
                      <button
                        onClick={() => handleResumeAnalysis()}
                        className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 py-2 px-3 rounded transition-all duration-200 text-xs uppercase tracking-wider"
                      >
                        Resume Failed Scan
                      </button>
                    )}
                  </div>
                )}

                {!errorDetails && (
                  <div className="text-xs text-red-300">
                    <p>Please try again or contact support if the issue persists.</p>
                  </div>
                )}
              </div>
            )}

            {/* Resumable analyses section */}
            {!isLoading && resumableAnalyses.length > 0 && (
              <div className="mt-4 bg-yellow-900/20 backdrop-blur-sm rounded border border-yellow-400/30 p-4">
                <h4 className="text-xs text-yellow-400/70 uppercase tracking-wider mb-3">
                  Resumable Scans ({resumableAnalyses.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {resumableAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between bg-black/40 rounded p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-yellow-400 font-mono truncate">
                          {analysis.url}
                        </p>
                        <p className="text-xs text-yellow-400/60">
                          {analysis.status} • {analysis.lastStep}
                        </p>
                      </div>
                      <button
                        onClick={() => handleResumeAnalysis(analysis.id)}
                        className="ml-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 py-1 px-2 rounded text-xs"
                      >
                        Resume
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-mono text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Advanced website x-ray analysis for elite developers
            </p>
            <p className="text-mono text-xs text-neutral-600 mt-2">
              Powered by Xrai™ • xrai.it.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
