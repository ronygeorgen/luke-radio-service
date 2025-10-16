import React from "react";
import { TrendingUp } from "lucide-react";
import { useSelector } from "react-redux";

const SentimentByShiftChart = () => {
  const shiftAnalytics = useSelector((state) => state.shiftAnalytics.data);

  if (!shiftAnalytics || !shiftAnalytics.sentimentByShift) {
    return <div>Loading sentiment data...</div>;
  }

  const data = Array.isArray(shiftAnalytics.sentimentByShift)
    ? shiftAnalytics.sentimentByShift.map((d) => ({
        shift: d.shift,
        value: Number(d.value) || 0,
      }))
    : [];

  if (data.length === 0) return <div>No sentiment data</div>;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 240; // px chart area height

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Sentiment by Shift</h3>
      </div>

      <div className="flex gap-4">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between items-end pr-3" style={{ height: chartHeight }}>
          {[maxValue, (maxValue * 3) / 4, maxValue / 2, maxValue / 4, 0].map((val, idx) => (
            <div key={idx} className="text-xs text-gray-500">
              {Math.round(val)}
            </div>
          ))}
        </div>

        {/* Bars container */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-gray-100" />
            ))}
          </div>

          {/* Bars */}
          <div
            className="flex justify-around items-end relative z-10 h-full px-2"
            style={{ height: chartHeight }}
          >
            {data.map((d, i) => {
              const height = (d.value / maxValue) * (chartHeight - 30); // 30px reserved for top text
              return (
                <div key={i} className="flex flex-col items-center w-24">
                  <div className="text-sm text-gray-700 font-medium mb-1">{d.value}</div>

                  {/* Bar itself */}
                  <div
                    className="w-full bg-gray-900 rounded-md transition-all duration-300"
                    style={{
                      height: `${height}px`,
                      minHeight: "4px", // ensures small values still visible
                    }}
                    title={`${d.shift}: ${d.value}`}
                  />

                  {/* Label with tooltip */}
                  <div className="mt-2 w-full">
                    <div className="group relative">
                      <div className="text-xs text-gray-500 truncate text-center" title={d.shift}>
                        {d.shift}
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                          {d.shift}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis baseline (0 line) */}
          <div
            className="absolute left-0 right-0 border-t border-gray-300"
            style={{ bottom: 0, height: 0 }}
          />
        </div>
      </div>
    </div>
  );
};

export default SentimentByShiftChart;
