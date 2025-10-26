'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, Target } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to complete before calling onComplete
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center z-50 px-4"
        >
          <div className="text-center max-w-md mx-auto">
            {/* Logo/Icon Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1,
                delay: 0.2,
                type: "spring",
                stiffness: 200
              }}
              className="mb-6 sm:mb-8"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4"
            >
              BBT Trades
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8"
            >
              Professional Trading Platform
            </motion.p>

            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex items-center justify-center space-x-2"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.2
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.4
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
            </motion.div>

            {/* Feature Icons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8 mt-8 sm:mt-12"
            >
              <div className="flex items-center space-x-2 text-blue-100">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Trading</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Sessions</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
