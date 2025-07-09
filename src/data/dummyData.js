// src/data/dummyData.js

export const dummyChannels = [
  {
    id: '1',
    channelId: 'wsg',
    projectId: 'sef',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    channelId: 'CHsdf002',
    projectId: 'PsdgRJ002',
    isActive: false,
    createdAt: '2024-01-20T14:15:00Z',
  },
  {
    id: '3',
    channelId: 'CH003',
    projectId: 'PRJ001',
    isActive: true,
    createdAt: '2024-01-25T09:45:00Z',
  },
];

export const dummySettings = {
  openAiTranscriptionApi: 'OPENAI_API_KEY_PLACEHOLDER',
  openAiOrganisationalId: 'ORG_ID_PLACEHOLDER',
  googleCloudClientId: 'GOOGLE_CLIENT_ID_PLACEHOLDER',
  googleCloudClientSecret: 'GOOGLE_CLIENT_SECRET_PLACEHOLDER',
  assemblyAiUser: 'ASSEMBLY_USER_PLACEHOLDER',
  assemblyAiPassword: 'ASSEMBLY_PASSWORD_PLACEHOLDER',
  assemblyAiApi: 'ASSEMBLY_API_KEY_PLACEHOLDER',
  revAiAccessToken: 'REVAI_ACCESS_TOKEN_PLACEHOLDER',
  revAiAuthorization: 'REVAI_AUTHORIZATION_TOKEN_PLACEHOLDER',
  summariseTranscript: 'SUMMARISE_TRANSCRIPT_PROMPT_PLACEHOLDER',
  sentimentAnalysis: 'SENTIMENT_ANALYSIS_PROMPT_PLACEHOLDER',
  generalTopicsPrompt: 'GENERAL_TOPICS_PROMPT_PLACEHOLDER',
  iabTopicsPrompt: 'IAB_TOPICS_PROMPT_PLACEHOLDER',
  bucketPrompt: 'BUCKET_PROMPT_PLACEHOLDER',
  bucketDefinitionErrorRate: '80',
  chatGptModel: 'GPT_MODEL_NAME_PLACEHOLDER',
  chatGptMaxTokens: '0',
  chatGptTemperature: '1',
  chatGptTopP: '1',
  chatGptFrequencyPenalty: '0',
  chatGptPresencePenalty: '0',
  determineRadioContentType: 'RADIO_CONTENT_TYPE_PLACEHOLDER',
  radioSegmentContent: 'RADIO_SEGMENT_CONTENT_PLACEHOLDER',
  radioSegmentErrorRate: '80%',
};

export const dummyBuckets = [
  {
    id: '1',
    name: 'Inner/Emotional/Mental Wellness',
    value: '• Understanding and respecting your feelings, values, and attitudes\n• Appreciating the feelings of others\n• Managing your emotions in a constructive way\n• Feeling positive and enthusiastic about your life',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Physical Wellness',
    value: '• Caring for your body to stay healthy now and in the future\n• Pain, fitness, health, ability for the body to function as best as is possible.',
    createdAt: '2024-01-16T11:30:00Z',
  },
  {
    id: '3',
    name: 'Financial Wellness',
    value: '• Managing your resources to live within your means, making informed financial decisions and investments, setting realistic goals, and preparing for short-term and long-term needs or emergencies\n• Being aware that everyone\'s financial values, needs, and circumstances are unique',
    createdAt: '2024-01-17T12:30:00Z',
  },
];
