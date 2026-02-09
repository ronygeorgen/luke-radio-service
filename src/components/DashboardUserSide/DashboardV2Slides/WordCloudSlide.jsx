import { useEffect, useState, useMemo, useRef } from 'react';
import { dashboardApi } from '../../../services/dashboardApi';

// Cache for word count data
const wordCountCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const WordCloudSlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '', reportFolderId = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wordCounts, setWordCounts] = useState({});
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
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
        if (!reportFolderId && !channelId) {
          setError('Channel ID or Report Folder ID not found. Please select a channel or report folder first.');
          setLoading(false);
          return;
        }

        if (!dateRange || !dateRange.start || !dateRange.end) {
          setLoading(false);
          return;
        }

        const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;

        // Create cache key
        const cacheKey = `${reportFolderId || channelId}-${dateRange.start}-${dateRange.end}-${shiftId || 'all'}`;

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
          shiftId,
          reportFolderId
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
  }, [dateRange?.start, dateRange?.end, currentShiftId, reportFolderId]);

  // Mark slide as fully loaded (data + animations done) for PDF capture — backend waits for .dashboard-slide-ready
  useEffect(() => {
    if (loading || error || !isVisible) {
      setIsFullyLoaded(false);
      return;
    }
    const t = setTimeout(() => setIsFullyLoaded(true), 3000);
    return () => clearTimeout(t);
  }, [loading, error, isVisible]);

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
    const MARGIN = 15; // Margin in pixels to ensure words stay fully visible (reduced for tighter packing)
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

    // Enhanced collision detection with spatial grid for performance
    const placedBounds = [];

    // Increased padding to account for font rendering, anti-aliasing, sub-pixel rendering, and browser differences
    // This is critical for 100% collision-free rendering
    const COLLISION_PADDING = 2.0; // Reduced from 3.0 for tighter packing while maintaining safety

    // Spatial grid for efficient collision detection
    // Divide the canvas into a grid to avoid checking every word against every other word
    const GRID_SIZE = 50; // Grid cell size in pixels
    const gridCols = Math.ceil(CONTAINER_WIDTH / GRID_SIZE);
    const gridRows = Math.ceil(CONTAINER_HEIGHT / GRID_SIZE);
    const spatialGrid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null).map(() => []));

    // Helper to get grid cells that a bounding box overlaps
    const getGridCells = (left, right, top, bottom) => {
      const cells = [];
      const minCol = Math.max(0, Math.floor(left / GRID_SIZE));
      const maxCol = Math.min(gridCols - 1, Math.floor(right / GRID_SIZE));
      const minRow = Math.max(0, Math.floor(top / GRID_SIZE));
      const maxRow = Math.min(gridRows - 1, Math.floor(bottom / GRID_SIZE));

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ row, col });
        }
      }
      return cells;
    };

    // Enhanced collision detection with spatial grid optimization
    const hasCollision = (x, y, width, height, word = '') => {
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      // Calculate bounding box with padding
      const left1 = x - halfWidth - COLLISION_PADDING;
      const right1 = x + halfWidth + COLLISION_PADDING;
      const top1 = y - halfHeight - COLLISION_PADDING;
      const bottom1 = y + halfHeight + COLLISION_PADDING;

      // Get grid cells this bounding box overlaps
      const cells = getGridCells(left1, right1, top1, bottom1);
      const checkedBounds = new Set();

      // Only check words in overlapping grid cells
      for (const { row, col } of cells) {
        for (const bound of spatialGrid[row][col]) {
          if (checkedBounds.has(bound)) continue;
          checkedBounds.add(bound);

          const left2 = bound.x - bound.halfWidth - COLLISION_PADDING;
          const right2 = bound.x + bound.halfWidth + COLLISION_PADDING;
          const top2 = bound.y - bound.halfHeight - COLLISION_PADDING;
          const bottom2 = bound.y + bound.halfHeight + COLLISION_PADDING;

          // Proper rectangular collision detection
          if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
            return true;
          }
        }
      }
      return false;
    };

    // Add a word to the spatial grid
    const addToSpatialGrid = (bound) => {
      const left = bound.x - bound.halfWidth - COLLISION_PADDING;
      const right = bound.x + bound.halfWidth + COLLISION_PADDING;
      const top = bound.y - bound.halfHeight - COLLISION_PADDING;
      const bottom = bound.y + bound.halfHeight + COLLISION_PADDING;

      const cells = getGridCells(left, right, top, bottom);
      for (const { row, col } of cells) {
        spatialGrid[row][col].push(bound);
      }
    };

    // Enhanced text dimension calculation with more conservative estimates
    // Uses larger multipliers to account for font rendering differences, kerning, and browser variations
    const calculateTextDimensions = (word, fontSize, isVertical) => {
      // More conservative character width - actual rendered width can vary significantly
      // Using 0.58x for average character width (slightly reduced for tighter packing while maintaining safety)
      // Adding extra buffer for font rendering differences across browsers
      const avgCharWidth = fontSize * 0.58; // Slightly reduced from 0.6 for tighter packing
      const charHeight = fontSize * 0.98; // Slightly reduced from 1.0 for tighter packing

      // Calculate text width with additional buffer for character width variations
      // Some characters are wider (m, w) and some are narrower (i, l)
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
      const spiralRadius = radius * 0.3; // Tighter spiral for denser packing (reduced from 0.35)
      const x = CENTER_X + spiralRadius * Math.cos(angle);
      const y = CENTER_Y + spiralRadius * Math.sin(angle);
      return { x, y };
    };

    const placedWords = [];
    // Try to place more words for denser cloud (increased from 100 to 150)
    const wordsToPlace = wordsArray.slice(0, Math.max(150, wordsArray.length));

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
      const maxAttempts = 800; // More attempts for tighter packing (increased from 600)
      let spiralAngle = 0;
      let spiralRadius = 0;

      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        // Increase spiral radius gradually - very tight for maximum density
        spiralRadius = Math.sqrt(attempt) * 1.2; // Tighter for closer spacing (reduced from 1.4)
        spiralAngle = attempt * 0.15; // Tighter angle increment for denser packing (reduced from 0.18)

        // Add minimal randomness to spiral for organic shape
        const randomOffset = (Math.random() - 0.5) * 5; // Reduced for tighter packing (reduced from 6)
        const angle = spiralAngle + randomOffset;

        const { x, y } = getSpiralPosition(angle, spiralRadius);

        // Ensure word stays within bounds (with margin to prevent clipping)
        if (x - halfWidth < MIN_X || x + halfWidth > MAX_X ||
          y - halfHeight < MIN_Y || y + halfHeight > MAX_Y) {
          continue;
        }

        // Check for collisions with improved detection
        if (!hasCollision(x, y, textWidth, textHeight, word)) {
          // Create bound object
          const bound = {
            x,
            y,
            halfWidth,
            halfHeight,
            word,
            fontSize,
            isVertical
          };

          // Place the word
          placedBounds.push(bound);

          // Add to spatial grid for efficient collision detection
          addToSpatialGrid(bound);

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
        const randomAttempts = 500; // More random attempts for tighter packing (increased from 400)
        for (let randomAttempt = 0; randomAttempt < randomAttempts; randomAttempt++) {
          // Try random positions within safe bounds (with margin)
          const x = Math.random() * (MAX_X - MIN_X - textWidth) + MIN_X + halfWidth;
          const y = Math.random() * (MAX_Y - MIN_Y - textHeight) + MIN_Y + halfHeight;

          if (!hasCollision(x, y, textWidth, textHeight, word)) {
            const bound = {
              x,
              y,
              halfWidth,
              halfHeight,
              word,
              fontSize,
              isVertical
            };

            placedBounds.push(bound);
            addToSpatialGrid(bound);

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

      // If still not placed and we have less than 150 words, try with reduced size
      if (!placed && placedWords.length < 150) {
        const reducedFontSize = Math.max(10, fontSize * 0.7);
        const { width: reducedTextWidth, height: reducedTextHeight, halfWidth: reducedHalfWidth, halfHeight: reducedHalfHeight } =
          calculateTextDimensions(word, reducedFontSize, isVertical);

        for (let attempt = 0; attempt < 300; attempt++) {
          // Try random positions within safe bounds (with margin)
          const x = Math.random() * (MAX_X - MIN_X - reducedTextWidth) + MIN_X + reducedHalfWidth;
          const y = Math.random() * (MAX_Y - MIN_Y - reducedTextHeight) + MIN_Y + reducedHalfHeight;

          if (!hasCollision(x, y, reducedTextWidth, reducedTextHeight, word)) {
            const bound = {
              x,
              y,
              halfWidth: reducedHalfWidth,
              halfHeight: reducedHalfHeight,
              word,
              fontSize: reducedFontSize,
              isVertical
            };

            placedBounds.push(bound);
            addToSpatialGrid(bound);

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

    // Enhanced post-processing: Force-directed repulsion algorithm with guaranteed separation
    // This uses a physics-based approach to push overlapping words apart
    const eliminateOverlaps = () => {
      const maxIterations = 25; // More iterations for complete convergence
      const damping = 0.8; // Damping factor to prevent oscillation
      let iterations = 0;

      // Rebuild spatial grid from current positions
      const rebuildSpatialGrid = () => {
        // Clear grid
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            spatialGrid[row][col] = [];
          }
        }

        // Rebuild bounds and grid
        placedBounds.length = 0;
        for (const word of placedWords) {
          const dims = calculateTextDimensions(word.word, word.fontSize, word.isVertical);
          const bound = {
            x: word.pixelX,
            y: word.pixelY,
            halfWidth: dims.halfWidth,
            halfHeight: dims.halfHeight,
            word: word.word,
            fontSize: word.fontSize,
            isVertical: word.isVertical
          };
          placedBounds.push(bound);
          addToSpatialGrid(bound);
        }
      };

      while (iterations < maxIterations) {
        rebuildSpatialGrid();

        let maxOverlap = 0;
        const forces = placedWords.map(() => ({ fx: 0, fy: 0 }));

        // Calculate repulsion forces between overlapping words
        for (let i = 0; i < placedWords.length; i++) {
          const word1 = placedWords[i];
          const dims1 = calculateTextDimensions(word1.word, word1.fontSize, word1.isVertical);
          const x1 = word1.pixelX;
          const y1 = word1.pixelY;

          const left1 = x1 - dims1.halfWidth - COLLISION_PADDING;
          const right1 = x1 + dims1.halfWidth + COLLISION_PADDING;
          const top1 = y1 - dims1.halfHeight - COLLISION_PADDING;
          const bottom1 = y1 + dims1.halfHeight + COLLISION_PADDING;

          // Use spatial grid to find nearby words
          const cells = getGridCells(left1, right1, top1, bottom1);
          const checkedIndices = new Set();

          for (const { row, col } of cells) {
            for (const bound of spatialGrid[row][col]) {
              const j = placedBounds.indexOf(bound);
              if (j === -1 || j === i || checkedIndices.has(j)) continue;
              checkedIndices.add(j);

              const word2 = placedWords[j];
              const dims2 = calculateTextDimensions(word2.word, word2.fontSize, word2.isVertical);
              const x2 = word2.pixelX;
              const y2 = word2.pixelY;

              const left2 = x2 - dims2.halfWidth - COLLISION_PADDING;
              const right2 = x2 + dims2.halfWidth + COLLISION_PADDING;
              const top2 = y2 - dims2.halfHeight - COLLISION_PADDING;
              const bottom2 = y2 + dims2.halfHeight + COLLISION_PADDING;

              // Check for overlap
              if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
                // Calculate overlap amounts
                const overlapX = Math.min(right1 - left2, right2 - left1);
                const overlapY = Math.min(bottom1 - top2, bottom2 - top1);
                const currentOverlap = Math.max(overlapX, overlapY);
                maxOverlap = Math.max(maxOverlap, currentOverlap);

                // Calculate direction vector
                const dx = x2 - x1;
                const dy = y2 - y1;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Calculate repulsion force (stronger for larger overlaps)
                let forceX, forceY;
                if (distance < 0.1) {
                  // Words are on top of each other, use random direction
                  const angle = Math.random() * Math.PI * 2;
                  forceX = Math.cos(angle);
                  forceY = Math.sin(angle);
                } else {
                  // Normalize and apply stronger force for larger overlaps
                  forceX = (dx / distance) * (currentOverlap + COLLISION_PADDING * 2);
                  forceY = (dy / distance) * (currentOverlap + COLLISION_PADDING * 2);
                }

                // Apply force - smaller word moves more
                const forceMultiplier = word1.fontSize <= word2.fontSize ? 1.0 : 0.5;
                forces[i].fx -= forceX * forceMultiplier;
                forces[i].fy -= forceY * forceMultiplier;
                forces[j].fx += forceX * (1.0 - forceMultiplier);
                forces[j].fy += forceY * (1.0 - forceMultiplier);
              }
            }
          }
        }

        // Apply forces with damping
        for (let i = 0; i < placedWords.length; i++) {
          const word = placedWords[i];
          const dims = calculateTextDimensions(word.word, word.fontSize, word.isVertical);

          // Apply force with damping
          const newX = word.pixelX + forces[i].fx * damping;
          const newY = word.pixelY + forces[i].fy * damping;

          // Clamp to bounds
          word.pixelX = Math.max(MIN_X + dims.halfWidth, Math.min(MAX_X - dims.halfWidth, newX));
          word.pixelY = Math.max(MIN_Y + dims.halfHeight, Math.min(MAX_Y - dims.halfHeight, newY));
          word.x = (word.pixelX / CONTAINER_WIDTH) * 100;
          word.y = (word.pixelY / CONTAINER_HEIGHT) * 100;
        }

        // If no overlaps remain, we're done
        if (maxOverlap < 0.1) break;
        iterations++;
      }

      // Final pass: ensure absolute separation by pushing words apart more aggressively
      rebuildSpatialGrid();
      for (let i = 0; i < placedWords.length; i++) {
        const word1 = placedWords[i];
        const dims1 = calculateTextDimensions(word1.word, word1.fontSize, word1.isVertical);
        const x1 = word1.pixelX;
        const y1 = word1.pixelY;

        const left1 = x1 - dims1.halfWidth - COLLISION_PADDING;
        const right1 = x1 + dims1.halfWidth + COLLISION_PADDING;
        const top1 = y1 - dims1.halfHeight - COLLISION_PADDING;
        const bottom1 = y1 + dims1.halfHeight + COLLISION_PADDING;

        const cells = getGridCells(left1, right1, top1, bottom1);
        const checkedIndices = new Set();

        for (const { row, col } of cells) {
          for (const bound of spatialGrid[row][col]) {
            const j = placedBounds.indexOf(bound);
            if (j === -1 || j === i || checkedIndices.has(j)) continue;
            checkedIndices.add(j);

            const word2 = placedWords[j];
            const dims2 = calculateTextDimensions(word2.word, word2.fontSize, word2.isVertical);
            const x2 = word2.pixelX;
            const y2 = word2.pixelY;

            const left2 = x2 - dims2.halfWidth - COLLISION_PADDING;
            const right2 = x2 + dims2.halfWidth + COLLISION_PADDING;
            const top2 = y2 - dims2.halfHeight - COLLISION_PADDING;
            const bottom2 = y2 + dims2.halfHeight + COLLISION_PADDING;

            if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
              // Still overlapping - push apart more aggressively
              const overlapX = Math.min(right1 - left2, right2 - left1);
              const overlapY = Math.min(bottom1 - top2, bottom2 - top1);
              const maxOverlap = Math.max(overlapX, overlapY);

              const dx = x2 - x1;
              const dy = y2 - y1;
              const distance = Math.sqrt(dx * dx + dy * dy);

              let moveX, moveY;
              if (distance < 0.1) {
                const angle = Math.random() * Math.PI * 2;
                moveX = Math.cos(angle);
                moveY = Math.sin(angle);
              } else {
                moveX = dx / distance;
                moveY = dy / distance;
              }

              const moveDistance = maxOverlap * 2.0 + COLLISION_PADDING * 2;

              if (word1.fontSize <= word2.fontSize) {
                const newX = x1 - moveX * moveDistance;
                const newY = y1 - moveY * moveDistance;
                word1.pixelX = Math.max(MIN_X + dims1.halfWidth, Math.min(MAX_X - dims1.halfWidth, newX));
                word1.pixelY = Math.max(MIN_Y + dims1.halfHeight, Math.min(MAX_Y - dims1.halfHeight, newY));
                word1.x = (word1.pixelX / CONTAINER_WIDTH) * 100;
                word1.y = (word1.pixelY / CONTAINER_HEIGHT) * 100;
              } else {
                const newX = x2 + moveX * moveDistance;
                const newY = y2 + moveY * moveDistance;
                word2.pixelX = Math.max(MIN_X + dims2.halfWidth, Math.min(MAX_X - dims2.halfWidth, newX));
                word2.pixelY = Math.max(MIN_Y + dims2.halfHeight, Math.min(MAX_Y - dims2.halfHeight, newY));
                word2.x = (word2.pixelX / CONTAINER_WIDTH) * 100;
                word2.y = (word2.pixelY / CONTAINER_HEIGHT) * 100;
              }
            }
          }
        }
      }
    };

    // Enhanced final validation: Check for any remaining collisions using spatial grid
    const validateNoCollisions = () => {
      const wordsToKeep = [];
      const validatedBounds = [];

      // Rebuild spatial grid for validation
      const validationGrid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null).map(() => []));

      const addToValidationGrid = (bound) => {
        const left = bound.x - bound.halfWidth - COLLISION_PADDING;
        const right = bound.x + bound.halfWidth + COLLISION_PADDING;
        const top = bound.y - bound.halfHeight - COLLISION_PADDING;
        const bottom = bound.y + bound.halfHeight + COLLISION_PADDING;

        const cells = getGridCells(left, right, top, bottom);
        for (const { row, col } of cells) {
          validationGrid[row][col].push(bound);
        }
      };

      // Sort words by size (largest first) to prioritize keeping important words
      const sortedWords = [...placedWords].sort((a, b) => b.fontSize - a.fontSize);

      for (let i = 0; i < sortedWords.length; i++) {
        const word = sortedWords[i];
        const dims = calculateTextDimensions(word.word, word.fontSize, word.isVertical);
        const x = word.pixelX;
        const y = word.pixelY;

        // Check if this word collides with any already validated word using spatial grid
        let hasCollision = false;
        const left1 = x - dims.halfWidth - COLLISION_PADDING;
        const right1 = x + dims.halfWidth + COLLISION_PADDING;
        const top1 = y - dims.halfHeight - COLLISION_PADDING;
        const bottom1 = y + dims.halfHeight + COLLISION_PADDING;

        const cells = getGridCells(left1, right1, top1, bottom1);
        const checkedBounds = new Set();

        for (const { row, col } of cells) {
          for (const bound of validationGrid[row][col]) {
            if (checkedBounds.has(bound)) continue;
            checkedBounds.add(bound);

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
          if (hasCollision) break;
        }

        // Only keep words that don't collide
        if (!hasCollision) {
          wordsToKeep.push(word);
          const bound = {
            x,
            y,
            halfWidth: dims.halfWidth,
            halfHeight: dims.halfHeight
          };
          validatedBounds.push(bound);
          addToValidationGrid(bound);
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

      // Clear and rebuild spatial grid
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          spatialGrid[row][col] = [];
        }
      }

      // Rebuild placedBounds from validated words with current positions
      for (const word of validatedWords) {
        const dims = calculateTextDimensions(word.word, word.fontSize, word.isVertical);
        const bound = {
          x: word.pixelX,
          y: word.pixelY,
          halfWidth: dims.halfWidth,
          halfHeight: dims.halfHeight,
          word: word.word,
          fontSize: word.fontSize,
          isVertical: word.isVertical
        };
        placedBounds.push(bound);
        addToSpatialGrid(bound);
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
      className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'} ${isFullyLoaded ? 'dashboard-slide-ready' : ''}`}
      data-loaded={!loading && !error && isVisible ? 'true' : 'false'}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Word Cloud</h2>

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
