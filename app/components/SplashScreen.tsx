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
          className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center z-50 px-4"
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
              className="mb-6 sm:mb-8 relative"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-white/30 rounded-3xl blur-3xl"></div>

              {/* Logo Container */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl ring-4 ring-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl sm:rounded-3xl"></div>
                <TrendingUp className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-blue-900" strokeWidth={2.5} />
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-3 sm:mb-4"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-1 sm:mb-2">
                <span className="inline-block bg-gradient-to-r from-white via-blue-300 to-white bg-clip-text text-transparent">
                  BBT
                </span>
                <span className="inline-block text-white font-bold">
                  finance
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-200 tracking-widest uppercase">
                Trading Excellence
              </p>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-md mx-auto px-4"
            >
              Your Professional Trading Performance Platform
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
              <div className="flex items-center space-x-2 text-blue-200">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Trading</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
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
