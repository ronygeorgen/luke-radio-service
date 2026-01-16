import { useEffect, useState, useMemo, useRef } from 'react';
import { dashboardApi } from '../../../services/dashboardApi';

// Cache for word count data
const wordCountCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const WordCloudSlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wordCounts, setWordCounts] = useState({});
  const fetchTimeoutRef = useRef(null);

  // Vibrant color palette for words - better distribution
  const colors = [
    '#ef4444', // Red
    '#fbbf24', // Yellow
    '#10b981', // Green
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#f97316', // Orange
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#22c55e', // Emerald
    '#f59e0b', // Amber
    '#14b8a6', // Teal
    '#a855f7', // Violet
    '#ffffff', // White
    '#9ca3af', // Gray
    '#eab308', // Yellow-500
  ];

  // Fetch word count data with caching and debouncing
  useEffect(() => {
    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const fetchWordCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const channelId = localStorage.getItem('channelId');
        if (!channelId) {
          setError('Channel ID not found. Please select a channel first.');
          setLoading(false);
          return;
        }

        if (!dateRange || !dateRange.start || !dateRange.end) {
          setLoading(false);
          return;
        }

        const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;

        // Create cache key
        const cacheKey = `${channelId}-${dateRange.start}-${dateRange.end}-${shiftId || 'all'}`;
        
        // Check cache first
        const cached = wordCountCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setWordCounts(cached.data);
          setIsVisible(false);
          setTimeout(() => setIsVisible(true), 100);
          setLoading(false);
          return;
        }

        const response = await dashboardApi.getWordCount(
          dateRange.start,
          dateRange.end,
          channelId,
          shiftId
        );

        const wordCountsData = response.word_counts || {};
        
        // Store in cache
        wordCountCache.set(cacheKey, {
          data: wordCountsData,
          timestamp: Date.now()
        });

        setWordCounts(wordCountsData);

        // Reset and trigger animations with delay
        setIsVisible(false);
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 100);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching word counts:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch word counts');
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch to avoid rapid API calls
    fetchTimeoutRef.current = setTimeout(fetchWordCounts, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [dateRange?.start, dateRange?.end, currentShiftId]);

  // Organic cloud-like layout algorithm with dramatic size differences
  const layoutWords = useMemo(() => {
    if (!wordCounts || Object.keys(wordCounts).length === 0) {
      return [];
    }

    // Convert word counts to array and sort by count (descending)
    const wordsArray = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    if (wordsArray.length === 0) return [];

    // Calculate min and max counts for size scaling
    const counts = wordsArray.map(w => w.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    // Container dimensions
    const CONTAINER_WIDTH = 1200;
    const CONTAINER_HEIGHT = 600;
    const CENTER_X = CONTAINER_WIDTH / 2;
    const CENTER_Y = CONTAINER_HEIGHT / 2;
    
    // Margin to prevent words from being clipped at edges
    // Use a margin that accounts for the largest possible word size
    const MARGIN = 20; // Margin in pixels to ensure words stay fully visible
    const MIN_X = MARGIN;
    const MAX_X = CONTAINER_WIDTH - MARGIN;
    const MIN_Y = MARGIN;
    const MAX_Y = CONTAINER_HEIGHT - MARGIN;

    // Calculate size with more dramatic differences - less compression
    const calculateSize = (count) => {
      // Use less compressed scaling for more dramatic size differences
      const normalized = (count - minCount) / (maxCount - minCount || 1);
      
      // Much wider size range - larger words should be MUCH bigger
      const minSize = 10;   // Smallest words
      const maxSize = 80;  // Largest words - much bigger than before
      
      // Use power function to make size differences more dramatic
      // Higher frequency = exponentially larger
      const powerNormalized = Math.pow(normalized, 0.7); // Less compression than sqrt
      return minSize + (powerNormalized * (maxSize - minSize));
    };

    // Collision detection using bounding boxes with improved accuracy
    const placedBounds = [];

    // Consistent padding constant - must be the same everywhere
    const COLLISION_PADDING = 1.0; // Safe padding to account for font rendering, anti-aliasing, and sub-pixel differences
    
    const hasCollision = (x, y, width, height, word = '') => {
      // Robust rectangular collision detection with guaranteed no-overlap
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      
      // Calculate bounding box edges for current word with padding
      const left1 = x - halfWidth - COLLISION_PADDING;
      const right1 = x + halfWidth + COLLISION_PADDING;
      const top1 = y - halfHeight - COLLISION_PADDING;
      const bottom1 = y + halfHeight + COLLISION_PADDING;
      
      // Check against all placed words using proper rectangular overlap detection
      for (const bound of placedBounds) {
        // Calculate bounding box edges for placed word with padding
        const left2 = bound.x - bound.halfWidth - COLLISION_PADDING;
        const right2 = bound.x + bound.halfWidth + COLLISION_PADDING;
        const top2 = bound.y - bound.halfHeight - COLLISION_PADDING;
        const bottom2 = bound.y + bound.halfHeight + COLLISION_PADDING;
        
        // Proper rectangular collision: boxes overlap if they intersect on BOTH axes
        // Two rectangles overlap if:
        // - left1 < right2 AND right1 > left2 (overlap on X axis)
        // - top1 < bottom2 AND bottom1 > top2 (overlap on Y axis)
        if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
          return true;
        }
      }
      return false;
    };

    // Helper to calculate accurate text dimensions
    // Uses conservative estimates to ensure collision detection is accurate
    const calculateTextDimensions = (word, fontSize, isVertical) => {
      // More conservative character width to account for actual rendered width
      // Average character width is typically 0.5-0.6x font size, using 0.5 for safety
      const avgCharWidth = fontSize * 0.5;
      const charHeight = fontSize * 0.92; // Slightly conservative height
      
      // Calculate actual text width - add small buffer for character width variations
      const textWidth = word.length * avgCharWidth;
      const textHeight = charHeight;
      
      if (isVertical) {
        // After 90deg rotation, dimensions swap
        return {
          width: textHeight,
          height: textWidth,
          halfWidth: textHeight / 2,
          halfHeight: textWidth / 2
        };
      } else {
        return {
          width: textWidth,
          height: textHeight,
          halfWidth: textWidth / 2,
          halfHeight: textHeight / 2
        };
      }
    };

    // Archimedean spiral for organic cloud shape
    const getSpiralPosition = (angle, radius) => {
      // Archimedean spiral: r = a * θ
      const spiralRadius = radius * 0.35; // Very tight spiral for maximum density
      const x = CENTER_X + spiralRadius * Math.cos(angle);
      const y = CENTER_Y + spiralRadius * Math.sin(angle);
      return { x, y };
    };

    const placedWords = [];
    // Ensure we try to place at least 100 words
    const wordsToPlace = wordsArray.slice(0, Math.max(100, wordsArray.length));

    // Place words starting from center, spiraling outward
    // Some words will be vertical (90deg rotation) for better packing
    
    // Helper to decide if word should be vertical (about 35% vertical for variety)
    const shouldBeVertical = (index) => {
      // Use a pattern that creates good distribution
      // Pattern: roughly 1/3 vertical, 2/3 horizontal
      return (index % 3 === 1) || (index % 7 === 0);
    };
    
    for (let i = 0; i < wordsToPlace.length; i++) {
      const { word, count } = wordsToPlace[i];
      const fontSize = calculateSize(count);
      const isVertical = shouldBeVertical(i);
      
      // Calculate accurate text dimensions
      const { width: textWidth, height: textHeight, halfWidth, halfHeight } = 
        calculateTextDimensions(word, fontSize, isVertical);
      
      // Try to place word using spiral pattern
      let placed = false;
      const maxAttempts = 600; // More attempts for tighter packing
      let spiralAngle = 0;
      let spiralRadius = 0;
      
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        // Increase spiral radius gradually - very tight for maximum density
        spiralRadius = Math.sqrt(attempt) * 1.4; // Even tighter for closer spacing
        spiralAngle = attempt * 0.18; // Tighter angle increment
        
        // Add minimal randomness to spiral for organic shape
        const randomOffset = (Math.random() - 0.5) * 6; // Reduced for tighter packing
        const angle = spiralAngle + randomOffset;
        
        const { x, y } = getSpiralPosition(angle, spiralRadius);
        
        // Ensure word stays within bounds (with margin to prevent clipping)
        if (x - halfWidth < MIN_X || x + halfWidth > MAX_X ||
            y - halfHeight < MIN_Y || y + halfHeight > MAX_Y) {
          continue;
        }
        
        // Check for collisions with improved detection
        if (!hasCollision(x, y, textWidth, textHeight, word)) {
          // Place the word
          placedBounds.push({
            x,
            y,
            halfWidth,
            halfHeight,
            word,
            fontSize,
            isVertical
          });
          
          // Convert to percentage for CSS positioning
          const xPercent = (x / CONTAINER_WIDTH) * 100;
          const yPercent = (y / CONTAINER_HEIGHT) * 100;
          
          const color = colors[i % colors.length];
          
          placedWords.push({
            word,
            count,
            fontSize,
            x: xPercent,
            y: yPercent,
            color,
            isVertical, // Store vertical flag (90deg rotation)
            pixelX: x, // Store pixel coordinates for post-processing
            pixelY: y
          });
          
          placed = true;
        }
      }
      
      // If couldn't place after spiral attempts, try random positions
      // This ensures we place as many words as possible
      if (!placed) {
        const randomAttempts = 400; // More random attempts for tighter packing
        for (let randomAttempt = 0; randomAttempt < randomAttempts; randomAttempt++) {
          // Try random positions within safe bounds (with margin)
          const x = Math.random() * (MAX_X - MIN_X - textWidth) + MIN_X + halfWidth;
          const y = Math.random() * (MAX_Y - MIN_Y - textHeight) + MIN_Y + halfHeight;
          
          if (!hasCollision(x, y, textWidth, textHeight, word)) {
            placedBounds.push({
              x,
              y,
              halfWidth,
              halfHeight,
              word,
              fontSize,
              isVertical
            });
            
            const xPercent = (x / CONTAINER_WIDTH) * 100;
            const yPercent = (y / CONTAINER_HEIGHT) * 100;
            
            const color = colors[i % colors.length];
            
            placedWords.push({
              word,
              count,
              fontSize,
              x: xPercent,
              y: yPercent,
              color,
              isVertical, // Store vertical flag
              pixelX: x,
              pixelY: y
            });
            
            placed = true;
            break;
          }
        }
      }
      
      // If still not placed and we have less than 100 words, try with reduced size
      if (!placed && placedWords.length < 100) {
        const reducedFontSize = Math.max(10, fontSize * 0.7);
        const { width: reducedTextWidth, height: reducedTextHeight, halfWidth: reducedHalfWidth, halfHeight: reducedHalfHeight } = 
          calculateTextDimensions(word, reducedFontSize, isVertical);
        
        for (let attempt = 0; attempt < 250; attempt++) {
          // Try random positions within safe bounds (with margin)
          const x = Math.random() * (MAX_X - MIN_X - reducedTextWidth) + MIN_X + reducedHalfWidth;
          const y = Math.random() * (MAX_Y - MIN_Y - reducedTextHeight) + MIN_Y + reducedHalfHeight;
          
          if (!hasCollision(x, y, reducedTextWidth, reducedTextHeight, word)) {
            placedBounds.push({
              x,
              y,
              halfWidth: reducedHalfWidth,
              halfHeight: reducedHalfHeight,
              word,
              fontSize: reducedFontSize,
              isVertical
            });
            
            const xPercent = (x / CONTAINER_WIDTH) * 100;
            const yPercent = (y / CONTAINER_HEIGHT) * 100;
            
            const color = colors[i % colors.length];

            placedWords.push({
              word,
              count,
              fontSize: reducedFontSize,
              x: xPercent,
              y: yPercent,
              color,
              isVertical, // Keep vertical orientation
              pixelX: x,
              pixelY: y
            });
            
            placed = true;
            break;
          }
        }
      }
    }

    // Post-processing: Aggressively eliminate ALL overlaps with guaranteed separation
    const eliminateOverlaps = () => {
      const maxIterations = 15; // More iterations to ensure complete separation
      let iterations = 0;
      
      while (iterations < maxIterations) {
        let hasOverlap = false;
        
        for (let i = 0; i < placedWords.length; i++) {
          const word1 = placedWords[i];
          const dims1 = calculateTextDimensions(word1.word, word1.fontSize, word1.isVertical);
          const x1 = word1.pixelX;
          const y1 = word1.pixelY;
          
          // Calculate bounding box for word1 with consistent padding
          const left1 = x1 - dims1.halfWidth - COLLISION_PADDING;
          const right1 = x1 + dims1.halfWidth + COLLISION_PADDING;
          const top1 = y1 - dims1.halfHeight - COLLISION_PADDING;
          const bottom1 = y1 + dims1.halfHeight + COLLISION_PADDING;
          
          for (let j = i + 1; j < placedWords.length; j++) {
            const word2 = placedWords[j];
            const dims2 = calculateTextDimensions(word2.word, word2.fontSize, word2.isVertical);
            const x2 = word2.pixelX;
            const y2 = word2.pixelY;
            
            // Calculate bounding box for word2 with consistent padding
            const left2 = x2 - dims2.halfWidth - COLLISION_PADDING;
            const right2 = x2 + dims2.halfWidth + COLLISION_PADDING;
            const top2 = y2 - dims2.halfHeight - COLLISION_PADDING;
            const bottom2 = y2 + dims2.halfHeight + COLLISION_PADDING;
            
            // Proper rectangular collision detection (same as hasCollision)
            const overlaps = left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;
            
            if (overlaps) {
              hasOverlap = true;
              
              // Calculate overlap amounts on both axes
              const overlapX = Math.min(right1 - left2, right2 - left1);
              const overlapY = Math.min(bottom1 - top2, bottom2 - top1);
              
              // Calculate centers and direction vector
              const dx = x2 - x1;
              const dy = y2 - y1;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // If words are on top of each other, use a default direction
              let moveX, moveY;
              if (distance < 0.1) {
                // Words are essentially on top of each other, move in a random direction
                const angle = Math.random() * Math.PI * 2;
                moveX = Math.cos(angle);
                moveY = Math.sin(angle);
              } else {
                // Normalize direction vector
                moveX = dx / distance;
                moveY = dy / distance;
              }
              
              // Calculate how much to move - move enough to completely eliminate overlap
              // Use the larger overlap to ensure complete separation with extra safety margin
              const maxOverlap = Math.max(overlapX, overlapY);
              const moveDistance = maxOverlap * 1.5 + COLLISION_PADDING; // Move 150% + padding to guarantee complete separation
              
              // Move words apart - move smaller word more to preserve larger word positions
              if (word1.fontSize <= word2.fontSize) {
                // Move word1 away from word2
                const newX = x1 - moveX * moveDistance;
                const newY = y1 - moveY * moveDistance;
                
                // Ensure word stays within bounds
                word1.pixelX = Math.max(MIN_X + dims1.halfWidth, Math.min(MAX_X - dims1.halfWidth, newX));
                word1.pixelY = Math.max(MIN_Y + dims1.halfHeight, Math.min(MAX_Y - dims1.halfHeight, newY));
                word1.x = (word1.pixelX / CONTAINER_WIDTH) * 100;
                word1.y = (word1.pixelY / CONTAINER_HEIGHT) * 100;
              } else {
                // Move word2 away from word1
                const newX = x2 + moveX * moveDistance;
                const newY = y2 + moveY * moveDistance;
                
                // Ensure word stays within bounds
                word2.pixelX = Math.max(MIN_X + dims2.halfWidth, Math.min(MAX_X - dims2.halfWidth, newX));
                word2.pixelY = Math.max(MIN_Y + dims2.halfHeight, Math.min(MAX_Y - dims2.halfHeight, newY));
                word2.x = (word2.pixelX / CONTAINER_WIDTH) * 100;
                word2.y = (word2.pixelY / CONTAINER_HEIGHT) * 100;
              }
            }
          }
        }
        
        if (!hasOverlap) break;
        iterations++;
      }
    };
    
    // Final validation: Check for any remaining collisions using the same algorithm
    const validateNoCollisions = () => {
      const wordsToKeep = [];
      const validatedBounds = [];
      
      // Sort words by size (largest first) to prioritize keeping important words
      const sortedWords = [...placedWords].sort((a, b) => b.fontSize - a.fontSize);
      
      for (let i = 0; i < sortedWords.length; i++) {
        const word = sortedWords[i];
        const dims = calculateTextDimensions(word.word, word.fontSize, word.isVertical);
        const x = word.pixelX;
        const y = word.pixelY;
        
        // Check if this word collides with any already validated word
        let hasCollision = false;
        const left1 = x - dims.halfWidth - COLLISION_PADDING;
        const right1 = x + dims.halfWidth + COLLISION_PADDING;
        const top1 = y - dims.halfHeight - COLLISION_PADDING;
        const bottom1 = y + dims.halfHeight + COLLISION_PADDING;
        
        for (const bound of validatedBounds) {
          const left2 = bound.x - bound.halfWidth - COLLISION_PADDING;
          const right2 = bound.x + bound.halfWidth + COLLISION_PADDING;
          const top2 = bound.y - bound.halfHeight - COLLISION_PADDING;
          const bottom2 = bound.y + bound.halfHeight + COLLISION_PADDING;
          
          // Use the same collision detection algorithm
          if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
            hasCollision = true;
            break;
          }
        }
        
        // Only keep words that don't collide
        if (!hasCollision) {
          wordsToKeep.push(word);
          validatedBounds.push({
            x,
            y,
            halfWidth: dims.halfWidth,
            halfHeight: dims.halfHeight
          });
        }
      }
      
      return wordsToKeep;
    };
    
    // Run post-processing to eliminate overlaps
    eliminateOverlaps();
    
    // Final validation to ensure absolutely no collisions
    let validatedWords = validateNoCollisions();
    
    // Double-check: Run one more post-processing pass on validated words to be absolutely sure
    if (validatedWords.length > 0) {
      // Update placedWords and placedBounds for another pass
      placedWords.length = 0;
      placedWords.push(...validatedWords);
      placedBounds.length = 0;
      
      // Rebuild placedBounds from validated words with current positions
      for (const word of validatedWords) {
        const dims = calculateTextDimensions(word.word, word.fontSize, word.isVertical);
        placedBounds.push({
          x: word.pixelX,
          y: word.pixelY,
          halfWidth: dims.halfWidth,
          halfHeight: dims.halfHeight,
          word: word.word,
          fontSize: word.fontSize,
          isVertical: word.isVertical
        });
      }
      
      // Run one more aggressive elimination pass
      eliminateOverlaps();
      
      // Update validated words with new positions after post-processing
      validatedWords = placedWords.map(word => ({
        ...word,
        x: (word.pixelX / CONTAINER_WIDTH) * 100,
        y: (word.pixelY / CONTAINER_HEIGHT) * 100
      }));
      
      // Final validation one more time to ensure no collisions
      validatedWords = validateNoCollisions();
    }
    
    return validatedWords;
  }, [wordCounts, colors]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-gray-300/50 rounded-lg animate-pulse mx-auto mb-8"></div>
          <div className="relative h-[600px] bg-black rounded-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/50">Loading word cloud...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      data-loaded={!loading && !error && isVisible ? 'true' : 'false'}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Word Cloud</h2>

        <div className="relative h-[600px] bg-black rounded-2xl overflow-hidden">
          {layoutWords.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/50 text-lg">No word data available</p>
            </div>
          ) : (
            layoutWords.map((item, index) => (
              <div
                key={`${item.word}-${index}`}
                className="absolute transition-all duration-700 cursor-pointer hover:scale-105"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  fontSize: `${item.fontSize}px`,
                  color: item.color,
                  fontWeight: 'normal',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? `translate(-50%, -50%) ${item.isVertical ? 'rotate(90deg)' : 'rotate(0deg)'} scale(1)`
                    : `translate(-50%, -50%) ${item.isVertical ? 'rotate(90deg)' : 'rotate(0deg)'} scale(0)`,
                  transitionDelay: `${index * 2}ms`,
                  transformOrigin: 'center',
                  textShadow: `0 0 8px ${item.color}60, 0 0 4px ${item.color}40`,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  margin: 0,
                  padding: 0,
                  lineHeight: 1,
                  letterSpacing: '0px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
                title={`${item.word}: ${item.count} occurrences`}
              >
                {item.word}
              </div>
            ))
          )}
        </div>

        {layoutWords.length > 0 && (
          <div className="mt-4 text-center text-white/70 text-sm">
            Showing top {layoutWords.length} words (of {Object.keys(wordCounts).length} unique words)
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCloudSlide;
