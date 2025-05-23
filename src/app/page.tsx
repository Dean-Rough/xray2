"use client";

import { useState, useCallback, useEffect } from 'react';
import './globals.css';

type AnalysisStatus = 'PENDING' | 'MAPPING' | 'SCRAPING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [fakeStatusIndex, setFakeStatusIndex] = useState(0);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  // Enhanced fake status messages for better UX
  const fakeStatusMessages = [
    "🔍 Scanning page structure...",
    "📸 Gathering screenshots...",
    "💻 Cloning code...",
    "🎨 Extracting font info...",
    "🎯 Analyzing design patterns...",
    "📊 Measuring performance...",
    "🧩 Identifying components...",
    "🎪 Capturing animations...",
    "📱 Testing responsiveness...",
    "🔧 Extracting assets...",
    "🎨 Mapping color palette...",
    "📐 Analyzing layout grid...",
    "⚡ Optimizing delivery...",
    "🔮 AI processing magic...",
  ];

  // Smart URL formatting and validation
  const formatAndValidateUrl = useCallback((inputUrl: string) => {
    let cleanUrl = inputUrl.trim();

    // Remove common prefixes that users might accidentally include
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, '');

    // Add https:// prefix
    const formattedUrl = `https://${cleanUrl}`;

    try {
      const parsedUrl = new URL(formattedUrl);
      // Basic validation - must have a valid hostname
      if (parsedUrl.hostname && parsedUrl.hostname.includes('.')) {
        return { isValid: true, formattedUrl };
      }
      return { isValid: false, formattedUrl };
    } catch {
      return { isValid: false, formattedUrl };
    }
  }, []);

  // Fake status cycling for enhanced UX
  useEffect(() => {
    let fakeInterval: NodeJS.Timeout;

    if (isLoading && analysisStatus !== 'COMPLETED' && analysisStatus !== 'FAILED') {
      fakeInterval = setInterval(() => {
        setFakeStatusIndex((prev) => (prev + 1) % fakeStatusMessages.length);
      }, 1500); // Change fake status every 1.5 seconds
    }

    return () => {
      if (fakeInterval) {
        clearInterval(fakeInterval);
      }
    };
  }, [isLoading, analysisStatus, fakeStatusMessages.length]);

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
                // Use cycling detailed status messages when no specific status
                setStatusMessage(fakeStatusMessages[fakeStatusIndex]);
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
  }, [analysisId, analysisStatus, fakeStatusMessages, fakeStatusIndex]);

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
    const { isValid, formattedUrl } = formatAndValidateUrl(url);

    if (!isValid) {
      setError('Please enter a valid website URL (e.g., microsoft.com)');
      return;
    }

    // Clear any previous errors and results
    setError('');
    setIsLoading(true);
    setAnalysisId(null);
    setAnalysisStatus(null);
    setAnalysisResult(null);
    setStatusMessage('Starting analysis...');
    setHasPlayedChime(false);
    setStartTime(new Date());

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
        setStatusMessage(fakeStatusMessages[0]);
        // Update the URL field to show the formatted URL
        setUrl(formattedUrl);
      } else {
        setError(data.error || 'Failed to start analysis. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error submitting URL:', error);
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  }, [url, formatAndValidateUrl, fakeStatusMessages]);

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

  return (
    <div className="min-h-screen bg-black crt-container crt-flicker">
      {/* VHS Signal Overlay */}
      <div className="vhs-overlay">
        <video
          autoPlay
          loop
          muted
          playsInline
          ref={(video) => {
            if (video) {
              video.playbackRate = 0.5;
            }
          }}
          style={{
            animationPlayState: 'running',
            transform: 'scale(1)',
            filter: 'contrast(1.2) brightness(1.1)'
          }}
        >
          <source src="/vhs-signal-overlay-small.mp4" type="video/mp4" />
        </video>
      </div>

      {/* CRT Background Effects */}
      <div className="crt-bg"></div>
      <div className="crt-scanlines"></div>
      <div className="crt-noise"></div>
      <div className="crt-static"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl text-white mb-3 tracking-tight">
              X-RAI<span className="text-green-400">™</span>
            </h1>
            <p className="text-sm text-gray-300 max-w-sm mx-auto leading-relaxed">
              Elite web developer tool. Drop URL, get rebuild package.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-green-400/30 shadow-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-xs text-green-400 mb-2 uppercase tracking-wider">
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
                    className="w-full px-3 py-3 bg-black/60 border border-green-400/50 rounded text-green-400 placeholder-green-400/50 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-sm backdrop-blur-sm font-mono"
                    placeholder="example.com"
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
                className="w-full bg-green-400/10 hover:bg-green-400/20 disabled:bg-gray-600/20 text-green-400 border border-green-400/50 py-3 px-4 rounded transition-all duration-200 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
              >
                {isLoading ? (
                  'Process initiated. Chime will sound when complete.'
                ) : (
                  'Initiate Scan'
                )}
              </button>
            </form>

            {/* Status Display */}
            {isLoading && (
              <div className="mt-4 space-y-4">
                {/* Main Status */}
                <div className="p-4 bg-black/60 backdrop-blur-sm rounded border border-green-400/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 border border-green-400/50 border-t-green-400 rounded-full animate-spin"></div>
                    <div className="flex-1">
                      <p className="text-green-400 text-sm">{statusMessage}</p>
                      {analysisId && (
                        <p className="text-green-400/50 text-xs mt-1 font-mono">
                          ID: {analysisId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timer and Estimate Card */}
                <div className="p-4 bg-black/60 backdrop-blur-sm rounded border border-green-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-green-400/70 uppercase tracking-wider">Process Timer</span>
                    <span className="text-green-400 font-mono text-sm">{elapsedTime}</span>
                  </div>
                  <div className="text-xs text-green-400/60">
                    <p>Estimated completion: 5-10 minutes</p>
                    <p className="mt-1">Deep analysis in progress...</p>
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

            {/* Error message for failed analysis */}
            {analysisStatus === 'FAILED' && (
              <div className="mt-4 bg-red-900/20 backdrop-blur-sm rounded border border-red-400/30 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400 text-xs">✗</span>
                  <span className="text-red-400 text-xs">Scan failed. Try again.</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-green-400/60 text-xs max-w-sm mx-auto leading-relaxed">
              Advanced website analysis for elite developers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
