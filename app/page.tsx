"use client";

import { useState, useCallback, useEffect } from 'react';
import './globals.css';

type AnalysisStatus = 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'processing_resumed';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<{
    message?: string;
    processingTime?: number;
    suggestions?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hasPlayedChime, setHasPlayedChime] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [canResume, setCanResume] = useState<boolean>(false);
  const [resumableAnalyses, setResumableAnalyses] = useState<Array<{
    id: string;
    url: string;
    status: string;
    lastStep: string;
  }>>([]);
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
          fullSite: true, // ENABLE SMART SITE CRAWLING - key navigation pages only
          includeScreenshots: true,
          includeLighthouse: true,
          maxPages: 12 // Respect API rate limits with smart page selection
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
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        {/* Left Side - Fixed Nav Bar */}
        <div className="fixed left-0 top-0 h-screen w-32 bg-black flex flex-col justify-between items-center py-20 z-50">
          {/* Top - A ROUGH tool link */}
          <div className="transform -rotate-90 whitespace-nowrap">
            <a
              href="https://www.rough.ink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-sm hover:opacity-70 transition-opacity"
            >
              A ROUGH tool
            </a>
          </div>

          {/* Center - Vertical separator */}
          <div className="w-px h-24 bg-white"></div>

          {/* Bottom - Logo */}
          <div className="transform -rotate-90 whitespace-nowrap">
            <img
              src="/xrai-dark.svg"
              alt="Xrai"
              className="h-8 filter invert"
            />
          </div>
        </div>

        {/* Right Side - Fixed Nav Bar */}
        <div className="fixed right-0 top-0 h-screen w-32 bg-black flex flex-col justify-center items-center py-20 z-50 overflow-hidden">
          <div className="transform rotate-90 whitespace-nowrap">
            <div className="animate-marquee">
              <span className="text-white text-sm tracking-wide" style={{ fontFamily: 'var(--font-styrene), sans-serif' }}>
                website analysis tool • website analysis tool • website analysis tool • website analysis tool • website analysis tool • website analysis tool • website analysis tool • website analysis tool • website analysis tool •
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center py-16 px-8 mx-32">
          <div className="w-full max-w-6xl">
            {/* Header */}


            {/* Section Separator */}
            <div className="xrai-separator-section"></div>

            {/* Two Column Layout */}
            <div className="flex max-w-4xl mx-auto">
              <div className="flex-1">
                {/* Left Card - Information */}
                <div className="xrai-card-elevated p-8">
                  <h2 className="xrai-label">How It Works</h2>

                  {/* Horizontal Separator */}
                  <div className="xrai-separator-horizontal"></div>

                  <div className="space-y-4 text-body">
                    <div className="flex items-start space-x-3">
                      <span className="text-black font-bold">01</span>
                      <span className="text-sm font-normal">Enter your target website URL</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-black font-bold">02</span>
                      <span className="text-sm font-normal">AI analyzes up to 12 key pages with intelligent selection</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-black font-bold">03</span>
                      <span className="text-sm font-normal">Download complete reconstruction package with screenshots, code, and documentation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Separator */}
              <div className="xrai-separator-vertical"></div>

              <div className="flex-1">
                {/* Right Card - Action */}
                <div className="xrai-card p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="url" className="xrai-label">
                      Website URL
                    </label>
                    <div className="relative">
                      <input
                        id="url"
                        name="url"
                        type="text"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="xrai-input"
                        placeholder="example.com"
                        disabled={isLoading}
                      />
                      {error && (
                        <p className="mt-3 text-xs text-black bg-red-50 border border-red-200 p-3">
                          {error}
                        </p>
                      )}
                    </div>

                    {/* Horizontal Separator */}
                    {/* API Limitations Notice */}

                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full xrai-button"
                  >
                    {isLoading ? (
                      <span className="xrai-status">
                        <span className="xrai-status-dot"></span>
                        Analyzing...
                      </span>
                    ) : (
                      'Analyze Website'
                    )}
                  </button>
                </form>

                {/* Status Display */}
                {isLoading && (
                  <div className="mt-6 space-y-4">
                    {/* Current Task Progress */}
                    <div className="xrai-card-elevated p-4">
                      <div className="space-y-3">
                        {/* Current Task */}
                        <div className="flex items-center space-x-3">
                          <div className="xrai-status-dot"></div>
                          <div className="flex-1">
                            <p className="text-body text-sm font-bold">{currentTask || statusMessage}</p>
                            {analysisId && (
                              <p className="text-xs mt-1 text-black opacity-50">
                                ID: {analysisId.slice(0, 8)}...
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-black font-bold">
                            {taskIndex + 1}/{analysisTasksSequence.length}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {currentTask && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-black">Progress</span>
                              <span className="text-black font-bold">{Math.round(taskProgress)}%</span>
                            </div>
                            <div className="xrai-progress">
                              <div
                                className="xrai-progress-bar"
                                style={{ width: `${taskProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed Tasks Summary */}
                    {completedTasks.length > 0 && (
                      <div className="xrai-card-elevated p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-black font-bold">Completed</span>
                          <span className="text-xs text-black font-bold">{completedTasks.length} done</span>
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {completedTasks.slice(-2).map((task, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs text-black">
                              <span className="text-black">✓</span>
                              <span>{task}</span>
                            </div>
                          ))}
                          {completedTasks.length > 2 && (
                            <div className="text-xs text-black opacity-50">
                              ... and {completedTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timer Card */}
                    <div className="xrai-card-elevated p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-black">Elapsed Time</span>
                        <span className="text-black font-bold">{elapsedTime}</span>
                      </div>
                      <div className="text-xs text-black opacity-50 mt-1">
                        <p>Estimated: 5-10 minutes</p>
                      </div>
                    </div>
                  </div>
                )}

            {/* Results section - only shown when analysis is complete */}
            {analysisStatus === 'COMPLETED' && analysisResult && (
              <div className="mt-6 xrai-card-elevated">
                <div className="text-center mb-6">
                  <h3 className="text-section mb-2">Analysis Complete - Package Ready</h3>
                  <p className="text-body text-sm text-black">
                  </p>
                </div>

                {/* Horizontal Separator */}
                <div className="xrai-separator-horizontal"></div>

                <div className="mb-6">
                  <h4 className="xrai-label mb-2">Target Website</h4>
                  <p className="text-sm text-black xrai-card px-3 py-2 break-all">{url}</p>
                </div>

                {/* Package contents */}
                <div className="mb-6">
                  <h4 className="xrai-label mb-3">Package Contents</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {[
                      "Screenshots",
                      "HTML/Markdown",
                      "Assets manifest",
                      "AI prompt",
                      "Documentation"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-black xrai-card px-3 py-2">
                        <span className="text-black font-bold">-</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownloadPackage}
                  className="w-full xrai-button"
                >
                  Download Package
                </button>
              </div>
            )}

            {/* Error message for failed analysis */}
            {(analysisStatus === 'FAILED' || (error && errorDetails)) && (
              <div className="mt-6 xrai-card-elevated">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-black text-sm font-bold">X</span>
                  <span className="text-black text-sm font-bold">Analysis Failed</span>
                </div>

                {/* Horizontal Separator */}
                <div className="xrai-separator-horizontal"></div>

                {errorDetails && (
                  <div className="space-y-3">
                    <div className="text-sm text-black xrai-card p-3">
                      <p>{errorDetails.message}</p>
                      {errorDetails.processingTime && (
                        <p className="mt-1 text-black text-xs">
                          Failed after {Math.round(errorDetails.processingTime)}s
                        </p>
                      )}
                    </div>

                    {errorDetails.suggestions && (
                      <div>
                        <p className="text-xs text-black mb-2 font-bold">Suggestions:</p>
                        <ul className="text-xs text-black space-y-1">
                          {errorDetails.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-black font-bold">-</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {canResume && analysisId && (
                      <button
                        onClick={() => handleResumeAnalysis()}
                        className="w-full xrai-button-secondary"
                      >
                        Resume Analysis
                      </button>
                    )}
                  </div>
                )}

                {!errorDetails && (
                  <div className="text-sm text-black">
                    <p>Please try again or contact support if the issue persists.</p>
                  </div>
                )}
              </div>
            )}

            {/* Resumable analyses section */}
            {!isLoading && resumableAnalyses.length > 0 && (
              <div className="mt-6 xrai-card-elevated">
                <h4 className="xrai-label">
                  Resumable Analyses ({resumableAnalyses.length})
                </h4>

                {/* Horizontal Separator */}
                <div className="xrai-separator-horizontal"></div>

                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {resumableAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="xrai-card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-normal truncate">
                            {analysis.url}
                          </p>
                          <p className="text-xs text-black mt-1">
                            {analysis.status} • {analysis.lastStep}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResumeAnalysis(analysis.id)}
                          className="ml-4 xrai-button text-xs px-4 py-2"
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* Section Separator */}
            <div className="xrai-separator-section"></div>

            {/* Footer */}

          </div>
        </div>
      </div>
    </div>
  );
}
