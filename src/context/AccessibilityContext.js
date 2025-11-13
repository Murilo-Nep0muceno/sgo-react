import React, { createContext, useState, useEffect, useMemo } from 'react';

const AccessibilityContext = createContext(null);

const FONT_STEP = 2;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;

export const AccessibilityProvider = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    const stored = localStorage.getItem('accessibility-high-contrast');
    return stored ? JSON.parse(stored) : false;
  });

  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem('accessibility-font-size');
    const parsed = stored ? parseInt(stored, 10) : DEFAULT_FONT_SIZE;
    return isNaN(parsed) ? DEFAULT_FONT_SIZE : parsed;
  });

  useEffect(() => {
    localStorage.setItem('accessibility-high-contrast', JSON.stringify(isHighContrast));
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  useEffect(() => {
    localStorage.setItem('accessibility-font-size', fontSize.toString());
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + FONT_STEP, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - FONT_STEP, MIN_FONT_SIZE));
  };
  
  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const value = useMemo(() => ({
    isHighContrast,
    fontSize,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize
  }), [isHighContrast, fontSize]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext;