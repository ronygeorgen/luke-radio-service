import { useState } from 'react';
import Hero from './Hero';
import Filters from './Filters';
import StatsCards from './StatsCards';
import ShiftCards from './ShiftCards';
import AnalyticsTabs from './AnalyticsTabs';
import SentimentGauge from './SentimentGauge';
import SentimentChart from './SentimentChart';
import SentimentByShiftChart from './SentimentByShiftChart';
import TranscriptionCountChart from './TranscriptionCountChart';
import TopicsDistribution from './TopicsDistribution';
import WordCloud from './WordCloud';
import TopTopicsTable from './TopTopicsTable';
import TopTopicsByShift from './TopTopicsByShift';
import TranscriptionSummaries from './TranscriptionSummaries';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('main');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Hero />
      <Filters />
      
      {activeTab === 'main' ? <StatsCards /> : <ShiftCards />}
      
      <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'main' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <SentimentGauge />
              <SentimentChart />
            </div>
            
            <TopicsDistribution />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <WordCloud />
              <TopTopicsTable />
            </div>

            <TranscriptionSummaries />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <SentimentByShiftChart />
              <TranscriptionCountChart />
            </div>
            
            <TopTopicsByShift />
          </>
        )}
      </AnalyticsTabs>
    </main>
  );
}

export default Dashboard;
