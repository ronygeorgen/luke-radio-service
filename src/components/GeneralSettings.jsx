import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../store/slices/settingsSlice';
import SettingField from './SettingField';
import BucketManager from './BucketManager';

const GeneralSettings = () => {
  const dispatch = useDispatch();
  const { settings, loading, error } = useSelector(state => state.settings);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

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
        // { key: 'googleCloudClientId', label: 'Google Cloud - Client ID' },
        // { key: 'googleCloudClientSecret', label: 'Google Cloud - Client Secret' },
        // { key: 'assemblyAiUser', label: 'Assembly AI - User' },
        // { key: 'assemblyAiPassword', label: 'Assembly AI - Password' },
        // { key: 'assemblyAiApi', label: 'Assembly AI - API' },
        { key: 'acrCloudApi', label: 'ACR Cloud - API Key' },
        { key: 'revAiAccessToken', label: 'Rev.ai Access Token' },
        // { key: 'revAiAuthorization', label: 'RevAi - Authorization' },
      ]
    },
    {
      title: 'AI Prompts',
      settings: [
        { key: 'summariseTranscript', label: 'Summarise Transcript', isTextarea: true },
        { key: 'sentimentAnalysis', label: 'Sentiment Analysis', isTextarea: true },
        { key: 'generalTopicsPrompt', label: 'General Topics Prompt', isTextarea: true },
        { key: 'iabTopicsPrompt', label: 'IAB Topics Prompt', isTextarea: true },
        { key: 'bucketPrompt', label: 'Bucket Prompt', isTextarea: true },
        { key: 'determineRadioContentType', label: 'Content Type(Comma Separated)', isTextarea: true },
      ]
    },
    {
      title: 'Configuration',
      settings: [
        { key: 'bucketDefinitionErrorRate', label: 'Bucket Definition Error Rate' },
        { key: 'chatGptModel', label: 'ChatGPT Model' },
        { key: 'chatGptMaxTokens', label: 'ChatGPT Max Tokens' },
        { key: 'chatGptTemperature', label: 'ChatGPT Temperature' },
        { key: 'chatGptTopP', label: 'ChatGPT Top P' },
        { key: 'chatGptFrequencyPenalty', label: 'ChatGPT Frequency Penalty' },
        { key: 'chatGptPresencePenalty', label: 'ChatGPT Presence Penalty' },
        { key: 'radioSegmentContent', label: 'Radio Segment/Content (Comma Separated)' },
        { key: 'radioSegmentErrorRate', label: 'Radio Segment Error Rate' },
      ]
    }
  ];

  return (
    <div className="space-y-8">

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

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
                value={settings[setting.key] || ''}
                isTextarea={setting.isTextarea}
              />
            ))}
          </div>
        </div>
      ))}

      <BucketManager />
    </div>
  );
};

export default GeneralSettings;