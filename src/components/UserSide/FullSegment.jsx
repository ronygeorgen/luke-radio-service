// components/UserSide/FullSegment.jsx
import React, { useState } from 'react';
import { Info, Server, User, GitMerge, Play, Pause, Scissors, FilePlus } from 'lucide-react';
import { SelectReportModal, CreateReportModal } from '../../pages/user/ReportModals';
import dayjs from "dayjs";
import FlagIcon from './FlagIcon';

const FullSegment = ({ 
  segment, 
  currentPlayingId, 
  isPlaying, 
  handlePlayPauseAudio, 
  handleSummaryClick, 
  handleTranscriptionClick,
  handleTrimClick,
  isMergeMode,
  isSelected,
  onSelect,
  isStatusToggleMode,
  isStatusSelected,
  onStatusSelect
}) => {
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check if this is a music segment and extract artist names
  const isMusicSegment = segment.metadata_json?.source === 'music';
  const artistNames = isMusicSegment 
    ? segment.metadata_json.artists?.map(artist => artist.name).join(', ') 
    : null;

  // Check if segment has content for showing "Add to Report" button
  const hasContent = segment.analysis?.summary || segment.transcription?.transcript;

  const generalTopics = segment.analysis?.general_topics
    ? segment.analysis.general_topics
        .split('\n')
        .map(topic => topic.trim())
        .filter(Boolean)
        .join(', ')
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

  const handleAddToReport = () => {
    setShowSelectModal(true);
  };

  const handleCreateNewReport = () => {
    setShowSelectModal(false);
    setShowCreateModal(true);
  };

  const handleBackToSelect = () => {
    setShowCreateModal(false);
    setShowSelectModal(true);
  };

  const closeModals = () => {
    setShowSelectModal(false);
    setShowCreateModal(false);
  };


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
    <div className={`p-6 ${(isMergeMode && isSelected) || (isStatusToggleMode && isStatusSelected) ? 'bg-blue-50 border-2 border-blue-500' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          {isMergeMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
          )}
          {isStatusToggleMode && (
            <input
              type="checkbox"
              checked={isStatusSelected}
              onChange={onStatusSelect}
              className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
            />
          )}
          <div>
            <h1 className="text-xs font-bold text-blue-700 mb-1">
              Id: {segment.id}
            </h1>
            <h2 className="text-lg font-bold flex items-center">
              {segment.title ? (
                <span className="text-gray-900">{segment.title}</span>
              ) : (
                <span>
                  {segment.title_before && (
                    <>
                      <span className="text-gray-900">Audio Before: </span>
                      <span className="text-gray-500">{segment.title_before}</span>
                    </>
                  )}
                  {segment.title_before && segment.title_after && (
                    <span className="text-gray-900"> - </span>
                  )}
                  {segment.title_after && (
                    <>
                      <span className="text-gray-900">Audio After: </span>
                      <span className="text-gray-500">{segment.title_after}</span>
                    </>
                  )}
                  {!segment.title_before && !segment.title_after && (
                    <span className="text-gray-900">Untitled Report Item</span>
                  )}
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex space-x-2 items-center">
          <span
            className={`text-xs px-2 py-1 rounded ${segment?.flag?.duration?.flagged ? 'text-gray-900' : 'bg-blue-100 text-blue-800'}`}
            title={segment?.flag?.duration?.flagged ? segment?.flag?.duration?.message : ''}
            style={segment?.flag?.duration?.flagged ? {
              backgroundImage: 'linear-gradient(transparent 55%, rgba(250, 204, 21, 0.75) 0)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 100%'
            } : undefined}
          >
            {segment.duration_seconds}s
            {segment?.flag?.duration?.flagged && (
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Details */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
            Details
          </h3>
          
          {/* Artist information for music segments */}
          {isMusicSegment && artistNames && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Artist
              </label>
              <p className="text-sm text-gray-900 font-medium">{artistNames}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Date
            </label>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Start:</span>{" "}
                {formatDateTime(segment.start_time)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">End:</span>{" "}
                {formatDateTime(segment.end_time)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Duration</label>
            <p className="text-gray-900 text-sm flex items-center">
              <span
                className={segment?.flag?.duration?.flagged ? 'font-semibold' : ''}
                style={segment?.flag?.duration?.flagged ? {
                  backgroundImage: 'linear-gradient(transparent 55%, rgba(250, 204, 21, 0.75) 0)',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100% 100%'
                } : undefined}
              >
                {segment.duration_seconds} seconds
              </span>
              {segment?.flag?.duration?.flagged && (
                <span className="inline-flex items-center ml-2" title={segment?.flag?.duration?.message}>
                  <Info className="w-4 h-4 text-yellow-600" />
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Sentiment</label>
            <div className="flex items-center">
              <span className="text-gray-900 text-sm mr-2">{segment.analysis?.sentiment || 'N/A'}</span>
              {segment.analysis?.sentiment && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                  {segment.analysis.sentiment >= 70 ? 'Positive' : 
                    segment.analysis.sentiment >= 40 ? 'Neutral' : 'Negative'}
                </span>
              )}
              {segment.flag?.sentiment?.flagged && (
                <FlagIcon 
                  message={segment.flag.sentiment.message} 
                  className="ml-2"
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handlePlayPauseAudio(segment.id)}
              className={`p-2 rounded-md text-white transition-colors ${
                currentPlayingId === segment.id && isPlaying
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title={currentPlayingId === segment.id && isPlaying ? 'Pause Audio' : 'Play Audio'}
              aria-label={currentPlayingId === segment.id && isPlaying ? 'Pause Audio' : 'Play Audio'}
            >
              {currentPlayingId === segment.id && isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

              <button
              type="button"
                onClick={() => handleTrimClick(segment)}
              className="p-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              title="Edit Audio"
              aria-label="Edit Audio"
              >
              <Scissors className="w-5 h-5" />
              </button>
            
            {hasContent && (
              <button
                type="button"
                onClick={handleAddToReport}
                className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="Add to Report"
                aria-label="Add to Report"
              >
                <FilePlus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Rest of the component remains the same */}
        {/* Middle column - Content */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
            Content
          </h3>
          
          {segment.analysis?.summary && segment.analysis.summary !== "Empty" && (
            <div className="cursor-pointer" onClick={() => handleSummaryClick(segment)}>
              <h4 className="font-bold text-gray-900 text-sm">Summary</h4>
              <p className="text-gray-700 text-sm line-clamp-3">{segment.analysis.summary}</p>
            </div>
          )}

          {segment.transcription?.transcript && segment.transcription.transcript !== "Empty" && (
            <div className="cursor-pointer" onClick={() => handleTranscriptionClick(segment)}>
              <h4 className="font-bold text-gray-900 text-sm flex items-center">
                Transcription
                {segment.flag?.transcription_keywords?.flagged && (
                  <FlagIcon 
                    message={segment.flag.transcription_keywords.message} 
                    className="ml-2"
                  />
                )}
              </h4>
              <div className="text-gray-700 text-sm line-clamp-3">
                {segment.transcription.transcript.split('\n').slice(0, 3).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Metadata */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
            Metadata
          </h3>
          
          {/* Additional music metadata for music segments */}
          {isMusicSegment && segment.metadata_json && (
            <div className="space-y-3">
              {segment.metadata_json.external_ids?.isrc && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">ISRC</label>
                  <p className="text-sm text-gray-700">{segment.metadata_json.external_ids.isrc[0]}</p>
                </div>
              )}
              
              {segment.metadata_json.external_ids?.upc && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">UPC</label>
                  <p className="text-sm text-gray-700">{segment.metadata_json.external_ids.upc[0]}</p>
                </div>
              )}
            </div>
          )}
          
          {segment.analysis && (
            <>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    General Topics
                    {segment.flag?.general_topics?.flagged && (
                      <FlagIcon 
                        message={segment.flag.general_topics.message} 
                        className="ml-2"
                      />
                    )}
                  </label>
                  <div className="mt-1 bg-gray-50 p-2 rounded">
                    <div className="text-sm text-gray-700">
                      {generalTopics || 'N/A'}
                    </div>
                  </div>
                </div>

                {segment.analysis?.content_type_prompt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Content Type</label>
                    <div className="mt-1 bg-gray-50 p-2 rounded">
                      <div className="text-sm text-gray-700">
                        {segment.analysis.content_type_prompt}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500">Bucket Prompt</label>
                  <div className="mt-1 bg-gray-50 p-2 rounded">
                    <div className="text-sm text-gray-700">
                      {segment.analysis.bucket_prompt !== 'Undefined, N/A' 
                        ? segment.analysis.bucket_prompt 
                        : 'Not categorized'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 flex items-center">
                  IAB Topics
                  {segment.flag?.iab_topics?.flagged && (
                    <FlagIcon 
                      message={segment.flag.iab_topics.message} 
                      className="ml-2"
                    />
                  )}
                </label>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                  {segment.analysis?.iab_topics}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Report Modals */}
      <SelectReportModal
        isOpen={showSelectModal}
        onClose={closeModals}
        segmentId={segment.id}
        onCreateNew={handleCreateNewReport}
      />
      
      <CreateReportModal
        isOpen={showCreateModal}
        onClose={closeModals}
        onBack={handleBackToSelect}
        segmentId={segment.id}
      />
    </div>
  );
};

export default FullSegment;