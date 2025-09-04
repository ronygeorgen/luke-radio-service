import { BarChart3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Radio Analytics Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Comprehensive insights into radio transcription data
            </p>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
           <Link to='/user-channels'><span>Switch to Channels</span> </Link>
        </button>
      </div>
    </div>
  );
};

export default Hero;