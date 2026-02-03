"use client";

import { useEffect } from "react";

/**
 * Component to suppress known harmless console errors
 * These errors typically come from browser extensions or third-party scripts
 */
export default function ErrorSuppression() {
  useEffect(() => {
    // Store original console.error
    const originalError = console.error;
    
    // List of error patterns to suppress
    const suppressPatterns = [
      /Could not find element.*u_\d+_\w+/,
      /Caught in: Module.*inst_/,
      /Requiring module.*which threw an exception/,
      /ErrorUtils caught an error/,
    ];
    
    // Override console.error
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      
      // Check if error matches any suppress pattern
      const shouldSuppress = suppressPatterns.some(pattern => 
        pattern.test(message)
      );
      
      // Only log if not suppressed
      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };
    
    // Cleanup on unmount
    return () => {
      console.error = originalError;
    };
  }, []);
  
  return null;
}
