import React from "react";
import { Play, Pause } from "lucide-react"; // Import icons

const CompactSegment = ({ segment, currentPlayingId, isPlaying, handlePlayPauseAudio }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center">
        {segment.title || "Untitled Report Item"}
      </h2>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handlePlayPauseAudio(segment.id)}
            className={`${
              currentPlayingId === segment.id && isPlaying
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white p-2 rounded-full flex items-center justify-center`}
          >
            {currentPlayingId === segment.id && isPlaying ? (
              <Pause className="w-5 h-5" /> // Pause Icon
            ) : (
              <Play className="w-5 h-5" /> // Play Icon
            )}
          </button>

          <div className="flex flex-col">
            <span className="text-sm text-gray-900">
              {new Date(segment.start_time).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(segment.start_time).toLocaleTimeString()}
            </span>
          </div>

          <div className="text-sm text-gray-700">{segment.duration_seconds}s</div>

          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-1">Sentiment:</span>
            {segment.analysis?.sentiment ? (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  segment.analysis.sentiment >= 70
                    ? "bg-green-100 text-green-800"
                    : segment.analysis.sentiment >= 40
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {segment.analysis.sentiment >= 70
                  ? "Positive"
                  : segment.analysis.sentiment >= 40
                  ? "Neutral"
                  : "Negative"}
              </span>
            ) : (
              <span className="text-xs text-gray-500">N/A</span>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-400 italic">No content available</div>
      </div>
    </div>
  );
};

export default CompactSegment;
