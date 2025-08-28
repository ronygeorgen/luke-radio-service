import React from "react";
import { Play, Pause } from "lucide-react"; // Import icons

const CompactSegment = ({ segment, currentPlayingId, isPlaying, handlePlayPauseAudio }) => {
  return (
    <div className="p-4">
     <h2 className="text-lg font-bold text-gray-900 flex items-center">
        {segment.title ? (
          segment.title
        ) : (
          `${segment.title_before ? "Audio Before: " + segment.title_before : ""}${
            segment.title_before && segment.title_after ? " - " : ""
          }${segment.title_after ? "Audio After: " + segment.title_after : ""}`.trim() || 
          "Untitled Report Item"
        )}
      </h2>


      <div className="flex items-center justify-between mt-4">
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
            <span className="text-xs font-medium text-gray-500">Start Time</span>
            <span className="text-sm text-gray-900">
              {new Date(segment.start_time).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(segment.start_time).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500">End Time</span>
            <span className="text-sm text-gray-900">
              {new Date(segment.end_time).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(segment.end_time).toLocaleTimeString()}
            </span>
          </div>


          <div className="text-sm text-gray-700">{segment.duration_seconds}s</div>
        </div>

        <div className="text-sm text-gray-400 italic">No content available</div>
      </div>
    </div>
  );
};

export default CompactSegment;
