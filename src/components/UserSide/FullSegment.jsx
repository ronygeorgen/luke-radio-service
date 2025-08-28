import React from 'react';

const FullSegment = ({ 
  segment, 
  currentPlayingId, 
  isPlaying, 
  handlePlayPauseAudio, 
  handleSummaryClick, 
  handleTranscriptionClick 
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
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
        <div className="flex space-x-2">
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
            {segment.duration_seconds}s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Details */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
            Details
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Date
            </label>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Start:</span>{" "}
                {new Date(segment.start_time).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">End:</span>{" "}
                {new Date(segment.end_time).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Duration</label>
            <p className="text-gray-900 text-sm">{segment.duration_seconds} seconds</p>
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
            </div>
          </div>
          <button
            onClick={() => handlePlayPauseAudio(segment.id)}
            className={`w-full ${
              currentPlayingId === segment.id && isPlaying 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white py-2 px-4 rounded-md flex items-center justify-center text-sm`}
          >
            {currentPlayingId === segment.id && isPlaying ? 'Pause Audio' : 'Play Audio'}
          </button>
        </div>

        {/* Middle column - Content */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
            Content
          </h3>
          
          {segment.analysis?.summary && (
            <div className="cursor-pointer" onClick={() => handleSummaryClick(segment)}>
              <h4 className="font-bold text-gray-900 text-sm">Summary</h4>
              <p className="text-gray-700 text-sm line-clamp-3">{segment.analysis.summary}</p>
            </div>
          )}
          
          {segment.transcription?.transcript && (
            <div className="cursor-pointer" onClick={() => handleTranscriptionClick(segment)}>
              <h4 className="font-bold text-gray-900 text-sm">Transcription</h4>
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
          <h3 className="font-bold text-center text-white bg-gradient-to-r from-purple-500 to-purple-600 py-2 px-4 rounded-md mb-4">
            Metadata
          </h3>
          
          {/* <div>
            <label className="block text-sm font-medium text-gray-500">Topics</label>
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
              {segment.analysis?.bucket_prompt?.split('\n').length || 0} topics
            </span>
          </div> */}
          
          {segment.analysis && (
            <>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">General Topics</label>
                  <div className="mt-1 bg-gray-50 p-2 rounded">
                    {segment.analysis.general_topics.split('\n').map((topic, index) => (
                      <div key={index} className="text-sm text-gray-700">{topic}</div>
                    ))}
                  </div>
                </div>

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
                <label className="block text-sm font-medium text-gray-500">IAB Topics</label>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                  {segment.analysis?.iab_topics}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullSegment;