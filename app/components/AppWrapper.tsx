'use client';

import React, { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash has been shown before in this session
    const splashShown = sessionStorage.getItem('splashShown');
    
    if (splashShown) {
      setShowSplash(false);
    } else {
      // Mark splash as shown for this session
      sessionStorage.setItem('splashShown', 'true');
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <>{children}</>;
};
