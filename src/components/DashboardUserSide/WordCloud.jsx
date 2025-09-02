import { MessageCircle } from 'lucide-react';

const WordCloud = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-800">Most Used Words</h3>
      </div>

      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Word cloud placeholder
        </p>
      </div>
    </div>
  );
};

export default WordCloud;