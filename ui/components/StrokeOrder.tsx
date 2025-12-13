'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';
import HanziWriter from 'hanzi-writer';

interface StrokeOrderProps {
  word: string;
  size?: number;
}

export default function StrokeOrder({ word, size = 100 }: StrokeOrderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(2); // Default speed
  const [delayBetweenStrokes, setDelayBetweenStrokes] = useState(300); // Default delay
  const [text, setText] = useState<any>(null);
  // Store 3 writers per character (slow, normal, fast)
  const writersRef = useRef<{ slow: any; normal: any; fast: any }[]>([]);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Split word into individual characters - filter out dots/ellipsis and whitespace
  // This prevents showing three dots (...) for ellipsis in words like "不是...就是"
  const characters = useMemo(() => 
    word.split('').filter(char => {
      const trimmed = char.trim();
      if (!trimmed) return false; // Filter out whitespace
      // Filter out periods (.) and ellipsis (… - U+2026)
      return char !== '.' && char !== '…' && trimmed.length > 0;
    }), 
    [word]
  );
  const charactersKey = useMemo(() => characters.join(''), [characters]);

  // Set mounted state to ensure consistent server/client rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load UI text (bundled, so synchronous)
  useEffect(() => {
    const locale = getLocaleFromPath(pathname);
    const uiText = getUiText(locale);
    setText(uiText);
  }, [pathname]);

  useEffect(() => {
    if (characters.length === 0) return;

    // Reset state when word changes
    setIsLoaded(false);

    // Initialize container refs array
    containerRefs.current = new Array(characters.length).fill(null);
    writersRef.current = new Array(characters.length).fill(null);

    // Wait for containers to be mounted
    const checkHanziWriter = () => {
      if (typeof window !== 'undefined') {
        // Check if all containers are ready
        const allContainersReady = containerRefs.current.every(container => container !== null);
        
        if (allContainersReady) {
          // Clean up existing writers and clear containers
          writersRef.current.forEach((writers, index) => {
            try {
              if (writers) {
                // TODO: Investigate - cancelQuiz() is documented for quizzes, but we're using it to stop animations.
                // Check if there's a better method like cancelAnimation() or if cancelQuiz() works for both.
                if (writers.slow) writers.slow.cancelQuiz();
                if (writers.normal) writers.normal.cancelQuiz();
                if (writers.fast) writers.fast.cancelQuiz();
                // Clear the container to prevent duplication
                const container = containerRefs.current[index];
                if (container) {
                  container.innerHTML = '';
                }
              }
            } catch (error) {
              // Ignore cleanup errors
            }
          });
          writersRef.current = new Array(characters.length).fill(null).map(() => ({ slow: null, normal: null, fast: null }));

          // Create 3 writers for each character (one for each speed)
          characters.forEach((char, index) => {
            const container = containerRefs.current[index];
            if (container) {
              // Ensure container is empty before creating new writers
              container.innerHTML = '';
              
              // Create 3 separate divs for the 3 speeds, stacked on top of each other
              const slowDiv = document.createElement('div');
              slowDiv.style.position = 'absolute';
              slowDiv.style.width = `${size}px`;
              slowDiv.style.height = `${size}px`;
              slowDiv.style.top = '0';
              slowDiv.style.left = '0';
              slowDiv.style.display = 'none'; // Hidden by default
              
              const normalDiv = document.createElement('div');
              normalDiv.style.position = 'absolute';
              normalDiv.style.width = `${size}px`;
              normalDiv.style.height = `${size}px`;
              normalDiv.style.top = '0';
              normalDiv.style.left = '0';
              normalDiv.style.display = 'block'; // Visible by default
              
              const fastDiv = document.createElement('div');
              fastDiv.style.position = 'absolute';
              fastDiv.style.width = `${size}px`;
              fastDiv.style.height = `${size}px`;
              fastDiv.style.top = '0';
              fastDiv.style.left = '0';
              fastDiv.style.display = 'none'; // Hidden by default
              
              container.style.position = 'relative';
              container.appendChild(slowDiv);
              container.appendChild(normalDiv);
              container.appendChild(fastDiv);
              
              // Store div references for visibility control
              (container as any).slowDiv = slowDiv;
              (container as any).normalDiv = normalDiv;
              (container as any).fastDiv = fastDiv;
              
              try {
                // Create slow writer (0.5 speed)
                const slowWriter = HanziWriter.create(slowDiv, char, {
                  width: size,
                  height: size,
                  padding: 8,
                  showOutline: true,
                  showCharacter: false, // Hidden by default
                  strokeColor: '#0d9488',
                  outlineColor: '#e5e7eb',
                  strokeAnimationSpeed: 0.5,
                  delayBetweenStrokes: 500,
                  charDataLoader: async (char: string) => {
                    try {
                      // Dynamically import the character data file (explicitly use .json extension)
                      const charData = await import(`hanzi-writer-data/${char}.json`);
                      return charData.default || charData;
                    } catch (error) {
                      return null;
                    }
                  },
                });
                
                // Create normal writer (2 speed) - this is the default visible one
                const normalWriter = HanziWriter.create(normalDiv, char, {
                  width: size,
                  height: size,
                  padding: 8,
                  showOutline: true,
                  showCharacter: true, // Visible by default
                  strokeColor: '#0d9488',
                  outlineColor: '#e5e7eb',
                  strokeAnimationSpeed: 2,
                  delayBetweenStrokes: 300,
                  charDataLoader: async (char: string) => {
                    try {
                      // Dynamically import the character data file (explicitly use .json extension)
                      const charData = await import(`hanzi-writer-data/${char}.json`);
                      return charData.default || charData;
                    } catch (error) {
                      return null;
                    }
                  },
                });
                
                // Create fast writer (4 speed)
                const fastWriter = HanziWriter.create(fastDiv, char, {
                  width: size,
                  height: size,
                  padding: 8,
                  showOutline: true,
                  showCharacter: false, // Hidden by default
                  strokeColor: '#0d9488',
                  outlineColor: '#e5e7eb',
                  strokeAnimationSpeed: 4,
                  delayBetweenStrokes: 150,
                  charDataLoader: async (char: string) => {
                    try {
                      // Dynamically import the character data file (explicitly use .json extension)
                      const charData = await import(`hanzi-writer-data/${char}.json`);
                      return charData.default || charData;
                    } catch (error) {
                      return null;
                    }
                  },
                });
                
                writersRef.current[index] = {
                  slow: slowWriter,
                  normal: normalWriter,
                  fast: fastWriter
                };
              } catch (error) {
                console.error(`Error creating HanziWriter for character ${char}:`, error);
              }
            }
          });

          setIsLoaded(true);
        } else {
          // Retry if containers aren't ready yet
          setTimeout(checkHanziWriter, 50);
        }
      }
    };

    // Start checking after a brief delay to allow refs to be set
    const timeoutId = setTimeout(checkHanziWriter, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      writersRef.current.forEach((writers, index) => {
        try {
          if (writers) {
            // TODO: Investigate - cancelQuiz() is documented for quizzes, but we're using it to stop animations.
            // Check if there's a better method like cancelAnimation() or if cancelQuiz() works for both.
            if (writers.slow) writers.slow.cancelQuiz();
            if (writers.normal) writers.normal.cancelQuiz();
            if (writers.fast) writers.fast.cancelQuiz();
            // Clear the container
            const container = containerRefs.current[index];
            if (container) {
              container.innerHTML = '';
            }
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      });
      writersRef.current = [];
    };
  }, [word, size, characters, charactersKey]); // Only recreate when word changes, not speed

  const handleToggleAnimation = () => {
    if (writersRef.current.length === 0) return;

    if (isPaused) {
      // Resume animation - get the writer for current speed
      writersRef.current.forEach((writers) => {
        if (writers) {
          const writer = animationSpeed === 0.5 ? writers.slow : animationSpeed === 4 ? writers.fast : writers.normal;
          if (writer) {
            try {
              writer.resumeAnimation();
            } catch (error) {
              // Ignore errors
            }
          }
        }
      });
      setIsPaused(false);
      return;
    }

    if (isAnimating) {
      // Pause animation - get the writer for current speed
      writersRef.current.forEach((writers) => {
        if (writers) {
          const writer = animationSpeed === 0.5 ? writers.slow : animationSpeed === 4 ? writers.fast : writers.normal;
          if (writer) {
            try {
              writer.pauseAnimation();
            } catch (error) {
              // Ignore errors
            }
          }
        }
      });
      setIsPaused(true);
      return;
    }

    // Start animation - first cancel any existing animations and update visibility
    writersRef.current.forEach((writers, index) => {
      if (writers) {
        try {
          // TODO: Investigate - cancelQuiz() is documented for quizzes, but we're using it to stop animations.
          // Check if there's a better method like cancelAnimation() or if cancelQuiz() works for both.
          // Cancel all
          if (writers.slow) writers.slow.cancelQuiz();
          if (writers.normal) writers.normal.cancelQuiz();
          if (writers.fast) writers.fast.cancelQuiz();
        } catch (error) {
          // Ignore errors
        }
      }
    });
    
    // Update visibility for all characters before starting animation
    updateWriterVisibility();

    setIsAnimating(true);
    setIsPaused(false);
    
    // Animate all characters sequentially
    const animateNext = (index: number) => {
      if (index >= writersRef.current.length) {
        setIsAnimating(false);
        setIsPaused(false);
        return;
      }

      const writers = writersRef.current[index];
      const container = containerRefs.current[index];
      
      if (writers && container) {
        // Get the writer and div for current speed
        const isSlow = animationSpeed === 0.5;
        const isFast = animationSpeed === 4;
        const writer = isSlow ? writers.slow : isFast ? writers.fast : writers.normal;
        
        const slowDiv = (container as any).slowDiv;
        const normalDiv = (container as any).normalDiv;
        const fastDiv = (container as any).fastDiv;
        
        if (writer) {
          // First, ensure the correct div is visible
          if (slowDiv) slowDiv.style.display = isSlow ? 'block' : 'none';
          if (normalDiv) normalDiv.style.display = (!isSlow && !isFast) ? 'block' : 'none';
          if (fastDiv) fastDiv.style.display = isFast ? 'block' : 'none';
          
          // Hide all characters first
          try {
            if (writers.slow) writers.slow.hideCharacter();
            if (writers.normal) writers.normal.hideCharacter();
            if (writers.fast) writers.fast.hideCharacter();
          } catch (error) {
            // Ignore errors
          }
          
          // Wait a moment for hide to complete and div to be visible, then animate
          setTimeout(() => {
            try {
              writer.animateCharacter({
                onComplete: () => {
                  // Small delay between characters
                  setTimeout(() => {
                    animateNext(index + 1);
                  }, 200);
                }
              });
            } catch (error) {
              console.error('Error animating character:', error);
              // Continue to next character even if this one fails
              setTimeout(() => {
                animateNext(index + 1);
              }, 200);
            }
          }, 200); // Increased delay to ensure div is visible
        } else {
          // Skip if writer not available
          setTimeout(() => {
            animateNext(index + 1);
          }, 200);
        }
      } else {
        // Skip if writers not available
        setTimeout(() => {
          animateNext(index + 1);
        }, 200);
      }
    };

    animateNext(0);
  };

  // Show/hide writers based on current speed
  const updateWriterVisibility = useCallback(() => {
    writersRef.current.forEach((writers, index) => {
      if (writers) {
        const container = containerRefs.current[index];
        if (container) {
          const slowDiv = (container as any).slowDiv;
          const normalDiv = (container as any).normalDiv;
          const fastDiv = (container as any).fastDiv;
          
          // Hide all divs
          if (slowDiv) slowDiv.style.display = 'none';
          if (normalDiv) normalDiv.style.display = 'none';
          if (fastDiv) fastDiv.style.display = 'none';
          
          // Show the div for current speed
          if (animationSpeed === 0.5 && slowDiv) {
            slowDiv.style.display = 'block';
          } else if (animationSpeed === 4 && fastDiv) {
            fastDiv.style.display = 'block';
          } else if (normalDiv) {
            normalDiv.style.display = 'block';
          }
        }
      }
    });
  }, [animationSpeed]);

  const handleSpeedChange = (speed: number, delay: number) => {
    setAnimationSpeed(speed);
    setDelayBetweenStrokes(delay);
    // Cancel any running animations
    if (isAnimating) {
      writersRef.current.forEach((writers) => {
        if (writers) {
          try {
            // TODO: Investigate - cancelQuiz() is documented for quizzes, but we're using it to stop animations.
            // Check if there's a better method like cancelAnimation() or if cancelQuiz() works for both.
            if (writers.slow) writers.slow.cancelQuiz();
            if (writers.normal) writers.normal.cancelQuiz();
            if (writers.fast) writers.fast.cancelQuiz();
          } catch (error) {
            // Ignore errors
          }
        }
      });
      setIsAnimating(false);
      setIsPaused(false);
    }
    // Update visibility after state update
    setTimeout(updateWriterVisibility, 0);
  };


  // Update visibility when speed changes
  useEffect(() => {
    updateWriterVisibility();
  }, [animationSpeed, updateWriterVisibility]);

  if (characters.length === 0) {
    return null;
  }

  const speedPresets = text ? [
    { label: text.dictionary.speedSlow, speed: 0.5, delay: 500 },
    { label: text.dictionary.speedNormal, speed: 2, delay: 300 },
    { label: text.dictionary.speedFast, speed: 4, delay: 150 },
  ] : [
    { label: 'Slow', speed: 0.5, delay: 500 },
    { label: 'Normal', speed: 2, delay: 300 },
    { label: 'Fast', speed: 4, delay: 150 },
  ];

  return (
    <>
      <div className="mt-4">
        {/* Loading placeholder to prevent layout shift - show until mounted and loaded */}
        {(!mounted || !isLoaded) && (
          <div className="mb-3 flex flex-col items-center min-h-[100px]">
            <div className="flex gap-2 flex-wrap items-center justify-center mb-3">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-1"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Placeholder for stroke order canvas */}
            <div className="flex gap-2 justify-center">
              {characters.map((_, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded bg-gray-50"
                  style={{ width: size, height: size }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {mounted && isLoaded && (
          <div className="mb-3 flex gap-2 flex-wrap items-center justify-center">
            <button
              onClick={handleToggleAnimation}
              aria-label={text ? (isPaused ? text.dictionary.resume : isAnimating ? text.dictionary.pause : text.dictionary.write) : (isPaused ? 'Resume' : isAnimating ? 'Pause' : 'Write')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isAnimating && !isPaused
                  ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                  : 'text-teal-600 bg-teal-50 hover:bg-teal-100'
              }`}
            >
              {text ? (isPaused ? text.dictionary.resume : isAnimating ? text.dictionary.pause : text.dictionary.write) : (isPaused ? 'Resume' : isAnimating ? 'Pause' : 'Write')}
            </button>
            <span className="text-xs text-gray-600 mx-1">{text ? text.dictionary.speed : 'Speed:'}</span>
            {speedPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleSpeedChange(preset.speed, preset.delay)}
                aria-label={`${text ? text.dictionary.speed : 'Speed'}: ${preset.label}`}
                aria-pressed={animationSpeed === preset.speed && delayBetweenStrokes === preset.delay}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  animationSpeed === preset.speed && delayBetweenStrokes === preset.delay
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        {/* Stroke order containers - invisible until loaded to prevent duplication but keep in DOM for refs */}
        <div 
          className={`flex flex-wrap gap-4 justify-center ${(!mounted || !isLoaded) ? 'invisible' : ''}`}
          suppressHydrationWarning
        >
          {characters.map((char, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                ref={(el) => {
                  containerRefs.current[index] = el;
                }}
                className="border border-gray-200 rounded-lg bg-white"
                style={{ width: size, height: size }}
              />
              {characters.length > 1 && (
                <span className="text-xs text-gray-500 mt-1">{char}</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </>
  );
}

