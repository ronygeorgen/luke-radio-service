import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, RotateCcw, Loader, Calendar, RefreshCw, Radio, Trash2 } from 'lucide-react';
import { axiosInstance } from '../../services/api';
import { fetchUserChannels, selectUserChannels } from '../../store/slices/channelSlice';
import { setCurrentPlaying, setIsPlaying } from '../../store/slices/audioSegmentsSlice';
import { getUTCDateTimeRange, convertLocalToUTC } from '../../utils/dateTimeUtils';
import { formatSlotDateForApi } from '../../utils/audioSegmentsApiHelpers';
import SimpleChannelSelectionModal from './SimpleChannelSelectionModal';
import SegmentCard from '../../components/UserSide/SegmentCard';
import SegmentShimmer from '../../components/UserSide/SegmentShimmer';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';
import AudioPlayer from './AudioPlayer';
import Toast from '../../components/UserSide/Toast';

const toDatetimeLocalValue = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** "Now" as a datetime-local value (YYYY-MM-DDTHH:mm), expressed as wall-clock time in the given timezone. */
const nowDatetimeLocalInTimezone = (timezone) => {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`;
};

/** Pull a "YYYY-MM-DD HH-MM-SS" (or similar) stamp out of a filename embedded in a URL, e.g.
 *  ".../89.9TheLight%20%5BFM%5D%202026-07-23%2000-00-00.mp3?..." -> "2026-07-23T00:00". */
const extractRecordedAtFromUrl = (url) => {
  if (!url) return null;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch (e) {
    // Malformed percent-encoding - fall back to the raw string
  }
  const match = decoded.match(/(\d{4}-\d{2}-\d{2})[\s_](\d{2})[-:](\d{2})[-:](\d{2})/);
  if (!match) return null;
  const [, date, hh, mm] = match;
  return `${date}T${hh}:${mm}`;
};

const todayLocalDateString = () => new Date().toLocaleDateString('en-CA');

// Recovery uploads always target this channel, independent of the active channel used for browsing.
const RECOVERY_CHANNEL_ID = 1;

const AudioRecoveryPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userChannels = useSelector(selectUserChannels);
  const { currentPlayingId, isPlaying } = useSelector((state) => state.audioSegments);

  const [channelId, setChannelId] = useState(localStorage.getItem('channelId') || '');
  const [channelName, setChannelName] = useState(localStorage.getItem('channelName') || '');
  const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);

  const [recoveryForm, setRecoveryForm] = useState({
    url: '',
    recordedAt: toDatetimeLocalValue(new Date()),
  });
  const [hasEditedRecordedAt, setHasEditedRecordedAt] = useState(false);
  const [recoveryErrors, setRecoveryErrors] = useState({});
  const [isRecovering, setIsRecovering] = useState(false);
  const [toast, setToast] = useState(null);

  const [dateStr, setDateStr] = useState(todayLocalDateString());
  const [slotIndex, setSlotIndex] = useState(0);
  const [segments, setSegments] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState(null);

  const [deleteForm, setDeleteForm] = useState({ id: '', reason: '' });
  const [deleteErrors, setDeleteErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const [playingSegmentSnapshot, setPlayingSegmentSnapshot] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);

  useEffect(() => {
    dispatch(fetchUserChannels());
  }, [dispatch]);

  const recoveryChannel = userChannels.find((c) => String(c.id) === String(RECOVERY_CHANNEL_ID));
  const recoveryChannelName = recoveryChannel?.name || '';
  const recoveryChannelTimezone = recoveryChannel?.timezone || 'UTC';

  // Default "Recorded At" to now in the recovery channel's own timezone, once it's known -
  // but only if the user hasn't already typed their own value.
  useEffect(() => {
    if (recoveryChannel && !hasEditedRecordedAt) {
      setRecoveryForm((prev) => ({ ...prev, recordedAt: nowDatetimeLocalInTimezone(recoveryChannelTimezone) }));
    }
  }, [recoveryChannel, recoveryChannelTimezone, hasEditedRecordedAt]);

  const openChannelSelection = () => {
    dispatch(fetchUserChannels());
    setIsChannelSelectionOpen(true);
  };

  const handleChannelSelect = (channel) => {
    try {
      if (channel?.id) {
        localStorage.setItem('channelId', String(channel.id));
        setChannelId(String(channel.id));
      }
      if (channel?.name) {
        localStorage.setItem('channelName', channel.name);
        setChannelName(channel.name);
      }
      if (channel?.timezone) {
        localStorage.setItem('channelTimezone', channel.timezone);
      }
    } catch (e) {
      // localStorage may be unavailable, ignore
    }
    setIsChannelSelectionOpen(false);
  };

  const fetchSegmentsForDate = useCallback(async (targetDate) => {
    if (!channelId || !targetDate) {
      setSegments([]);
      return;
    }
    setSegmentsLoading(true);
    setSegmentsError(null);
    try {
      const { startDatetime, endDatetime } = getUTCDateTimeRange(targetDate, '00:00:00', '23:59:59');
      const response = await axiosInstance.get('/audio/filter/v3/audio-segments/', {
        params: {
          channel_id: channelId,
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          slot_date: formatSlotDateForApi(targetDate),
          slot_index: slotIndex,
        },
      });
      setSegments(response.data?.data || []);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load audio segments for this date.';
      setSegmentsError(message);
      setSegments([]);
    } finally {
      setSegmentsLoading(false);
    }
  }, [channelId, slotIndex]);

  useEffect(() => {
    fetchSegmentsForDate(dateStr);
  }, [dateStr, fetchSegmentsForDate]);

  useEffect(() => {
    if (!currentPlayingId) {
      setPlayingSegmentSnapshot(null);
      return;
    }
    const found = segments.find((s) => String(s.id) === String(currentPlayingId));
    if (found) setPlayingSegmentSnapshot(found);
  }, [segments, currentPlayingId]);

  const handleRecoveryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'url') {
      const extractedRecordedAt = extractRecordedAtFromUrl(value);
      setRecoveryForm((prev) => ({
        ...prev,
        url: value,
        ...(extractedRecordedAt ? { recordedAt: extractedRecordedAt } : {}),
      }));
      if (extractedRecordedAt) {
        setHasEditedRecordedAt(true);
        const [extractedDate, extractedTime] = extractedRecordedAt.split('T');
        setDateStr(extractedDate);
        setSlotIndex(parseInt(extractedTime.split(':')[0], 10));
      }
    } else {
      setRecoveryForm((prev) => ({ ...prev, [name]: value }));
      if (name === 'recordedAt') setHasEditedRecordedAt(true);
    }
    if (recoveryErrors[name]) {
      setRecoveryErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateRecoveryForm = () => {
    const errors = {};
    if (!recoveryForm.url.trim()) errors.url = 'Audio URL is required';
    setRecoveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!validateRecoveryForm()) return;

    setIsRecovering(true);
    try {
      const [recordedDate, recordedTime] = recoveryForm.recordedAt
        ? recoveryForm.recordedAt.split('T')
        : [];
      const payload = {
        url: recoveryForm.url.trim(),
        channel_id: RECOVERY_CHANNEL_ID,
        recorded_at: recordedDate
          ? convertLocalToUTC(recordedDate, recordedTime, recoveryChannelTimezone)
          : new Date().toISOString(),
      };

      await axiosInstance.post('/audio-recovery/recover/', payload);

      setToast({ type: 'success', message: 'Audio recovery started successfully.' });
      setRecoveryForm((prev) => ({ ...prev, url: '' }));
      fetchSegmentsForDate(dateStr);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to recover audio. Please try again.';
      setToast({ type: 'error', message });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDeleteChange = (e) => {
    const { name, value } = e.target;
    setDeleteForm((prev) => ({ ...prev, [name]: value }));
    if (deleteErrors[name]) {
      setDeleteErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    const idTrimmed = deleteForm.id.trim();
    const reasonTrimmed = deleteForm.reason.trim();
    const errors = {};
    if (!idTrimmed) errors.id = 'Segment ID is required';
    else if (!/^\d+$/.test(idTrimmed)) errors.id = 'Segment ID must be a number';
    if (!reasonTrimmed) errors.reason = 'A reason is required';
    setDeleteErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const confirmed = window.confirm(`Delete audio segment ${idTrimmed}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/v2/audio-segments/${idTrimmed}/delete/`, {
        data: { reason: reasonTrimmed },
      });
      setToast({ type: 'success', message: `Segment ${idTrimmed} deleted.` });
      setSegments((prev) => prev.filter((s) => String(s.id) !== idTrimmed));
      setDeleteForm((prev) => ({ ...prev, id: '' }));
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to delete audio segment.';
      setToast({ type: 'error', message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePlayPauseAudio = (segmentId) => {
    if (currentPlayingId === segmentId) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentPlaying(segmentId));
      dispatch(setIsPlaying(true));
    }
  };

  const handleSummaryClick = (segment) => {
    setSelectedSegment(segment);
    setShowSummaryModal(true);
  };

  const handleTranscriptionClick = (segment) => {
    setSelectedSegment(segment);
    setShowTranscriptionModal(true);
  };

  const handleEditRedirect = () => {
    if (!channelId) return;
    const apiDate = dateStr.replace(/-/g, '');
    navigate(`/channels/${channelId}/segments?date=${apiDate}&hour=0&name=${encodeURIComponent(channelName || '')}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">Audio Recovery</h1>
              <p className="text-xs text-gray-500 truncate">
                {channelName ? `Channel: ${channelName}` : 'No channel selected'}
              </p>
            </div>
          </div>
          <button
            onClick={openChannelSelection}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Radio className="w-4 h-4 text-gray-500" />
            <span>{channelName ? 'Change Channel' : 'Select Channel'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Delete Audio Segment - compact */}
        <section className="bg-white rounded-xl shadow-md p-4 border border-red-100">
          <form onSubmit={handleDeleteSubmit} className="flex flex-wrap items-start gap-3">
            <div className="flex items-center space-x-2 text-red-600 shrink-0 pt-2.5">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-semibold whitespace-nowrap">Delete Segment</span>
            </div>
            <div className="w-28">
              <input
                type="text"
                name="id"
                value={deleteForm.id}
                onChange={handleDeleteChange}
                placeholder="Segment ID"
                className={`w-full px-3 py-2 border ${deleteErrors.id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm`}
                disabled={isDeleting}
              />
              {deleteErrors.id && <p className="mt-1 text-xs text-red-500">{deleteErrors.id}</p>}
            </div>
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                name="reason"
                value={deleteForm.reason}
                onChange={handleDeleteChange}
                placeholder="Reason (required)"
                className={`w-full px-3 py-2 border ${deleteErrors.reason ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm`}
                disabled={isDeleting}
              />
              {deleteErrors.reason && <p className="mt-1 text-xs text-red-500">{deleteErrors.reason}</p>}
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete</span>
            </button>
          </form>
        </section>

        {/* Recovery Upload Form */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <RotateCcw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recover Audio from URL</h2>
              <p className="text-sm text-gray-500">
                Pull a recording in from a direct link (e.g. Dropbox) into {recoveryChannelName ? `"${recoveryChannelName}"` : `channel ${RECOVERY_CHANNEL_ID}`}.
              </p>
            </div>
          </div>

          <form onSubmit={handleRecoverySubmit} className="space-y-5">
            <div>
              <label htmlFor="recoveryChannelId" className="block text-sm font-semibold text-gray-700 mb-2">
                Channel
              </label>
              <input
                type="text"
                id="recoveryChannelId"
                value={
                  recoveryChannelName
                    ? `${recoveryChannelName} (ID: ${RECOVERY_CHANNEL_ID}) — ${recoveryChannelTimezone}`
                    : `Channel ${RECOVERY_CHANNEL_ID} — ${recoveryChannelTimezone}`
                }
                disabled
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
                Audio URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={recoveryForm.url}
                onChange={handleRecoveryChange}
                placeholder="https://www.dropbox.com/s/xxxxx/recording.mp3?dl=1"
                className={`w-full px-4 py-2.5 border ${recoveryErrors.url ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                disabled={isRecovering}
              />
              {recoveryErrors.url && <p className="mt-1 text-sm text-red-500">{recoveryErrors.url}</p>}
              <p className="mt-1 text-xs text-gray-500">
                If the filename contains a date/time (e.g. "2026-07-23 00-00-00"), Recorded At is filled in automatically.
              </p>
            </div>

            <div>
              <label htmlFor="recordedAt" className="block text-sm font-semibold text-gray-700 mb-2">
                Recorded At <span className="text-gray-400 text-xs font-normal">({recoveryChannelTimezone})</span>
              </label>
              <input
                type="datetime-local"
                id="recordedAt"
                name="recordedAt"
                value={recoveryForm.recordedAt}
                onChange={handleRecoveryChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isRecovering}
              />
              <p className="mt-1 text-xs text-gray-500">Defaults to now if left unchanged.</p>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRecovering}
              >
                {isRecovering ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Recovering...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Recover Audio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Segment Browser */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Browse Segments by Date</h2>
                <p className="text-sm text-gray-500">Select a date to view audio segments recovered for this channel.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              <select
                value={slotIndex}
                onChange={(e) => setSlotIndex(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                aria-label="Slot Index"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    Slot {i}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchSegmentsForDate(dateStr)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Refresh"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${segmentsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {!channelId ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Select a channel to view its audio segments.
            </div>
          ) : segmentsError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {segmentsError}
            </div>
          ) : (
            <div className={currentPlayingId ? 'pb-40' : ''}>
              {segmentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SegmentShimmer key={`shimmer-${i}`} />
                  ))}
                </div>
              ) : segments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No audio segments found for this date.
                </div>
              ) : (
                <div className="space-y-4">
                  {segments.map((segment) => (
                    <SegmentCard
                      key={segment.id}
                      segment={segment}
                      currentPlayingId={currentPlayingId}
                      isPlaying={isPlaying}
                      handlePlayPauseAudio={handlePlayPauseAudio}
                      handleSummaryClick={handleSummaryClick}
                      handleTranscriptionClick={handleTranscriptionClick}
                      handleTrimClick={handleEditRedirect}
                      handleCompactEditClick={handleEditRedirect}
                      isMergeMode={false}
                      isSelected={false}
                      onSelect={() => {}}
                      isStatusToggleMode={false}
                      isStatusSelected={false}
                      onStatusSelect={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
          {playingSegmentSnapshot ? (
            <AudioPlayer
              key={playingSegmentSnapshot.id}
              segment={playingSegmentSnapshot}
              onClose={() => {
                dispatch(setIsPlaying(false));
                dispatch(setCurrentPlaying(null));
              }}
            />
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-500">Audio segment no longer available</p>
              <button
                onClick={() => {
                  dispatch(setIsPlaying(false));
                  dispatch(setCurrentPlaying(null));
                }}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close Player
              </button>
            </div>
          )}
        </div>
      )}

      {showSummaryModal && selectedSegment && (
        <SummaryModal
          summary={selectedSegment.analysis?.summary}
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      {showTranscriptionModal && selectedSegment && (
        <TranscriptionModal
          transcription={selectedSegment.transcription?.transcript}
          onClose={() => setShowTranscriptionModal(false)}
        />
      )}

      <SimpleChannelSelectionModal
        isOpen={isChannelSelectionOpen}
        onClose={() => setIsChannelSelectionOpen(false)}
        onChannelSelect={handleChannelSelect}
        channels={userChannels}
        title="Select a Channel"
        description="Choose which channel to recover audio into"
      />
    </div>
  );
};

export default AudioRecoveryPage;
