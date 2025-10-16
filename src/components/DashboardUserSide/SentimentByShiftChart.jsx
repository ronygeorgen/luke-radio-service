import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useSelector } from 'react-redux';

export default function SentimentByShiftChart() {
  const shiftAnalytics = useSelector((state) => state.shiftAnalytics.data);
  const data = shiftAnalytics?.sentimentByShift?.map(item => ({ name: item.shift, value: Math.round(item.value) })) || [];
  return (
    <div className="bg-white shadow-md rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-800">
          Sentiment by Shift
        </h2>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
            barCategoryGap="25%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              tick={{ fontSize: 12, fill: "#555" }}
              tickLine={false}
              axisLine={{ stroke: "#ccc" }}
              height={60}
              tickFormatter={(value) =>
                value.length > 12 ? value.slice(0, 12) + "..." : value
              }
            />
            <YAxis
              domain={[0, "dataMax + 10"]}
              tick={{ fontSize: 12, fill: "#555" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.85)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value, name, props) => [value, props.payload.name]}
            />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              fill="#0f172a"
              maxBarSize={80}
            >
              <LabelList
                dataKey="value"
                position="top"
                style={{ fill: "#333", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
