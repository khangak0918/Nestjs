// useStateChangeTracker.js
import { useEffect, useState } from 'react';
 
/**
* A hook that tracks state-driven re-renders and applies a red border effect
* This only highlights when dependencies change, not on every render
*
* @param {array} dependencies - Array of dependencies to watch for changes
* @param {number} delay - How long to show the border (in ms)
* @returns {object} - Object containing style and render count
*/
export function useStateChangeTracker(dependencies: any[] = [], delay = 500) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  // const renderCount = useRef(0);
  const [count, setCount] = useState(0);
  // const isFirstMount = useRef(true);
 
  // Track total renders (for debugging)
  // renderCount.current += 1;
 
  // Only trigger highlight effect when dependencies change
  useEffect(() => {
    // Skip the first mount
    // if (isFirstMount.current) {
    //   isFirstMount.current = false;
    //   setCount(1);
    //   return;
    // }
 
    // Increment counter and show highlight
    setCount(prev => prev + 1);
    setIsHighlighted(true);
    
    // Remove highlight after delay
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, delay);
    
    return () => clearTimeout(timer);
  }, dependencies); // This effect depends on the passed dependencies
 
  return {
    style: isHighlighted ? {
      border: '2px solid red',
      transition: 'border-color 0.2s ease-in-out'
    } : {
      border: '2px solid transparent',
      transition: 'border-color 0.2s ease-in-out'
    },
    renderCount: count,
    // totalRenders: renderCount.current
  };
}