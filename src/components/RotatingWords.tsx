import { useState, useEffect, useRef } from "react";

interface RotatingWordsProps {
  words: string[];
  className?: string;
  interval?: number;
  emphasizedWord?: string;
  emphasisFactor?: number;
}

export const RotatingWords = ({ 
  words, 
  className = "", 
  interval = 2000,
  emphasizedWord,
  emphasisFactor = 1
}: RotatingWordsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const rotateWords = () => {
      if (!isPaused) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
      }
    };

    const timer = setInterval(rotateWords, interval);

    return () => {
      clearInterval(timer);
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [words.length, interval, isPaused]);

  // Handle special words - but ensure rotation continues after a pause
  useEffect(() => {
    const currentWord = words[currentIndex].toLowerCase();
    
    // If we encounter our emphasized word, pause briefly
    if (emphasizedWord && currentWord === emphasizedWord.toLowerCase()) {
      setIsPaused(true);
      
      // Always unpause after the specified duration (default 4s or interval * emphasisFactor)
      const pauseDuration = interval * (emphasisFactor || 2);
      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(false);
      }, pauseDuration);
    }
    
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [currentIndex, words, emphasizedWord, emphasisFactor, interval]);

  // Find the longest word to set container width
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b);

  return (
    <span className={`inline-block relative ${className}`} style={{ minWidth: `${longestWord.length}ch` }}>
      {words.map((word, index) => (
        <span
          key={index}
          className={`inline-block transition-opacity duration-500 ${
            index === currentIndex ? "opacity-100" : "opacity-0 absolute top-0 left-0"
          }`}
        >
          {word}
        </span>
      ))}
    </span>
  );
};