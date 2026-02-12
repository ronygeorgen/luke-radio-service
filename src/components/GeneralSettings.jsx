import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSetting, clearError } from '../store/slices/settingsSlice';
import SettingField from './SettingField';
import BucketManager from './BucketManager';
import { Save, Radio } from 'lucide-react';
import Toast from './UserSide/Toast';

const GeneralSettings = () => {
  const dispatch = useDispatch();
  const channelId = localStorage.getItem('channelId');
  const { settings, loading } = useSelector(state => state.settings);
  const [changedSettings, setChangedSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    if (channelId) {
      dispatch(fetchSettings(channelId));
    }
  }, [dispatch, channelId]);

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

  const handleSaveAll = async () => {
    if (Object.keys(changedSettings).length === 0) {
      setErrorToast('No changes to save');
      return;
    }

    setIsSaving(true);
    setErrorToast(null);
    setSuccessToast(null);
    dispatch(clearError());

    try {
      // Save each changed setting
      const savePromises = Object.entries(changedSettings).map(([key, value]) =>
        dispatch(updateSetting({ key, value }))
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

  const hasChanges = Object.keys(changedSettings).length > 0;

  if (!channelId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please select a channel to view and edit general settings.</p>
        </div>
      </div>
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

      <div className="space-y-8">
        {/* Save Button - Fixed at top right so it stays visible when scrolling */}
        <div className="fixed top-24 right-6 sm:right-8 lg:right-10 z-30 flex justify-end">
          <button
            onClick={handleSaveAll}
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