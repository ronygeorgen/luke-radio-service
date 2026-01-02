import { useEffect, useState, useMemo } from 'react';
import { dashboardApi } from '../../../services/dashboardApi';

const WordCloudSlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wordCounts, setWordCounts] = useState({});

  // Color palette for words
  const colors = [
    '#ef4444', '#fbbf24', '#10b981', '#14b8a6', '#ec4899',
    '#f97316', '#8b5cf6', '#06b6d4', '#f59e0b', '#3b82f6',
    '#9ca3af', '#84cc16', '#a855f7', '#eab308', '#22c55e'
  ];

  // Fetch word count data
  useEffect(() => {
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

        console.log('Fetching word counts with params:', {
          startDate: dateRange.start,
          endDate: dateRange.end,
          channelId,
          shiftId
        });

        const response = await dashboardApi.getWordCount(
          dateRange.start,
          dateRange.end,
          channelId,
          shiftId
        );

        console.log('Word counts response:', response);

        setWordCounts(response.word_counts || {});

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

    fetchWordCounts();
  }, [dateRange?.start, dateRange?.end, currentShiftId]);

  // Dense packing algorithm - words tightly together without padding
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
    const countRange = maxCount - minCount || 1;

    // Fine-grained grid for tight packing - balance between density and accuracy
    // Container is approximately 1200px wide x 600px tall
    const CONTAINER_WIDTH = 1200;
    const CONTAINER_HEIGHT = 600;
    const GRID_COLS = 120; // Fine grid for density
    const GRID_ROWS = 80;  // Fine grid for density
    const CELL_WIDTH = CONTAINER_WIDTH / GRID_COLS;  // ~10px per cell
    const CELL_HEIGHT = CONTAINER_HEIGHT / GRID_ROWS; // ~7.5px per cell

    // Create grid to track occupied cells
    const grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false));

    // Helper function to check if cells are available
    const isAreaAvailable = (row, col, width, height) => {
      if (row + height > GRID_ROWS || col + width > GRID_COLS) {
        return false;
      }
      for (let r = row; r < row + height; r++) {
        for (let c = col; c < col + width; c++) {
          if (grid[r][c]) {
            return false;
          }
        }
      }
      return true;
    };

    // Helper function to mark cells as occupied
    const occupyArea = (row, col, width, height) => {
      for (let r = row; r < row + height; r++) {
        for (let c = col; c < col + width; c++) {
          grid[r][c] = true;
        }
      }
    };

    // Optimized position finding - faster search with step optimization
    const findPosition = (width, height) => {
      // Try center first
      const centerRow = Math.floor(GRID_ROWS / 2);
      const centerCol = Math.floor(GRID_COLS / 2);

      // Check center position first
      if (isAreaAvailable(centerRow, centerCol, width, height)) {
        return { row: centerRow, col: centerCol };
      }

      // Optimized spiral search with step size for performance
      const step = 2; // Check every 2nd position for speed
      const maxRadius = Math.max(GRID_ROWS, GRID_COLS);

      for (let radius = step; radius < maxRadius; radius += step) {
        const minRow = Math.max(0, centerRow - radius);
        const maxRow = Math.min(GRID_ROWS - height, centerRow + radius);
        const minCol = Math.max(0, centerCol - radius);
        const maxCol = Math.min(GRID_COLS - width, centerCol + radius);

        // Check perimeter positions first (more likely to find space)
        for (let row = minRow; row <= maxRow; row += step) {
          // Left and right edges
          if (isAreaAvailable(row, minCol, width, height)) {
            return { row, col: minCol };
          }
          if (isAreaAvailable(row, maxCol, width, height)) {
            return { row, col: maxCol };
          }
        }

        for (let col = minCol; col <= maxCol; col += step) {
          // Top and bottom edges
          if (isAreaAvailable(minRow, col, width, height)) {
            return { row: minRow, col };
          }
          if (isAreaAvailable(maxRow, col, width, height)) {
            return { row: maxRow, col };
          }
        }
      }

      // Fallback: linear search with step for remaining positions
      for (let row = 0; row <= GRID_ROWS - height; row += step) {
        for (let col = 0; col <= GRID_COLS - width; col += step) {
          if (isAreaAvailable(row, col, width, height)) {
            return { row, col };
          }
        }
      }

      // Last resort: check every position (slower but ensures placement)
      for (let row = 0; row <= GRID_ROWS - height; row++) {
        for (let col = 0; col <= GRID_COLS - width; col++) {
          if (isAreaAvailable(row, col, width, height)) {
            return { row, col };
          }
        }
      }

      return null;
    };

    // Calculate size based on count - use logarithmic scale to reduce size difference
    const calculateSize = (count) => {
      // Use logarithmic scale so smaller words are relatively larger
      // This makes the size difference less dramatic
      const logMin = Math.log(minCount + 1);
      const logMax = Math.log(maxCount + 1);
      const logCount = Math.log(count + 1);
      const normalized = (logCount - logMin) / (logMax - logMin);

      // Increased size range with smaller difference between min and max
      const minSize = 16;  // Increased minimum significantly
      const maxSize = 85;  // Increased maximum
      // Use square root to compress the range further - makes smaller words bigger
      const compressedNormalized = Math.sqrt(normalized);
      return minSize + (compressedNormalized * (maxSize - minSize));
    };

    // Calculate grid dimensions - prevent overlap with proper spacing
    const calculateGridDimensions = (fontSize, wordLength, isVertical) => {
      // Character dimensions: account for bold font (wider) and spacing
      // Bold text typically takes 0.85-0.9x of font size per character
      const charWidth = fontSize * 0.85;  // Increased from 0.7 for bold text
      const charHeight = fontSize * 1.1;  // Increased from 1.0 to account for line-height and bold

      if (isVertical) {
        // Vertical words (rotated 90deg): dimensions swap after rotation
        const originalTextWidth = wordLength * charWidth;
        const originalTextHeight = charHeight;

        // After 90deg rotation, dimensions swap
        const rotatedWidth = originalTextHeight;
        const rotatedHeight = originalTextWidth;

        // Convert to grid cells with adequate buffer to prevent overlap
        // Add 2 cells buffer to account for transform centering and rendering differences
        const width = Math.max(3, Math.ceil(rotatedWidth / CELL_WIDTH) + 2);
        const height = Math.max(3, Math.ceil(rotatedHeight / CELL_HEIGHT) + 2);

        return {
          width: Math.min(GRID_COLS, width),
          height: Math.min(GRID_ROWS, height)
        };
      } else {
        // Horizontal words:
        const textWidth = wordLength * charWidth;
        const textHeight = charHeight;

        // Convert to grid cells with adequate buffer to prevent overlap
        // Add 2 cells buffer to account for transform centering and rendering differences
        const width = Math.max(3, Math.ceil(textWidth / CELL_WIDTH) + 2);
        const height = Math.max(3, Math.ceil(textHeight / CELL_HEIGHT) + 2);

        return {
          width: Math.min(GRID_COLS, width),
          height: Math.min(GRID_ROWS, height)
        };
      }
    };

    const placedWords = [];
    // Limit to top 100 words by count
    const wordsToPlace = wordsArray.slice(0, 100);
    const totalWords = wordsToPlace.length;

    // Decide orientation - mixed distribution to avoid clustering
    // Use a pattern that ensures good mixing across the entire word cloud
    const shouldBeVertical = (index, fontSize) => {
      // Create a pattern that alternates but also has some variation
      // Pattern: H, V, V, H, H, V, V, H... creates better mixing
      const patternIndex = index % 6;
      // Pattern: [H, V, V, H, H, V] = 50% vertical, 50% horizontal
      const pattern = [false, true, true, false, false, true];
      return pattern[patternIndex];
    };

    // Place top 100 words with aggressive packing
    for (let i = 0; i < totalWords; i++) {
      const { word, count } = wordsToPlace[i];
      const fontSize = calculateSize(count);
      let isVertical = shouldBeVertical(i, fontSize);
      let { width, height } = calculateGridDimensions(fontSize, word.length, isVertical);

      let position = findPosition(width, height);
      let finalWidth = width;
      let finalHeight = height;
      let finalFontSize = fontSize;

      // If can't place, try reducing size progressively
      if (!position) {
        // Try with reduced dimensions - aggressive reduction for tight packing
        for (let reduction = 1; reduction <= 8 && !position; reduction++) {
          const reducedWidth = Math.max(3, width - reduction);
          const reducedHeight = Math.max(3, height - reduction);
          position = findPosition(reducedWidth, reducedHeight);
          if (position) {
            finalWidth = reducedWidth;
            finalHeight = reducedHeight;
            finalFontSize = Math.max(14, fontSize - (reduction * 2));
            break;
          }
        }
      }

      // If still can't place, try opposite orientation with size reduction
      if (!position) {
        const oppositeVertical = !isVertical;
        for (let reduction = 0; reduction <= 5 && !position; reduction++) {
          const testFontSize = Math.max(14, fontSize - (reduction * 2));
          const { width: altWidth, height: altHeight } = calculateGridDimensions(testFontSize, word.length, oppositeVertical);
          position = findPosition(altWidth, altHeight);
          if (position) {
            finalWidth = altWidth;
            finalHeight = altHeight;
            finalFontSize = testFontSize;
            isVertical = oppositeVertical; // Update orientation for final placement
            break; // Exit the reduction loop
          }
        }
      }

      // Last resort: minimal size with safe dimensions - ensure word is placed
      if (!position) {
        // Use minimum safe dimensions to ensure placement
        const minWidth = 3;
        const minHeight = 3;
        position = findPosition(minWidth, minHeight);
        if (position) {
          finalWidth = minWidth;
          finalHeight = minHeight;
          finalFontSize = 14;
        }
      }

      if (position) {
        const { row, col } = position;
        occupyArea(row, col, finalWidth, finalHeight);

        // Calculate pixel position - center within allocated grid area
        // Ensure position accounts for the transform origin (center)
        const x = (col + finalWidth / 2) * (100 / GRID_COLS);
        const y = (row + finalHeight / 2) * (100 / GRID_ROWS);
        const color = colors[i % colors.length];

        placedWords.push({
          word,
          count,
          fontSize: finalFontSize,
          x,
          y,
          color,
          isVertical
        });
      }
    }

    return placedWords;
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
                className="absolute transition-all duration-1000 cursor-pointer hover:scale-110"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  fontSize: `${item.fontSize}px`,
                  color: item.color,
                  fontWeight: 'bold',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? `translate(-50%, -50%) scale(1) ${item.isVertical ? 'rotate(90deg)' : 'rotate(0deg)'}`
                    : `translate(-50%, -50%) scale(0) ${item.isVertical ? 'rotate(90deg)' : 'rotate(0deg)'}`,
                  transitionDelay: `${index * 3}ms`,
                  transformOrigin: 'center',
                  textShadow: `0 0 6px ${item.color}40`,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  margin: 0,
                  padding: 0,
                  lineHeight: 0.9,
                  letterSpacing: '-0.5px',
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
