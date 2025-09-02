import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-6">
        {/* Admin Card */}
        <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
          <p className="text-gray-600 mb-6">Manage channels and settings.</p>
          <button
            onClick={() => navigate("/admin")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Switch to Admin
          </button>
        </div>

        {/* Channels Card */}
        <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <h2 className="text-xl font-semibold mb-4">Channels</h2>
          <p className="text-gray-600 mb-6">Browse and explore your channels.</p>
          <button
            onClick={() => navigate("/user-channels")}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            View Channels
          </button>
        </div>

        {/* Dashboard Card */}
        <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center text-center">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-600 mb-6">See analytics and insights.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
