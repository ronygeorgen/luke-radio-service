import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSetting, clearError, fetchSettingsVersions, revertToVersion } from '../store/slices/settingsSlice';
import { fetchChannels, fetchUserChannels, setDefaultSettings, selectUserChannels } from '../store/slices/channelSlice';
import SettingField from './SettingField';
import BucketManager from './BucketManager';
import SimpleChannelSelectionModal from '../pages/user/SimpleChannelSelectionModal';
import { Save, Radio, Star, X, History, RotateCcw, MoreVertical, ChevronDown } from 'lucide-react';
import Toast from './UserSide/Toast';
import dayjs from 'dayjs';

const GeneralSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const channelId = localStorage.getItem('channelId');
  const { settings, loading } = useSelector(state => state.settings);
  const channels = useSelector(state => state.channels.channels);
  const userChannels = useSelector(selectUserChannels);
  const currentChannel = channelId ? channels.find(c => c.id === channelId) : null;
  const [, setChannelSelectedVersion] = useState(0);
  const justSelectedChannelRef = useRef(false);
  const isDefaultSettings = currentChannel?.isDefaultSettings === true;
  const [defaultSettingsLoading, setDefaultSettingsLoading] = useState(false);
  const [changedSettings, setChangedSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [showSaveReasonModal, setShowSaveReasonModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [revertLoading, setRevertLoading] = useState(false);
  const [revertConfirmVersion, setRevertConfirmVersion] = useState(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef(null);
  const [expandedBucketId, setExpandedBucketId] = useState(null);

  useEffect(() => {
    if (channelId) {
      dispatch(fetchSettings(channelId));
      dispatch(fetchChannels());
    }
  }, [dispatch, channelId]);

  // When no channel selected, fetch user channels for the selection modal
  useEffect(() => {
    if (!channelId && userChannels.length === 0) {
      dispatch(fetchUserChannels());
    }
  }, [dispatch, channelId, userChannels.length]);

  const handleDefaultSettingsToggle = async () => {
    if (!channelId) return;
    setDefaultSettingsLoading(true);
    setErrorToast(null);
    setSuccessToast(null);
    try {
      const result = await dispatch(setDefaultSettings({
        channelId,
        isDefaultSettings: !isDefaultSettings
      })).unwrap();
      setSuccessToast(result?.is_default_settings
        ? 'This channel is now your default settings channel.'
        : 'Default settings removed from this channel.');
    } catch (err) {
      setErrorToast(err || 'Failed to update default settings.');
    } finally {
      setDefaultSettingsLoading(false);
    }
  };

  const handleValueChange = (key, value) => {
    // Track which settings have changed
    if (value !== settings[key]) {
      setChangedSettings(prev => ({ ...prev, [key]: value }));
    } else {
      // Remove from changed settings if value matches original
      setChangedSettings(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const handleSaveAll = async (changeReasonValue) => {
    if (Object.keys(changedSettings).length === 0) {
      setErrorToast('No changes to save');
      return;
    }

    setShowSaveReasonModal(false);
    setChangeReason('');
    setIsSaving(true);
    setErrorToast(null);
    setSuccessToast(null);
    dispatch(clearError());

    const reasonToSend = changeReasonValue != null && String(changeReasonValue).trim() !== ''
      ? String(changeReasonValue).trim()
      : undefined;

    try {
      // Save each changed setting (pass change_reason on first call; API uses it for the save action)
      const entries = Object.entries(changedSettings);
      const savePromises = entries.map(([key, value], index) =>
        dispatch(updateSetting({
          key,
          value,
          ...(index === 0 && reasonToSend ? { change_reason: reasonToSend } : {})
        }))
      );

      const results = await Promise.all(savePromises);

      // Check if any failed
      const failures = results.filter(result => updateSetting.rejected.match(result));

      if (failures.length > 0) {
        const errorMessages = failures.map(f => f.payload || 'Failed to update setting').join('; ');
        setErrorToast(errorMessages);
        dispatch(clearError());
      } else {
        setSuccessToast(`Successfully saved ${Object.keys(changedSettings).length} setting(s)`);
        setChangedSettings({});
      }
    } catch (error) {
      const errorMessage = error?.message || 'Failed to save settings';
      setErrorToast(errorMessage);
      dispatch(clearError());
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (Object.keys(changedSettings).length === 0) {
      setErrorToast('No changes to save');
      return;
    }
    setShowSaveReasonModal(true);
  };

  const handleSaveReasonConfirm = () => {
    handleSaveAll(changeReason);
  };

  const handleSaveReasonCancel = () => {
    setShowSaveReasonModal(false);
    setChangeReason('');
  };

  const handleOpenVersionsPanel = () => {
    setSelectedVersion(null);
    setRevertConfirmVersion(null);
    setShowVersionsPanel(true);
    setVersionsLoading(true);
    dispatch(fetchSettingsVersions(channelId))
      .then((result) => {
        if (fetchSettingsVersions.fulfilled.match(result)) {
          setVersions(result.payload || []);
        }
      })
      .finally(() => setVersionsLoading(false));
  };

  const handleCloseVersionsPanel = () => {
    setShowVersionsPanel(false);
    setSelectedVersion(null);
    setRevertConfirmVersion(null);
    setVersions([]);
    setExpandedBucketId(null);
  };

  // Collapse bucket when switching version
  useEffect(() => {
    setExpandedBucketId(null);
  }, [selectedVersion?.id]);

  const handleRevertClick = () => {
    if (selectedVersion) setRevertConfirmVersion(selectedVersion.version);
  };

  const handleRevertConfirm = async () => {
    if (!channelId || revertConfirmVersion == null) return;
    setRevertLoading(true);
    setErrorToast(null);
    try {
      await dispatch(revertToVersion({ channelId, targetVersionNumber: revertConfirmVersion })).unwrap();
      setSuccessToast(`Reverted to version ${revertConfirmVersion}. Settings have been updated.`);
      handleCloseVersionsPanel();
      setRevertConfirmVersion(null);
      const result = await dispatch(fetchSettingsVersions(channelId));
      if (fetchSettingsVersions.fulfilled.match(result)) {
        setVersions(result.payload || []);
      }
    } catch (err) {
      setErrorToast(err || 'Failed to revert to this version.');
    } finally {
      setRevertLoading(false);
    }
  };

  const hasChanges = Object.keys(changedSettings).length > 0;

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No channel selected: show channel selection modal first (same UX as dashboard)
  // Modal calls onClose() after selection too — only navigate back when user cancels
  const handleChannelModalClose = () => {
    if (justSelectedChannelRef.current) {
      justSelectedChannelRef.current = false;
      return;
    }
    navigate(-1);
  };
  const handleChannelSelect = () => {
    justSelectedChannelRef.current = true;
    setChannelSelectedVersion(n => n + 1);
  };
  if (!channelId) {
    return (
      <SimpleChannelSelectionModal
        isOpen={true}
        onClose={handleChannelModalClose}
        onChannelSelect={handleChannelSelect}
        channels={userChannels}
        title="Select a Channel"
        description="Choose a channel to view and edit general settings"
      />
    );
  }

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const settingGroups = [
    {
      title: 'API Keys',
      settings: [
        { key: 'openAiTranscriptionApi', label: 'OpenAI - Transcription API' },
        { key: 'openAiOrganisationalId', label: 'OpenAI - Organisational ID' },
        { key: 'acrCloudApi', label: 'ACR Cloud - API Key' },
        { key: 'revAiAccessToken', label: 'Rev.ai Access Token' },
      ]
    },
    {
      title: 'AI Prompts',
      settings: [
        { key: 'summariseTranscript', label: 'Summarise Transcript', isTextarea: true },
        { key: 'sentimentAnalysis', label: 'Sentiment Analysis', isTextarea: true },
        { key: 'generalTopicsPrompt', label: 'General Topics Prompt', isTextarea: true },
        { key: 'iabTopicsPrompt', label: 'IAB Topics Prompt', isTextarea: true },
        { key: 'bucketPrompt', label: 'Bucket Prompt', isTextarea: true, disableEdit: true },
        { key: 'determineRadioContentType', label: 'Content Type(Comma Separated)', isTextarea: true },
        { key: 'determineRadioContentTypePrompt', label: 'Determine Radio Content Type Prompt', isTextarea: true },
      ]
    },
    {
      title: 'Configuration',
      settings: [
        { key: 'bucketDefinitionErrorRate', label: 'Bucket Definition Error Rate' },
        { key: 'chatGptModel', label: 'ChatGPT Model' },
        { key: 'chatGptTemperature', label: 'ChatGPT Temperature' },
        { key: 'chatGptTopP', label: 'ChatGPT Top P' },
        { key: 'radioSegmentErrorRate', label: 'Radio Segment Error Rate' },
      ]
    }
  ];

  return (
    <>
      {errorToast && (
        <Toast
          message={errorToast}
          type="error"
          onClose={() => setErrorToast(null)}
        />
      )}
      {successToast && (
        <Toast
          message={successToast}
          type="success"
          onClose={() => setSuccessToast(null)}
        />
      )}

      {/* Save Change Reason Modal */}
      {showSaveReasonModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          onClick={(e) => e.target === e.currentTarget && handleSaveReasonCancel()}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save settings</h3>
              <button
                type="button"
                onClick={handleSaveReasonCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="changeReason" className="block text-sm font-medium text-gray-700 mb-1">
                Change reason (optional)
              </label>
              <textarea
                id="changeReason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Initial setup, Updated prompts..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveReasonCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReasonConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert confirm modal */}
      {revertConfirmVersion != null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]"
          onClick={() => !revertLoading && setRevertConfirmVersion(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revert to this version?</h3>
            <p className="text-gray-600 mb-4">
              This will create a new active version with the same content as version {revertConfirmVersion}. Your current settings will remain in history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevertConfirmVersion(null)}
                disabled={revertLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevertConfirm}
                disabled={revertLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {revertLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Reverting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Revert to version {revertConfirmVersion}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings version history panel (slide-over) */}
      {showVersionsPanel && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={handleCloseVersionsPanel}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Settings version history</h2>
              <button
                type="button"
                onClick={handleCloseVersionsPanel}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {versionsLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                  <div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-200 md:max-w-xs flex-shrink-0">
                    <p className="text-sm text-gray-500 px-4 py-2">Select a version to preview</p>
                    <div className="overflow-y-auto flex-1 min-h-[200px]">
                      {versions.length === 0 ? (
                        <p className="px-4 py-4 text-gray-500 text-sm">No versions found.</p>
                      ) : (
                        <ul className="p-2 space-y-1">
                          {versions.map((v) => (
                            <li key={v.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedVersion(v)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                  selectedVersion?.id === v.id
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'hover:bg-gray-100 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium">Version {v.version}</span>
                                  {v.is_active && (
                                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Current</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {v.created_at ? dayjs(v.created_at).format('MMM D, YYYY · h:mm A') : ''}
                                </div>
                                {v.change_reason && (
                                  <div className="text-xs text-gray-600 mt-1 truncate" title={v.change_reason}>
                                    {v.change_reason}
                                  </div>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
                    {selectedVersion ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Preview — Version {selectedVersion.version}
                          </h3>
                          {!selectedVersion.is_active && (
                            <button
                              type="button"
                              onClick={handleRevertClick}
                              disabled={revertLoading}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Revert to this version
                            </button>
                          )}
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                          {settingGroups.map((group) => (
                            <div key={group.title}>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">{group.title}</h4>
                              <div className="grid grid-cols-1 gap-3">
                                {group.settings.map((setting) => (
                                  <SettingField
                                    key={setting.key}
                                    label={setting.label}
                                    settingKey={setting.key}
                                    value={selectedVersion.settings[setting.key] ?? ''}
                                    isTextarea={setting.isTextarea}
                                    disableEdit
                                    onValueChange={() => {}}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Buckets ({selectedVersion.buckets?.length ?? 0})</h4>
                            <ul className="space-y-1">
                              {(selectedVersion.buckets || []).map((b) => {
                                const isExpanded = expandedBucketId === b.id;
                                const hasContent = b.value && String(b.value).trim().length > 0;
                                return (
                                  <li key={b.id} className="rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedBucketId(isExpanded ? null : b.id)}
                                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                      <span className="font-medium text-gray-800 truncate">
                                        {b.name}
                                        {b.category ? (
                                          <span className="font-normal text-gray-500 ml-1">· {b.category}</span>
                                        ) : null}
                                      </span>
                                      <ChevronDown
                                        className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                      />
                                    </button>
                                    {isExpanded && (
                                      <div className="px-3 py-2.5 bg-white border-t border-gray-100">
                                        <p className="text-xs text-gray-600 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                          {hasContent ? b.value : 'No description'}
                                        </p>
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                        <History className="h-12 w-12 mb-2 opacity-50" />
                        <p className="text-sm">Select a version from the list to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="space-y-8">
        {/* Save + three-dots menu - fixed at top right */}
        <div ref={settingsMenuRef} className="fixed top-24 right-6 sm:right-8 lg:right-10 z-30 flex items-center gap-1">
          <button
            onClick={handleSaveClick}
            disabled={!hasChanges || isSaving}
            className={`
              flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all duration-200
              ${hasChanges && !isSaving
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/50 hover:shadow-blue-500/70'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Save className="h-4 w-4" />
            <span>
              {isSaving ? 'Saving...' : hasChanges ? `Save ${Object.keys(changedSettings).length} Change(s)` : 'No Changes'}
            </span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsMenuOpen(prev => !prev)}
              className="flex items-center justify-center w-10 h-10 rounded-lg font-medium shadow-lg transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              aria-label="Settings options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {settingsMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenVersionsPanel();
                    setSettingsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <History className="h-4 w-4 flex-shrink-0" />
                  <span>Revert to older version</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDefaultSettingsToggle();
                    setSettingsMenuOpen(false);
                  }}
                  disabled={defaultSettingsLoading}
                  className={`
                    flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm transition-colors
                    ${defaultSettingsLoading ? 'opacity-60 cursor-not-allowed text-gray-500' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <Star className={`h-4 w-4 flex-shrink-0 ${isDefaultSettings ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>
                    {defaultSettingsLoading
                      ? 'Updating...'
                      : isDefaultSettings
                        ? 'Remove as default settings'
                        : 'Make default settings'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {settingGroups.map(group => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.settings.map(setting => (
                <SettingField
                  key={setting.key}
                  label={setting.label}
                  settingKey={setting.key}
                  value={changedSettings[setting.key] !== undefined ? changedSettings[setting.key] : settings[setting.key] || ''}
                  isTextarea={setting.isTextarea}
                  disableEdit={setting.disableEdit}
                  onValueChange={handleValueChange}
                />
              ))}
            </div>
          </div>
        ))}

        <BucketManager />
      </div>
    </>
  );
};

export default GeneralSettings;