import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronsRight,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Pencil,
  Radio,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import CommonHeader from '../../components/DashboardUserSide/CommonHeader';
import ChannelSwitcher from '../../components/ChannelSwitcher';
import TranscriptionModal from './TranscriptionModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { axiosInstance } from '../../services/api';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';

const formatDateTime = (value) => {
  if (!value) return 'Unknown time';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const getTranscriptText = (segment) => {
  return (typeof segment?.transcription === 'string'
    ? segment.transcription
    : segment?.transcription?.transcript) || '';
};

const todayISO = () => new Date().toISOString().split('T')[0];

const defaultStartISO = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
};

const TranscriptComparePage = () => {
  const navigate = useNavigate();
  const { channelId: channelIdFromParams } = useParams();
  const storedChannelId = localStorage.getItem('channelId');
  const channelId = storedChannelId && storedChannelId !== channelIdFromParams
    ? storedChannelId
    : (channelIdFromParams || storedChannelId);

  const [segments, setSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [segmentsError, setSegmentsError] = useState('');
  const [segmentsMeta, setSegmentsMeta] = useState({ count: 0, totalCount: 0 });
  const [segmentIdSearch, setSegmentIdSearch] = useState('');
  const [titleNameSearch, setTitleNameSearch] = useState('');
  const [startDate, setStartDate] = useState(defaultStartISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [transcribedOnly, setTranscribedOnly] = useState(true);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState(new Set());

  const [activeStep, setActiveStep] = useState(1);
  const [selectedPromptIds, setSelectedPromptIds] = useState(new Set());
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [promptBody, setPromptBody] = useState('');
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState(null);
  const [promptNotice, setPromptNotice] = useState('');

  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState('');
  const [showTokenConfig, setShowTokenConfig] = useState(false);
  const [maxTokensInput, setMaxTokensInput] = useState('1000');
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState('');

  useEffect(() => {
    if (prompts.length === 0) {
      setSelectedPromptIds(new Set());
      return;
    }

    setSelectedPromptIds((prev) => {
      if (prev.size === 0) {
        return new Set(prompts.map((prompt) => prompt.id));
      }

      const validPromptIds = new Set(prompts.map((prompt) => prompt.id));
      const next = new Set([...prev].filter((id) => validPromptIds.has(id)));
      return next.size > 0 ? next : new Set(prompts.map((prompt) => prompt.id));
    });
  }, [prompts]);

  const selectedPrompts = useMemo(
    () => prompts.filter((prompt) => selectedPromptIds.has(prompt.id)),
    [prompts, selectedPromptIds]
  );

  const selectedSegments = useMemo(
    () => segments.filter((segment) => selectedSegmentIds.has(segment.id)),
    [segments, selectedSegmentIds]
  );
  const promptNameById = useMemo(
    () => new Map(prompts.map((prompt) => [Number(prompt.id), prompt.name])),
    [prompts]
  );
  const compareLoadingMessage = 'Running prompt execution. This can take up to a minute.';

  const canContinueToPrompt = selectedSegmentIds.size >= 2;
  const canRunCompare = canContinueToPrompt && selectedPromptIds.size > 0;
  const stepItems = [
    { step: 1, title: 'Select Segments', description: 'Choose 2+ transcripts' },
    { step: 2, title: 'Choose Prompt', description: 'Pick or manage prompt' },
    { step: 3, title: 'Run Compare', description: 'Review and execute' }
  ];

  const handleCompareChannelChange = (channel) => {
    if (!channel?.id) return;
    navigate(`/channels/${channel.id}/transcript-compare`);
  };

  const fetchPrompts = async () => {
    setLoadingPrompts(true);
    setPromptsError('');
    try {
      const response = await axiosInstance.get('/prompts/');
      const rows = Array.isArray(response?.data) ? response.data : [];
      setPrompts(rows);
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to load prompts.';
      setPromptsError(message);
      setPrompts([]);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const fetchSegments = async () => {
    if (!channelId) return;
    setLoadingSegments(true);
    setSegmentsError('');
    try {
      if (segmentIdSearch.trim() && !/^\d+$/.test(segmentIdSearch.trim())) {
        setSegmentsError('Segment ID filter must be numeric.');
        setSegments([]);
        setSegmentsMeta({ count: 0, totalCount: 0 });
        return;
      }

      const params = {
        channel_id: Number(channelId),
        start_datetime: convertLocalToUTC(startDate, '00:00:00'),
        end_datetime: convertLocalToUTC(endDate, '23:59:59'),
        transcribed_only: transcribedOnly,
        limit: 50
      };
      if (segmentIdSearch.trim()) {
        params.id = segmentIdSearch.trim();
      }
      if (titleNameSearch.trim()) {
        params.title_name = titleNameSearch.trim();
      }

      const response = await axiosInstance.get('/audio/filter/prompt/', {
        params
      });
      setSegments(response?.data?.data || []);
      setSegmentsMeta({
        count: Number(response?.data?.count || 0),
        totalCount: Number(response?.data?.total_count || 0)
      });
      setSelectedSegmentIds(new Set());
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to load audio segments.';
      setSegmentsError(message);
      setSegments([]);
      setSegmentsMeta({ count: 0, totalCount: 0 });
    } finally {
      setLoadingSegments(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const toggleSegmentSelection = (segmentId) => {
    setSelectedSegmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) next.delete(segmentId);
      else next.add(segmentId);
      return next;
    });
  };

  const togglePromptSelection = (promptId) => {
    setSelectedPromptIds((prev) => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  };

  const handleTranscriptPreviewClick = (transcript) => {
    if (!transcript) return;
    setSelectedTranscript(transcript);
    setShowTranscriptionModal(true);
  };

  const openCreatePrompt = () => {
    setEditingPromptId(null);
    setPromptName('');
    setPromptBody('');
    setIsPromptModalOpen(true);
  };

  const openEditPrompt = (prompt) => {
    setEditingPromptId(prompt.id);
    setPromptName(prompt.name);
    setPromptBody(prompt.content || '');
    setIsPromptModalOpen(true);
  };

  const closePromptModal = () => {
    setIsPromptModalOpen(false);
    setEditingPromptId(null);
    setPromptName('');
    setPromptBody('');
  };

  const savePrompt = async () => {
    const cleanedName = promptName.trim();
    const cleanedPrompt = promptBody.trim();
    if (!cleanedName || !cleanedPrompt) return;

    setSavingPrompt(true);
    setPromptsError('');
    setPromptNotice('');
    try {
      if (editingPromptId) {
        await axiosInstance.patch(`/prompts/${editingPromptId}/`, {
          name: cleanedName,
          content: cleanedPrompt
        });
      } else {
        await axiosInstance.post('/prompts/', {
          name: cleanedName,
          content: cleanedPrompt,
          is_active: true
        });
      }
      await fetchPrompts();
      closePromptModal();
    } catch (error) {
      if (!editingPromptId && error?.response?.status === 405) {
        setPromptsError('Create prompt endpoint is not available yet in backend.');
      } else {
        const message =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          'Failed to save prompt.';
        setPromptsError(message);
      }
    } finally {
      setSavingPrompt(false);
    }
  };

  const deletePrompt = async (promptId) => {
    setDeletingPromptId(promptId);
    setPromptsError('');
    setPromptNotice('');
    try {
      await axiosInstance.delete(`/prompts/${promptId}/`);
      await fetchPrompts();
      setPromptNotice('Prompt deleted successfully.');
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to delete prompt.';
      setPromptsError(message);
    } finally {
      setDeletingPromptId(null);
    }
  };

  const runCompare = async () => {
    if (!canRunCompare) return;
    setIsComparing(true);
    setCompareError('');
    setCompareResult(null);
    try {
      const parsedMaxTokens = Number.parseInt(maxTokensInput, 10);
      const maxTokens = Number.isFinite(parsedMaxTokens) && parsedMaxTokens > 0 ? parsedMaxTokens : 1000;
      if (!(Number.isFinite(parsedMaxTokens) && parsedMaxTokens > 0)) {
        setMaxTokensInput('1000');
      }

      const payload = {
        prompt_ids: Array.from(selectedPromptIds).map((id) => Number(id)).filter((id) => Number.isFinite(id)),
        audio_segment_ids: Array.from(selectedSegmentIds).map((id) => Number(id)).filter((id) => Number.isFinite(id)),
        max_tokens: maxTokens
      };

      const response = await axiosInstance.post('/prompts/execute/', payload);
      const runData = response?.data || {};
      const results = Array.isArray(runData.results) ? runData.results : [];

      const completedCount = results.filter((item) => item?.status === 'completed').length;
      const failedCount = results.filter((item) => item?.status && item.status !== 'completed').length;
      setCompareResult({
        runAt: new Date().toISOString(),
        promptRunId: runData.prompt_run_id ?? null,
        maxTokens: runData.max_tokens ?? maxTokens,
        results,
        completedCount,
        failedCount
      });
      setActiveStep(3);
    } catch (error) {
      const responseData = error?.response?.data;
      let errorMessage = 'Comparison failed. Please try again.';
      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setCompareError(errorMessage);
    } finally {
      setIsComparing(false);
    }
  };

  if (!channelId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Select a channel first</h1>
            <p className="text-gray-600 mb-6">
              Transcript comparison is channel scoped. Please choose a channel before using this feature.
            </p>
            <button
              type="button"
              onClick={() => navigate('/user-channels')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Radio className="h-4 w-4" />
              Go to channels
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader title="Transcript Compare">
        <ChannelSwitcher onChannelChange={handleCompareChannelChange} />
      </CommonHeader>

      <main className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h1 className="text-2xl font-bold text-gray-900">Transcript Compare</h1>
            <p className="text-sm text-gray-600 mt-1">
              Select at least two audio segments, choose a predefined prompt, and run automated transcript comparison.
            </p>
            <div className="mt-5" role="tablist" aria-label="Transcript comparison steps">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stepItems.map((item) => {
                  const isCurrent = activeStep === item.step;
                  const isReachable =
                    item.step === 1 ||
                    (item.step === 2 && canContinueToPrompt) ||
                    (item.step === 3 && canRunCompare);
                  return (
                    <button
                      key={item.step}
                      id={`step-tab-${item.step}`}
                      role="tab"
                      aria-selected={isCurrent}
                      aria-controls={`step-panel-${item.step}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      type="button"
                      onClick={() => {
                        if (isReachable || item.step <= activeStep) setActiveStep(item.step);
                      }}
                      className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50'
                          : isReachable || item.step <= activeStep
                            ? 'border-gray-200 bg-white hover:bg-gray-50'
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-xs text-gray-500">Step {item.step}</div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs mt-0.5">{item.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <section
            id={`step-panel-${activeStep}`}
            role="tabpanel"
            aria-labelledby={`step-tab-${activeStep}`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            {activeStep === 1 && (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">1. Select Audio Segments</h2>
                  <div className="text-sm text-gray-600">{selectedSegmentIds.size} selected</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={segmentIdSearch}
                      onChange={(e) => setSegmentIdSearch(e.target.value)}
                      placeholder="Filter by segment ID..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={titleNameSearch}
                      onChange={(e) => setTitleNameSearch(e.target.value)}
                      placeholder="Filter by title name..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={transcribedOnly}
                      onChange={(e) => setTranscribedOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Show transcribed segments only
                  </label>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={fetchSegments}
                    disabled={loadingSegments}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {loadingSegments ? 'Loading...' : 'Apply Filters'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSegmentIds(new Set())}
                    className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Showing {segmentsMeta.count} segment(s) of {segmentsMeta.totalCount} total.
                </div>

                {segmentsError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {segmentsError}
                  </div>
                )}

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-[32rem] overflow-auto">
                    {loadingSegments ? (
                      <div className="p-6 text-sm text-gray-600">Loading segments...</div>
                    ) : segments.length === 0 ? (
                      <div className="p-6 text-sm text-gray-600">No segments found for the selected filters.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {segments.map((segment) => {
                          const transcript = getTranscriptText(segment);
                          return (
                            <li key={segment.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSegmentIds.has(segment.id)}
                                  onChange={() => toggleSegmentSelection(segment.id)}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-gray-900">#{segment.id}</span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-600">{formatDateTime(segment.start_time)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {segment.title || segment.title_before || segment.title_after || 'Untitled'} • {segment.duration_seconds || 0}s
                                  </div>
                                  {transcript ? (
                                    <>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {transcript}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleTranscriptPreviewClick(transcript);
                                        }}
                                        className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
                                        title="Read full transcript"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Read full transcript
                                      </button>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      No transcript available yet.
                                    </p>
                                  )}
                                </div>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={!canContinueToPrompt}
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    Continue to Prompt
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {activeStep === 2 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">2. Prompt Selection</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPromptIds(new Set(prompts.map((prompt) => prompt.id)))}
                      disabled={prompts.length === 0}
                      className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPromptIds(new Set())}
                      disabled={prompts.length === 0}
                      className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      onClick={openCreatePrompt}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Prompt
                    </button>
                  </div>
                </div>

                {loadingPrompts && (
                  <div className="mb-3 text-sm text-gray-600">Loading prompts...</div>
                )}
                {promptsError && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {promptsError}
                  </div>
                )}
                {promptNotice && (
                  <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    {promptNotice}
                  </div>
                )}

                <div className="space-y-3 max-h-[32rem] overflow-auto pr-1">
                  {!loadingPrompts && prompts.length === 0 && (
                    <div className="text-sm text-gray-600 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      No prompts found. Create a prompt to continue.
                    </div>
                  )}
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        selectedPromptIds.has(prompt.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedPromptIds.has(prompt.id)}
                            onChange={() => togglePromptSelection(prompt.id)}
                            className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{prompt.name}</div>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{prompt.content}</p>
                          </div>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPrompt(prompt)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            title="Edit prompt"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePrompt(prompt.id)}
                            disabled={deletingPromptId === prompt.id}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            title="Delete prompt"
                          >
                            {deletingPromptId === prompt.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Back to Segments
                  </button>
                  <button
                    type="button"
                    disabled={!canRunCompare}
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    Continue to Compare
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {activeStep === 3 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Run Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <div className="text-sm text-gray-500 mb-1">Selected segments</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedSegmentIds.size}</div>
                    <div className="text-xs text-gray-500 mt-1">Select at least 2 segments.</div>
                    {selectedSegments.length > 0 && (
                      <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white">
                        <ul className="divide-y divide-gray-100">
                          {selectedSegments.map((segment) => (
                            <li key={segment.id} className="px-3 py-2">
                              <div className="text-sm font-medium text-gray-900">
                                #{segment.id} - {segment.title || segment.title_before || segment.title_after || 'Untitled'}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatDateTime(segment.start_time)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <div className="text-sm text-gray-500 mb-1">Selected prompt</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedPromptIds.size}</div>
                    <div className="text-xs text-gray-500 mt-1">Select one or more prompts.</div>
                    {selectedPrompts.length > 0 && (
                      <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white">
                        <ul className="divide-y divide-gray-100">
                          {selectedPrompts.map((prompt) => (
                            <li key={prompt.id} className="px-3 py-2">
                              <div className="text-sm font-medium text-gray-900">
                                #{prompt.id} - {prompt.name}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canRunCompare || isComparing}
                  onClick={runCompare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
                >
                  {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isComparing ? 'Comparing...' : 'Compare Transcripts'}
                </button>

                {!canRunCompare && (
                  <p className="text-sm text-amber-700 mt-3">
                    Please select at least two segments and one prompt before running comparison.
                  </p>
                )}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowTokenConfig((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {showTokenConfig ? 'Hide token settings' : 'Customize max tokens'}
                  </button>
                  {showTokenConfig && (
                    <div className="mt-2 max-w-xs">
                      <label className="block text-xs text-gray-600 mb-1">Max tokens</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={maxTokensInput}
                        onChange={(e) => setMaxTokensInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default is 1000.</p>
                    </div>
                  )}
                </div>
                {compareError && <p className="text-sm text-red-600 mt-3">{compareError}</p>}

                {compareResult && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <CheckCircle2 className="h-5 w-5" />
                      Prompt Execution Complete
                    </div>
                    <div className="text-sm text-emerald-900 mt-2">
                      Run ID: <span className="font-semibold">{compareResult.promptRunId ?? 'N/A'}</span> ·
                      {' '}Max tokens: <span className="font-semibold">{compareResult.maxTokens}</span> ·
                      {' '}Completed: <span className="font-semibold">{compareResult.completedCount}</span> ·
                      {' '}Other: <span className="font-semibold">{compareResult.failedCount}</span>
                    </div>
                    <div className="text-xs text-emerald-700 mt-2 mb-3">
                      Run timestamp: {formatDateTime(compareResult.runAt)}
                    </div>

                    <div className="space-y-3">
                      {compareResult.results.length === 0 ? (
                        <div className="text-sm text-emerald-900">No prompt results were returned.</div>
                      ) : (
                        compareResult.results.map((result) => {
                          const status = String(result?.status || '').toLowerCase();
                          const isCompleted = status === 'completed';
                          return (
                            <div key={result.id} className="rounded-lg border border-emerald-200 bg-white p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-gray-900">
                                  #{result?.id ?? 'N/A'} · Prompt #{result?.prompt_id ?? 'N/A'}
                                  {result?.prompt_id != null && promptNameById.get(Number(result.prompt_id))
                                    ? ` (${promptNameById.get(Number(result.prompt_id))})`
                                    : ''}
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {status || 'unknown'}
                                </span>
                              </div>
                              {result?.response ? (
                                <div className="mt-2 text-sm text-gray-700 break-words max-h-64 overflow-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      h1: ({ children }) => <h1 className="text-base font-semibold mt-2 mb-1">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-1">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                      li: ({ children }) => <li>{children}</li>,
                                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                      em: ({ children }) => <em className="italic">{children}</em>,
                                      code: ({ children }) => (
                                        <code className="px-1 py-0.5 rounded bg-gray-200 text-xs">{children}</code>
                                      )
                                    }}
                                  >
                                    {result.response}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <div className="mt-2 text-sm text-gray-500">No response content returned.</div>
                              )}
                              {result?.error_message ? (
                                <div className="mt-2 text-sm text-red-600">
                                  Error: {result.error_message}
                                </div>
                              ) : null}
                              {result?.created_at ? (
                                <div className="mt-2 text-xs text-gray-500">
                                  Created: {formatDateTime(result.created_at)}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Back to Prompt
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {showTranscriptionModal && selectedTranscript && (
        <TranscriptionModal
          transcription={selectedTranscript}
          onClose={() => {
            setShowTranscriptionModal(false);
            setSelectedTranscript('');
          }}
        />
      )}

      {isComparing && (
        <div className="fixed inset-0 z-[120] bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">Running prompt comparison</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {compareLoadingMessage}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Segments</div>
                <div className="text-lg font-semibold text-gray-900">{selectedSegmentIds.size}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Prompts</div>
                <div className="text-lg font-semibold text-gray-900">{selectedPromptIds.size}</div>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-purple-500" />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Please keep this tab open while processing. Results will appear automatically once complete.
            </p>
          </div>
        </div>
      )}

      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPromptId ? 'Edit Prompt' : 'Create Prompt'}
              </h3>
              <button
                type="button"
                onClick={closePromptModal}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Name</label>
                <input
                  type="text"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="e.g. Compare sentiment by hour"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Text</label>
                <textarea
                  value={promptBody}
                  onChange={(e) => setPromptBody(e.target.value)}
                  rows={7}
                  placeholder="Write the instruction that will be sent to the LLM..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closePromptModal}
                className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePrompt}
                disabled={!promptName.trim() || !promptBody.trim() || savingPrompt}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPrompt ? 'Saving...' : 'Save Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptComparePage;
