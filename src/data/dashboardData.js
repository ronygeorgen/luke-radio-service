export const dashboardStats = {
  totalTranscriptions: 1247,
  avgSentimentScore: 71,
  uniqueTopics: 45,
  activeShifts: 3
};

export const sentimentData = [
  { date: '01/01/2024', sentiment: 68 },
  { date: '02/01/2024', sentiment: 72 },
  { date: '03/01/2024', sentiment: 65 },
  { date: '04/01/2024', sentiment: 78 },
  { date: '05/01/2024', sentiment: 74 }
];

export const topicsDistribution = [
  { topic: 'POLITICS', value: 0.35 },
  { topic: 'MEDIA TECHNOLOGY', value: 0.28 },
  { topic: 'DANCES', value: 0.22 },
  { topic: 'COMEDY', value: 0.20 },
  { topic: 'RECREATION', value: 0.18 },
  { topic: 'CONVERSATION', value: 0.16 },
  { topic: 'WRITERS', value: 0.14 },
  { topic: 'EDUCATION', value: 0.12 },
  { topic: 'LIFESTYLE', value: 0.10 },
  { topic: 'ABSTRACT', value: 0.08 },
  { topic: 'COMMUNITY INVOLVEMENT', value: 0.06 },
  { topic: 'ADS', value: 0.04 },
  { topic: 'MUSIC', value: 0.03 },
  { topic: 'PRESENTATIONS', value: 0.02 },
  { topic: 'RADIO', value: 0.01 }
];

export const topTopicsRanking = [
  { 
    rank: 1, 
    topic: 'RADIO', 
    count: 180, 
    percentage: 35.2, 
    trend: 'up' 
  },
  { 
    rank: 2, 
    topic: 'PRESENTATIONS', 
    count: 140, 
    percentage: 27.4, 
    trend: 'neutral' 
  },
  { 
    rank: 3, 
    topic: 'MUSIC', 
    count: 120, 
    percentage: 23.5, 
    trend: 'down' 
  },
  { 
    rank: 4, 
    topic: 'ADS', 
    count: 95, 
    percentage: 18.6, 
    trend: 'up' 
  },
  { 
    rank: 5, 
    topic: 'COMMUNITY INVOLVEMENT', 
    count: 85, 
    percentage: 16.7, 
    trend: 'neutral' 
  }
];

export const recentTranscriptions = [
  {
    id: 1,
    title: 'Morning News Update',
    summary: 'Morning news covering local weather updates and traffic conditions.',
    sentiment: 'Positive',
    topics: ['News', 'Weather'],
    created: 'over 1 year ago'
  },
  {
    id: 2,
    title: 'Sports Roundup',
    summary: 'Weekly sports highlights and upcoming game previews.',
    sentiment: 'Positive',
    topics: ['Sports', 'Entertainment'],
    created: 'over 1 year ago'
  },
  {
    id: 3,
    title: 'Tech Talk Tuesday',
    summary: 'Discussion about latest technology trends and innovations.',
    sentiment: 'Neutral',
    topics: ['Technology', 'Innovation'],
    created: '11 months ago'
  },
  {
    id: 4,
    title: 'Music Spotlight',
    summary: 'Featured artist interviews and new music releases.',
    sentiment: 'Positive',
    topics: ['Music', 'Entertainment'],
    created: '10 months ago'
  }
];

export const filters = {
  dateRange: 'All Time',
  sentiment: '-1 to 1'
};

// Shift Analytics Data
export const shiftData = {
  morning: {
    title: 'Morning Shift (6AM-2PM)',
    total: 423,
    avgSentiment: 75.00,
    topTopic: 'News'
  },
  afternoon: {
    title: 'Afternoon Shift (2PM-10PM)',
    total: 387,
    avgSentiment: 68.00,
    topTopic: 'Sports'
  },
  night: {
    title: 'Night Shift (10PM-6AM)',
    total: 234,
    avgSentiment: 62.00,
    topTopic: 'Music'
  }
};

export const sentimentByShift = [
  { shift: 'Morning Shift (6AM-2PM)', value: 75 },
  { shift: 'Afternoon Shift (2PM-10PM)', value: 68 },
  { shift: 'Night Shift (10PM-6AM)', value: 62 }
];

export const transcriptionCountByShift = [
  { shift: 'Morning', count: 423, color: '#3b82f6' },
  { shift: 'Afternoon', count: 387, color: '#10b981' },
  { shift: 'Night', count: 234, color: '#f59e0b' }
];

export const topTopicsByShift = {
  morning: [
    { rank: 1, topic: 'News', count: 78 },
    { rank: 2, topic: 'Weather', count: 45 },
    { rank: 3, topic: 'Traffic', count: 23 }
  ],
  afternoon: [
    { rank: 1, topic: 'Sports', count: 56 },
    { rank: 2, topic: 'Music', count: 34 },
    { rank: 3, topic: 'Entertainment', count: 28 }
  ],
  night: [
    { rank: 1, topic: 'Music', count: 45 },
    { rank: 2, topic: 'Talk Shows', count: 23 },
    { rank: 3, topic: 'Late Night', count: 18 }
  ]
};