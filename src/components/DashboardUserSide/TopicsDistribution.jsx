import { BarChart } from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal, fetchAudioSegmentsByTopic } from "../../store/slices/topicModalSlice";

const TopicsDistribution = () => {
  const { topicsDistribution, loading } = useDashboard();
  const [hoveredTopic, setHoveredTopic] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const dispatch = useDispatch();

  const { dateRange, showAllTopics } = useSelector((state) => state.dashboard);

  const handleTopicClick = (topic) => {
    dispatch(openModal(topic.topic));
    
    // Extract just the date part (YYYY-MM-DD) from the datetime strings
    const startDate = dateRange.startDateOrDateTime ? dateRange.startDateOrDateTime.split(' ')[0] : '';
    const endDate = dateRange.endDateOrDateTime ? dateRange.endDateOrDateTime.split(' ')[0] : '';
    
    dispatch(fetchAudioSegmentsByTopic({
      topicName: topic.topic,
      startDate: startDate,
      endDate: endDate,
      showAllTopics: showAllTopics
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            Top Topics Distribution
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mr-4"></div>
              <div className="flex-1 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!topicsDistribution || topicsDistribution.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            Top Topics Distribution
          </h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          No topics data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...topicsDistribution.map((t) => t.value));
  const normalizedData = topicsDistribution.map((topic) => ({
    ...topic,
    normalizedValue: topic.value / maxValue,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8 relative">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Top Topics Distribution
        </h3>
      </div>

      <div className="space-y-3">
        {normalizedData.slice(0, 10).map((topic, index) => (
          <div 
            key={index} 
            className="flex items-center cursor-pointer"
            onClick={() => handleTopicClick(topic)}
          >
            <div className="w-32 text-sm text-gray-600 text-right pr-4 truncate">
              {topic.topic}
            </div>
            <div className="flex-1 relative">
              <div className="bg-gray-200 h-6 rounded-r">
                <div
                  className="bg-blue-400 h-6 rounded-r transition-all duration-1000 hover:bg-blue-500"
                  style={{ width: `${topic.normalizedValue * 100}%` }}
                  onMouseEnter={() => setHoveredTopic(topic)}
                  onMouseMove={(e) => {
                    setCursorPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredTopic(null)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredTopic && (
        <div
          className="fixed bg-white text-gray-700 text-xs px-3 py-2 rounded shadow-lg border border-gray-200 z-50"
          style={{
            left: cursorPos.x + 12, // small offset to the right
            top: cursorPos.y + 12, // small offset below
            pointerEvents: "none",
          }}
        >
          <div className="font-medium">{hoveredTopic.topic}</div>
          <div>Count: {hoveredTopic.value}</div>
        </div>
      )}
    </div>
  );
};

export default TopicsDistribution;
