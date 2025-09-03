import React, { useEffect } from 'react';

interface ErrorSuppressorProps {
  suppressPatterns?: string[];
  showSuppressedCount?: boolean;
}

export default function ErrorSuppressor({ 
  suppressPatterns = [
    'Failed to fetch',
    'Error fetching users',
    'Edge function',
    'Network error',
    'CORS',
    'fetch',
    'AbortError'
  ],
  showSuppressedCount = false 
}: ErrorSuppressorProps) {
  useEffect(() => {
    let suppressedCount = 0;
    
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Override console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ').toLowerCase();
      const shouldSuppress = suppressPatterns.some(pattern => 
        message.includes(pattern.toLowerCase())
      );
      
      if (shouldSuppress) {
        suppressedCount++;
        if (showSuppressedCount && suppressedCount % 10 === 0) {
          originalError(`[ErrorSuppressor] Suppressed ${suppressedCount} fetch errors`);
        }
        return;
      }
      
      // Call original console.error for non-suppressed errors
      originalError.apply(console, args);
    };
    
    // Override console.warn similarly
    console.warn = (...args: any[]) => {
      const message = args.join(' ').toLowerCase();
      const shouldSuppress = suppressPatterns.some(pattern => 
        message.includes(pattern.toLowerCase())
      );
      
      if (shouldSuppress) {
        suppressedCount++;
        return;
      }
      
      originalWarn.apply(console, args);
    };
    
    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      
      if (showSuppressedCount && suppressedCount > 0) {
        originalError(`[ErrorSuppressor] Total suppressed errors: ${suppressedCount}`);
      }
    };
  }, [suppressPatterns, showSuppressedCount]);

  // This component doesn't render anything
  return null;
}