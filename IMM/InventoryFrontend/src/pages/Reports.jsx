import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Activity,
  ShoppingCart,
  CheckCircle,
  Zap,
  BarChart2,
  PieChart,
  Clock3,
  Package,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCards from '../components/inventory/StatCards';
import { getInventory, getInventoryLogs } from '../services/api';
import { getAuthSession } from '../utils/authStorage';
import { toast } from 'react-toastify';
import { summarizeInventoryBatches } from '../utils/inventoryBatches';

const BRAND = '#3D261D';
const PESO_SYMBOL = '\u20B1';
const CATEGORY_COLORS = [
  '#3D261D',
  '#7B5C4F',
  '#B4896F',
  '#D4B5A0',
  '#EDD8C8',
  '#C5A68D',
  '#9A7060',
];

const formatCurrency = (value) =>
  `${PESO_SYMBOL}${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase().replace(/[-_\s]+/g, '');
  const map = {
    beans: 'Beans',
    milk: 'Milk',
    dairy: 'Milk',
    syrup: 'Syrup',
    syrups: 'Syrup',
    packaging: 'Cups',
    cup: 'Cups',
    cups: 'Cups',
    paper: 'Cups',
    papers: 'Cups',
    pastry: 'Pastries',
    pastries: 'Pastries',
    equipment: 'Equipment',
    addins: 'Add-ins',
    powder: 'Powder',
    other: 'Other',
  };

  return map[raw] || 'Other';
};

const getAttentionRank = (item) => {
  if (item.hasExpiredStock) return 0;
  if (item.isOut) return 1;
  if (item.isLow) return 2;
  return 3;
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-[#3D261D]">{payload[0].value} adjustments</p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-[#3D261D]">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-[#3D261D]">{payload[0].name}</p>
      <p className="text-gray-500">{formatCurrency(payload[0].value)}</p>
      <p className="text-gray-400">{payload[0].payload.percent}%</p>
    </div>
  );
};

export default function Reports({ setIsAuthenticated }) {
  const [stats, setStats] = useState({
    totalValue: 0,
    totalItems: 0,
    stockTurnover: 0,
    wasteRate: 0,
    healthScore: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiredItems: 0,
    attentionItems: 0,
    activeItems: 0,
  });
  const [topMoving, setTopMoving] = useState([]);
  const [slowMoving, setSlowMoving] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [dailyUsage, setDailyUsage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadReports = async () => {
      setIsLoading(true);
      const session = getAuthSession();
      if (!session?.token) {
        setIsLoading(false);
        return;
      }

      try {
        const invRes = await getInventory(session.token, { limit: 200, status: 'all' });
        const logsRes = await getInventoryLogs(session.token, { days: 30, limit: 500 });
        const items = Array.isArray(invRes?.data) ? invRes.data : [];
        const logs = Array.isArray(logsRes?.data) ? logsRes.data : [];
        if (!mounted) return;

        let totalValue = 0;
        let activeCount = 0;
        let lowCount = 0;
        let outCount = 0;
        let expiredCount = 0;
        let attentionCount = 0;
        let wasteCount = 0;

        const categoryMap = {};
        const itemStats = [];

        items.forEach((item) => {
          if ((item.status || 'active') === 'deleted') return;

          activeCount += 1;

          const quantity = Number(item.quantity || 0);
          const threshold = Number(item.lowStockThreshold || 0);
          const costPrice = Number(item.costPrice || 0);
          const value = quantity * costPrice;
          const batchSummary = summarizeInventoryBatches(item);
          const hasExpiredStock = batchSummary.hasExpiredStock;
          const isOut = quantity <= 0;
          const isLow = !isOut && quantity <= threshold;

          totalValue += value;

          if (isOut) {
            outCount += 1;
            wasteCount += 1;
          } else if (isLow) {
            lowCount += 1;
          }

          if (hasExpiredStock) {
            expiredCount += 1;
          }

          if (isOut || isLow || hasExpiredStock) {
            attentionCount += 1;
          }

          const category = normalizeCategory(item.category);
          if (!categoryMap[category]) {
            categoryMap[category] = { count: 0, value: 0, quantity: 0 };
          }

          categoryMap[category].count += 1;
          categoryMap[category].value += value;
          categoryMap[category].quantity += quantity;

          const adjustmentCount = logs.filter(
            (log) => log.itemId === item.id && log.action === 'STOCK_ADJUST'
          ).length;

          itemStats.push({
            id: item.id,
            name: item.name,
            category,
            quantity,
            threshold,
            costPrice,
            value,
            adjustmentCount,
            isLow,
            isOut,
            hasExpiredStock,
          });
        });

        const totalActiveItems = activeCount;
        const healthScore =
          totalActiveItems === 0
            ? 100
            : Math.round(((totalActiveItems - attentionCount) / totalActiveItems) * 100);
        const stockTurnover =
          totalActiveItems > 0
            ? Number(
                (
                  logs.filter((log) => log.action === 'STOCK_ADJUST').length / totalActiveItems
                ).toFixed(1)
              )
            : 0;
        const wasteRate =
          totalActiveItems > 0 ? Number(((wasteCount / totalActiveItems) * 100).toFixed(1)) : 0;

        const dayMap = {};
        const today = new Date();
        for (let i = 13; i >= 0; i -= 1) {
          const day = new Date(today);
          day.setDate(today.getDate() - i);
          const key = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dayMap[key] = 0;
        }

        logs.forEach((log) => {
          if (log.action !== 'STOCK_ADJUST') return;
          const day = new Date(log.createdAt || log.timestamp);
          const key = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (key in dayMap) {
            dayMap[key] += 1;
          }
        });

        const dailyData = Object.entries(dayMap).map(([day, count]) => ({ day, count }));
        const topMovers = [...itemStats]
          .sort((first, second) => second.adjustmentCount - first.adjustmentCount)
          .slice(0, 5);
        const slowMovers = itemStats
          .filter((item) => !item.isOut)
          .sort((first, second) => first.adjustmentCount - second.adjustmentCount)
          .slice(0, 5);
        const attentionList = itemStats
          .filter((item) => item.hasExpiredStock || item.isLow || item.isOut)
          .sort((first, second) => {
            const rankDiff = getAttentionRank(first) - getAttentionRank(second);
            if (rankDiff !== 0) return rankDiff;
            return first.quantity - second.quantity;
          })
          .slice(0, 5);

        const categoryPerf = Object.entries(categoryMap)
          .map(([category, data]) => ({
            category,
            items: data.count,
            value: data.value,
            quantity: data.quantity,
            percent: totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0,
          }))
          .sort((first, second) => second.value - first.value);

        if (mounted) {
          setStats({
            totalValue,
            totalItems: totalActiveItems,
            stockTurnover,
            wasteRate,
            healthScore,
            lowStockItems: lowCount,
            outOfStockItems: outCount,
            expiredItems: expiredCount,
            attentionItems: attentionCount,
            activeItems: totalActiveItems,
          });
          setTopMoving(topMovers);
          setSlowMoving(slowMovers);
          setNeedsAttention(attentionList);
          setCategoryPerformance(categoryPerf);
          setDailyUsage(dailyData);
        }
      } catch (error) {
        console.error('Failed to load reports:', error);
        toast.error('Failed to load inventory reports');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadReports();
    return () => {
      mounted = false;
    };
  }, []);

  const healthColor =
    stats.healthScore >= 75 ? '#059669' : stats.healthScore >= 50 ? '#F59E0B' : '#DC2626';
  const maxAdjust = topMoving[0]?.adjustmentCount || 1;

  const reportStatCards = useMemo(() => {
    const healthTone =
      stats.healthScore >= 75
        ? { accent: '#059669', iconBg: 'bg-emerald-100', iconColor: '#059669' }
        : stats.healthScore >= 50
          ? { accent: '#D97706', iconBg: 'bg-amber-100', iconColor: '#D97706' }
          : { accent: '#DC2626', iconBg: 'bg-red-100', iconColor: '#DC2626' };

    return [
      {
        icon: DollarSign,
        label: 'Total Value',
        value: formatCurrency(stats.totalValue),
        sub: `${stats.totalItems} active items`,
        accent: '#059669',
        iconBg: 'bg-emerald-100',
        iconColor: '#059669',
      },
      {
        icon: Package,
        label: 'Active Items',
        value: String(stats.activeItems || 0),
        sub: 'Tracked in reports',
        accent: '#3D261D',
        iconBg: 'bg-[#EDE4DC]',
        iconColor: '#3D261D',
      },
      {
        icon: Clock3,
        label: 'Expired Items',
        value: String(stats.expiredItems || 0),
        sub: 'Need disposal or review',
        accent: '#E11D48',
        iconBg: 'bg-rose-100',
        iconColor: '#E11D48',
      },
      {
        icon: AlertTriangle,
        label: 'Low Stock',
        value: String(stats.lowStockItems || 0),
        sub: 'Need attention',
        accent: '#B45309',
        iconBg: 'bg-amber-100',
        iconColor: '#B45309',
      },
      {
        icon: TrendingDown,
        label: 'Out Of Stock',
        value: String(stats.outOfStockItems || 0),
        sub: 'Reorder now',
        accent: '#DC2626',
        iconBg: 'bg-red-100',
        iconColor: '#DC2626',
      },
      {
        icon: RefreshCw,
        label: 'Stock Turnover',
        value: `${stats.stockTurnover}x`,
        sub: 'Adjustments per item',
        accent: '#64748B',
        iconBg: 'bg-slate-100',
        iconColor: '#475569',
      },
      {
        icon: Activity,
        label: 'Health Score',
        value: `${stats.healthScore}%`,
        sub: `${stats.attentionItems || 0} items need attention`,
        accent: healthTone.accent,
        iconBg: healthTone.iconBg,
        iconColor: healthTone.iconColor,
      },
    ];
  }, [
    stats.activeItems,
    stats.attentionItems,
    stats.expiredItems,
    stats.healthScore,
    stats.lowStockItems,
    stats.outOfStockItems,
    stats.stockTurnover,
    stats.totalItems,
    stats.totalValue,
  ]);

  return (
    <div className="w-full p-6 lg:p-8 bg-[#F7F4F0] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold text-[#1C100A] tracking-tight"
            style={{ fontFamily: 'serif' }}
          >
            Inventory reports
          </h1>
          <p className="text-xs text-[#9E8A7A] mt-1">
            Deep-dive analysis of stock performance and waste tracking
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-[#3D261D] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#2A1A14] transition-colors">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>

      <StatCards cards={reportStatCards} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#3D261D]" />
            <h3 className="font-semibold text-gray-900 text-sm">Daily stock usage</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Adjustments per day - last 14 days</p>

          {isLoading ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <AreaChart data={dailyUsage} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe6" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#9E8A7A' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9E8A7A' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={BRAND}
                  strokeWidth={1.5}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: BRAND }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-[#3D261D]" />
            <h3 className="font-semibold text-gray-900 text-sm">Category split</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Value by category</p>

          {isLoading ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400">
              Loading...
            </div>
          ) : categoryPerformance.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <RechartsPie>
                <Pie
                  data={categoryPerformance}
                  dataKey="value"
                  nameKey="category"
                  cx="40%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={76}
                  paddingAngle={2}
                >
                  {categoryPerformance.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="square"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: '#5a4a40' }}>{value}</span>
                  )}
                />
              </RechartsPie>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-[#3D261D]" />
            <h3 className="font-semibold text-gray-900 text-sm">Category value</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Inventory value ({PESO_SYMBOL}) per category</p>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart
                data={categoryPerformance}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barSize={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#9E8A7A' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${PESO_SYMBOL}${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10, fill: '#5a4a40' }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill={BRAND} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Top moving items</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Most frequently adjusted</p>

          {isLoading ? (
            <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
          ) : topMoving.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">No data yet</div>
          ) : (
            <div className="space-y-3">
              {topMoving.map((item, index) => (
                <div key={item.id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-medium text-gray-800 truncate max-w-[60%]">
                      {index + 1}. {item.name}
                    </p>
                    <span className="text-xs font-semibold text-emerald-600">
                      {item.adjustmentCount} moves
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.adjustmentCount / maxAdjust) * 100}%`,
                        background: BRAND,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Needs attention</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Expired, low, or out-of-stock items</p>

          {isLoading ? (
            <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
          ) : needsAttention.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">All items look healthy</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {needsAttention.map((item) => {
                const badge = item.hasExpiredStock
                  ? { label: 'EXPIRED', tone: 'bg-rose-100 text-rose-700' }
                  : item.isOut
                    ? { label: 'OUT', tone: 'bg-red-100 text-red-700' }
                    : { label: 'LOW', tone: 'bg-amber-100 text-amber-700' };

                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="min-w-0 mr-3">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.quantity}/{item.threshold} {item.category}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.tone}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Slow moving items</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Least adjusted - consider reviewing stock levels
          </p>

          {isLoading ? (
            <div className="text-center py-4 text-sm text-gray-400">Loading...</div>
          ) : slowMoving.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-400">No data yet</div>
          ) : (
            <div className="space-y-2">
              {slowMoving.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-amber-900 truncate">
                      {index + 1}. {item.name}
                    </p>
                    <p className="text-[10px] text-amber-600">
                      {item.category} | Stock: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 flex-shrink-0 ml-3">
                    {item.adjustmentCount} moves
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Stock health</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Current inventory status</p>

          <div className="flex-1 space-y-3">
            {[
              {
                label: 'Active items',
                value: stats.activeItems,
                sub: 'Healthy stock',
                bg: '#E6F9F1',
                border: '#86efac',
                text: '#065f46',
                sub2: '#047857',
              },
              {
                label: 'Expired items',
                value: stats.expiredItems,
                sub: 'Need disposal',
                bg: '#FDE8EF',
                border: '#FDA4AF',
                text: '#9F1239',
                sub2: '#BE123C',
              },
              {
                label: 'Low stock',
                value: stats.lowStockItems,
                sub: 'Need attention',
                bg: '#FAEEDA',
                border: '#fcd34d',
                text: '#78350f',
                sub2: '#92400e',
              },
              {
                label: 'Out of stock',
                value: stats.outOfStockItems,
                sub: 'Reorder now',
                bg: '#FCEBEB',
                border: '#fca5a5',
                text: '#7f1d1d',
                sub2: '#991b1b',
              },
            ].map(({ label, value, sub, bg, border, text, sub2 }) => (
              <div
                key={label}
                className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: bg, border: `0.5px solid ${border}` }}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: sub2 }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: sub2 }}>
                    {sub}
                  </p>
                </div>
                <p className="text-2xl font-bold" style={{ color: text }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Overall health</p>
            <p className="text-sm font-bold" style={{ color: healthColor }}>
              {stats.healthScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="text-center border-t border-gray-200 pt-5 pb-2">
        <p className="text-[11px] text-gray-400">
          Copyright 2026 Coffee&Tea Inventory Systems | System status:{' '}
          <span className="text-emerald-500 font-medium">Optimal</span>
        </p>
      </div>
    </div>
  );
}
