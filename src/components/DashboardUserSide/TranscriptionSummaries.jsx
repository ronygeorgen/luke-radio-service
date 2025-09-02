import { FileText } from 'lucide-react';
import { recentTranscriptions } from '../../data/DashboardData';


const TranscriptionSummaries = () => {
  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Recent Transcription Summaries</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-3">Title</th>
              <th className="pb-3">Summary</th>
              <th className="pb-3">Sentiment</th>
              <th className="pb-3">Topics</th>
              <th className="pb-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentTranscriptions.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="py-4 font-medium text-gray-900">{item.title}</td>
                <td className="py-4 text-gray-600 max-w-xs">
                  <p className="truncate">{item.summary}</p>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                    {item.topics.length > 2 && (
                      <span className="text-gray-500 text-xs">+1</span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-gray-500 text-sm">{item.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TranscriptionSummaries;