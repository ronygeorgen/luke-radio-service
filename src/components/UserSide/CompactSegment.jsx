// components/UserSide/CompactSegment.jsx
import React from "react";
import { Play, Pause, Info, Server, User, GitMerge } from "lucide-react";
import TranscribeButton from "./TranscribeButton";
import dayjs from "dayjs";

const CompactSegment = ({ 
  segment, 
  currentPlayingId, 
  isPlaying, 
  handlePlayPauseAudio, 
  handleTrimClick, 
  handleCompactEditClick,
  isMergeMode,
  isSelected,
  onSelect
}) => {
  const isMusicSegment = segment.metadata_json?.source === 'music';
  const artistNames = isMusicSegment 
    ? segment.metadata_json.artists?.map(artist => artist.name).join(', ') 
    : null;

  // Get source icon and tooltip
  const getSourceIcon = (source) => {
    if (!source) return null;
    
    const sourceConfig = {
      system: { Icon: Server, color: 'text-blue-600', tooltip: 'System' },
      user: { Icon: User, color: 'text-green-600', tooltip: 'User' },
      merged: { Icon: GitMerge, color: 'text-purple-600', tooltip: 'Merged' }
    };
    
    return sourceConfig[source.toLowerCase()] || null;
  };

  const sourceConfig = getSourceIcon(segment.source);


function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "N/A";

  try {
    // Split into date and time parts
    const [datePart, timePartWithOffset] = dateTimeString.split("T");
    const [timePart] = timePartWithOffset.split(/[+-]/);
    const offsetMatch = dateTimeString.match(/([+-]\d{2}:\d{2})$/);
    const offset = offsetMatch ? `UTC${offsetMatch[1]}` : "UTC";

    // Extract date components
    const [year, month, day] = datePart.split("-").map(Number);

    // Extract time components
    const [hour, minute, second] = timePart.split(":").map(Number);

    // Format month and 12-hour time
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";

    // Construct readable string
    const formatted = `${day.toString().padStart(2, "0")} ${months[month - 1]} ${year}, ` +
                      `${hour12.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")} ${ampm}`;

    return `${formatted}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateTimeString;
  }
}



  return (
    <div className={`p-4 ${isMergeMode && isSelected ? 'bg-blue-50 border-2 border-blue-500' : ''}`}>
      <div className="flex items-center justify-between mb-2">
  <div className="flex items-center space-x-3">
    {isMergeMode && (
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
    )}
    <div>
      {/* Segment ID as top heading */}
      <h1 className="text-md font-bold text-blue-700 mb-1">
        Segment ID: {segment.id}
      </h1>

      {/* Existing title */}
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
    </div>
  </div>

  <div className="flex space-x-2 items-center">
    <span
      className={`text-xs px-2 py-1 rounded ${segment?.flag?.duration?.exceeded ? 'text-gray-900' : 'bg-blue-100 text-blue-800'}`}
      title={segment?.flag?.duration?.exceeded ? segment?.flag?.duration?.message : ''}
      style={segment?.flag?.duration?.exceeded ? {
        backgroundImage: 'linear-gradient(transparent 55%, rgba(250, 204, 21, 0.75) 0)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%'
      } : undefined}
    >
      {segment.duration_seconds}s
      {segment?.flag?.duration?.exceeded && (
        <span className="inline-flex items-center ml-1 align-middle">
          <Info className="w-3 h-3 text-yellow-600" />
        </span>
      )}
    </span>
    {isMusicSegment && (
      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
        Music
      </span>
    )}
    {sourceConfig && (() => {
      const IconComponent = sourceConfig.Icon;
      return (
        <div className="relative group">
          <IconComponent 
            className={`w-5 h-5 ${sourceConfig.color} cursor-help`}
            title={sourceConfig.tooltip}
          />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {sourceConfig.tooltip}
          </div>
        </div>
      );
    })()}
  </div>
</div>


      {isMusicSegment && artistNames && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">Artist: </span>
          <span className="text-sm text-gray-900">{artistNames}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handlePlayPauseAudio(segment.id)}
            className={`${
              currentPlayingId === segment.id && isPlaying
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white p-1.5 rounded-full flex items-center justify-center`}
          >
            {currentPlayingId === segment.id && isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500">Start Time</span>
            <span className="text-sm text-gray-900">
              {formatDateTime(segment.start_time)}
            </span>
            {/* <span className="text-xs text-gray-500">
              {new Date(segment.start_time).toUTCString()} 
            </span> */}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500">End Time</span>
            <span className="text-sm text-gray-900">
              {formatDateTime(segment.end_time)}
            </span>
            {/* <span className="text-xs text-gray-500">
              {new Date(segment.end_time).toUTCString()} 
            </span> */}
          </div>

          <div className="text-xs text-gray-700 flex items-center">
            <span
              className={segment?.flag?.duration?.exceeded ? 'font-semibold' : ''}
              style={segment?.flag?.duration?.exceeded ? {
                backgroundImage: 'linear-gradient(transparent 55%, rgba(250, 204, 21, 0.75) 0)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 100%'
              } : undefined}
            >
              {segment.duration_seconds}s
            </span>
            {segment?.flag?.duration?.exceeded && (
              <span className="inline-flex items-center ml-1" title={segment?.flag?.duration?.message}>
                <Info className="w-3 h-3 text-yellow-600" />
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <TranscribeButton 
            segmentId={segment.id}
            className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          />
          <button
            onClick={() => handleCompactEditClick(segment) }
            className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-purple-600 hover:bg-purple-700 text-white"
          >
            Edit
          </button>
        </div>
      </div>

      {/* actions moved inline above for compact layout */}
    </div>
  );
};

export default CompactSegment;