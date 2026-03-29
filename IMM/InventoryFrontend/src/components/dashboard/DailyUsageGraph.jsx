import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getDayLabel = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(date).getDay()];
};

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({ date: dateStr, label: getDayLabel(dateStr) });
  }
  return days;
};

const aggregateDailyUsage = (logs) => {
  if (!logs || logs.length === 0) {
    return getLast7Days().map((d) => ({ ...d, usage: 0 }));
  }

  const last7Days = getLast7Days();
  const aggregated = {};

  // Initialize all 7 days with 0 usage
  last7Days.forEach((day) => {
    aggregated[day.date] = 0;
  });

  // Sum negative adjustments (consumption) by date for ALL ingredients
  logs.forEach((log) => {
    if (log.action === 'STOCK_ADJUST' && log.details?.adjustment < 0) {
      const timestamp = log.timestamp;
      let dateStr = null;

      // Handle different timestamp formats
      if (typeof timestamp?.toDate === 'function') {
        dateStr = timestamp.toDate().toISOString().split('T')[0];
      } else if (typeof timestamp === 'object' && (timestamp._seconds || timestamp.seconds)) {
        dateStr = new Date((timestamp._seconds || timestamp.seconds) * 1000).toISOString().split('T')[0];
      } else if (typeof timestamp === 'string') {
        dateStr = timestamp.split('T')[0];
      }

      if (dateStr && aggregated.hasOwnProperty(dateStr)) {
        // Sum absolute value of negative adjustments
        aggregated[dateStr] += Math.abs(log.details.adjustment);
      }
    }
  });

  // Return data in chronological order with labels
  return last7Days.map((day) => ({
    date: day.date,
    label: day.label,
    usage: aggregated[day.date],
  }));
};

export default function DailyUsageGraph({ logs = [], isLoading = false }) {
  const chartData = aggregateDailyUsage(logs);
  const maxUsage = Math.max(...chartData.map((d) => d.usage), 24);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-gray-900">Daily Ingredient Usage</h3>
          <p className="text-xs text-gray-500">Volume of all ingredients consumed past 7 days</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -35, bottom: 20 }}
          >
            <defs>
              <linearGradient id="gradientBrown" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3D261D" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3D261D" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              domain={[0, Math.ceil(maxUsage / 5) * 5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
              formatter={(value) => [value.toFixed(2), 'Total Usage']}
            />
            <Area
              type="monotone"
              dataKey="usage"
              stroke="#3D261D"
              strokeWidth={2}
              fill="url(#gradientBrown)"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
