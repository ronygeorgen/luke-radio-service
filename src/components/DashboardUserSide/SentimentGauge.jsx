import { useMemo } from "react";
import { useDashboard } from "../../hooks/useDashboard";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const SentimentGauge = () => {
  const { stats = {}, loading } = useDashboard();

  // Normalize and clamp to 0–100
  const raw = stats?.avgSentimentScore ?? 0;
  const value = loading ? 0 : clamp(Number(raw) || 0, 0, 100);
  const display = Math.round(value);

  // Map 0..100 -> -90..+90 degrees (left to right)
  const angle = useMemo(() => value * 1.8 - 90, [value]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
        Average Sentiment
      </h3>

      <div className="flex flex-col items-center">
        {/* Gauge */}
        <svg viewBox="0 0 200 120" className="w-56 h-36">
          {/* Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgb(229 231 235)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Progress (exactly proportional to value) */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${value} 100`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
          {/* Needle pivoted at center (100,100) */}
          <g transform={`rotate(${angle} 100 100)`} style={{ transition: "transform 600ms ease" }}>
            <line
              x1="100" y1="100" x2="100" y2="30"
              stroke="#111827" strokeWidth="3" strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="3" fill="#111827" />
          </g>
        </svg>

        {/* Low / High labels */}
        <div className="flex justify-between w-full text-sm text-gray-600 mt-2">
          <div className="text-center">
            <div>Low</div>
            <div className="text-gray-500">0</div>
          </div>
          <div className="text-center">
            <div>High</div>
            <div className="text-gray-500">100</div>
          </div>
        </div>

        {/* Value */}
        <div className="text-center mt-4">
          <p className="text-3xl font-bold text-green-500 leading-none">{display}</p>
          <p className="text-sm text-gray-600 mt-1">Average {display}</p>
        </div>
      </div>
    </div>
  );
};

export default SentimentGauge;
