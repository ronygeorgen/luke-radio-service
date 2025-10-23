// components/UserSide/CompactSegment.jsx
import React from "react";
import { Play, Pause } from "lucide-react";
import TranscribeButton from "./TranscribeButton";
import dayjs from "dayjs";

const CompactSegment = ({ segment, currentPlayingId, isPlaying, handlePlayPauseAudio, handleTrimClick, handleCompactEditClick }) => {
  const isMusicSegment = segment.metadata_json?.source === 'music';
  const artistNames = isMusicSegment 
    ? segment.metadata_json.artists?.map(artist => artist.name).join(', ') 
    : null;


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

    return `${formatted} (${offset})`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateTimeString;
  }
}



  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
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

  <div className="flex space-x-2">
    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
      {segment.duration_seconds}s
    </span>
    {isMusicSegment && (
      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
        Music
      </span>
    )}
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

          <div className="text-xs text-gray-700">{segment.duration_seconds}s</div>
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