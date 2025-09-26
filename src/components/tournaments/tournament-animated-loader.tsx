'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

interface TournamentAnimatedLoaderProps {
  tournamentName?: string;
  onComplete?: () => void;
}

export function TournamentAnimatedLoader({ 
  tournamentName = 'Torneo de Fútbol', 
  onComplete 
}: TournamentAnimatedLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation sequence
    const animationSequence = [
      { duration: 300, progress: 20 },   // Initial quick load
      { duration: 500, progress: 45 },   // Medium load
      { duration: 400, progress: 70 },   // Slower load
      { duration: 600, progress: 90 },   // Slow load
      { duration: 300, progress: 100 },  // Final quick completion
    ];

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const runAnimationStep = () => {
      if (currentIndex >= animationSequence.length) {
        // Animation complete
        setIsAnimating(false);
        if (onComplete) {
          timeoutId = setTimeout(onComplete, 300); // Small delay before calling onComplete
        }
        return;
      }

      const step = animationSequence[currentIndex];
      setProgress(step.progress);
      
      timeoutId = setTimeout(() => {
        currentIndex++;
        runAnimationStep();
      }, step.duration);
    };

    runAnimationStep();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onComplete]);

  if (!isAnimating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="flex flex-col items-center justify-center text-center px-4">
        {/* Animated Trophy Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <Trophy className="h-16 w-16 text-green-400 mx-auto relative animate-bounce" />
        </div>
        
        {/* Tournament Name with Gradient */}
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent mb-2">
          {tournamentName}
        </h1>
        
        {/* Loading Text */}
        <p className="text-gray-400 text-sm md:text-base mb-6">
          Cargando torneo...
        </p>
        
        {/* Progress Bar */}
        <div className="w-64 md:w-80 bg-gray-800 rounded-full h-2.5 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Percentage Text */}
        <span className="text-green-400 text-sm font-medium">
          {progress}%
        </span>
        
        {/* Subtle Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-green-500/10 animate-pulse"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}