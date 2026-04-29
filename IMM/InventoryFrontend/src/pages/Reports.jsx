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
} from 'recharts';
import StatCards from '../components/inventory/StatCards';
import PdfExportModal from '../components/reports/PdfExportModal';
import { getInventory, getInventoryLogs } from '../services/api';
import { getAuthSession } from '../utils/authStorage';
import { toast } from 'sonner';
import { summarizeInventoryBatches } from '../utils/inventoryBatches';
import { downloadReportsPdf, getGeneratorDisplayName } from '../utils/reportsPdf';
import { parseTimestamp } from '../utils/inventoryRealtime';

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

const escapeCsvValue = (value) => {
  const normalizedValue =
    value === null || value === undefined
      ? ''
      : value instanceof Date
        ? value.toISOString()
        : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const createCsvRow = (cells) => cells.map(escapeCsvValue).join(',');

const getReportItemStatus = (item) => {
  if (item.hasExpiredStock) return 'Expired';
  if (item.isOut) return 'Out of Stock';
  if (item.isLow) return 'Low Stock';
  return 'Healthy';
};

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

const USAGE_PERIOD_OPTIONS = [
  {
    value: 'daily',
    label: 'Daily',
    chartTitle: 'Daily stock usage',
    chartSubtitle: 'Adjustments per day - last 14 days',
    sectionTitle: 'Daily Stock Usage',
    columnLabel: 'Day',
    points: 14,
  },
  {
    value: 'weekly',
    label: 'Weekly',
    chartTitle: 'Weekly stock usage',
    chartSubtitle: 'Adjustments per week - last 12 weeks',
    sectionTitle: 'Weekly Stock Usage',
    columnLabel: 'Week',
    points: 12,
  },
  {
    value: 'monthly',
    label: 'Monthly',
    chartTitle: 'Monthly stock usage',
    chartSubtitle: 'Adjustments per month - last 12 months',
    sectionTitle: 'Monthly Stock Usage',
    columnLabel: 'Month',
    points: 12,
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    chartTitle: 'Quarterly stock usage',
    chartSubtitle: 'Adjustments per quarter - last 8 quarters',
    sectionTitle: 'Quarterly Stock Usage',
    columnLabel: 'Quarter',
    points: 8,
  },
  {
    value: 'yearly',
    label: 'Yearly',
    chartTitle: 'Yearly stock usage',
    chartSubtitle: 'Adjustments per year - last 5 years',
    sectionTitle: 'Yearly Stock Usage',
    columnLabel: 'Year',
    points: 5,
  },
];

const getUsagePeriodMeta = (period) =>
  USAGE_PERIOD_OPTIONS.find((option) => option.value === period) || USAGE_PERIOD_OPTIONS[0];

const toLogDate = (value) => {
  if (!value) return null;

  try {
    const parsed = parseTimestamp(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfWeek = (value) => {
  const date = startOfDay(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
};

const startOfMonth = (value) => new Date(value.getFullYear(), value.getMonth(), 1);

const startOfQuarter = (value) =>
  new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3, 1);

const startOfYear = (value) => new Date(value.getFullYear(), 0, 1);

const getUsageBucketStart = (value, period) => {
  const date = value instanceof Date ? value : new Date(value);

  switch (period) {
    case 'weekly':
      return startOfWeek(date);
    case 'monthly':
      return startOfMonth(date);
    case 'quarterly':
      return startOfQuarter(date);
    case 'yearly':
      return startOfYear(date);
    case 'daily':
    default:
      return startOfDay(date);
  }
};

const shiftUsageBucket = (value, period, amount) => {
  const date = new Date(value);

  switch (period) {
    case 'weekly':
      date.setDate(date.getDate() + amount * 7);
      return startOfWeek(date);
    case 'monthly':
      date.setMonth(date.getMonth() + amount, 1);
      return startOfMonth(date);
    case 'quarterly':
      date.setMonth(date.getMonth() + amount * 3, 1);
      return startOfQuarter(date);
    case 'yearly':
      date.setFullYear(date.getFullYear() + amount, 0, 1);
      return startOfYear(date);
    case 'daily':
    default:
      date.setDate(date.getDate() + amount);
      return startOfDay(date);
  }
};

const getUsageBucketKey = (date, period) => {
  switch (period) {
    case 'weekly':
      return `week-${date.toISOString().slice(0, 10)}`;
    case 'monthly':
      return `month-${date.getFullYear()}-${date.getMonth() + 1}`;
    case 'quarterly':
      return `quarter-${date.getFullYear()}-${Math.floor(date.getMonth() / 3) + 1}`;
    case 'yearly':
      return `year-${date.getFullYear()}`;
    case 'daily':
    default:
      return `day-${date.toISOString().slice(0, 10)}`;
  }
};

const formatUsageBucketLabel = (date, period) => {
  switch (period) {
    case 'weekly':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    case 'quarterly':
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    case 'yearly':
      return String(date.getFullYear());
    case 'daily':
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const buildUsageSeries = (logs, period) => {
  const meta = getUsagePeriodMeta(period);
  const currentBucketStart = getUsageBucketStart(new Date(), period);
  const buckets = [];

  for (let index = meta.points - 1; index >= 0; index -= 1) {
    const bucketStart = shiftUsageBucket(currentBucketStart, period, -index);
    buckets.push({
      key: getUsageBucketKey(bucketStart, period),
      label: formatUsageBucketLabel(bucketStart, period),
      count: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  (Array.isArray(logs) ? logs : []).forEach((log) => {
    if (log?.action !== 'STOCK_ADJUST') return;

    const logDate = toLogDate(log.createdAt || log.timestamp);
    if (!logDate) return;

    const bucketStart = getUsageBucketStart(logDate, period);
    const bucket = bucketMap.get(getUsageBucketKey(bucketStart, period));

    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets.map(({ label, count }) => ({ label, count }));
};

const fetchUsageLogs = async (token) => {
  const collectedLogs = [];
  let cursor = null;

  for (let batchIndex = 0; batchIndex < 12; batchIndex += 1) {
    const response = await getInventoryLogs(token, {
      action: 'STOCK_ADJUST',
      days: 'all',
      limit: 100,
      cursor,
    });
    const logs = Array.isArray(response?.data) ? response.data : [];

    collectedLogs.push(...logs);

    if (!response?.nextCursor || logs.length === 0) {
      break;
    }

    cursor = response.nextCursor;
  }

  return collectedLogs;
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
  const [usageLogs, setUsageLogs] = useState([]);
  const [usagePeriod, setUsagePeriod] = useState('daily');
  const [reportItems, setReportItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
        const [invRes, logsRes, usageHistoryLogs] = await Promise.all([
          getInventory(session.token, { limit: 200, status: 'all' }),
          getInventoryLogs(session.token, { days: 30, limit: 500 }),
          fetchUsageLogs(session.token),
        ]);
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
          const batchCost = Number(item.totalBatchCost);
          const value = Number.isFinite(batchCost) ? batchCost : quantity * costPrice;
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
          setUsageLogs(Array.isArray(usageHistoryLogs) ? usageHistoryLogs : []);
          setReportItems(itemStats);
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

  const selectedUsageMeta = useMemo(() => getUsagePeriodMeta(usagePeriod), [usagePeriod]);

  const usageChartData = useMemo(
    () => buildUsageSeries(usageLogs, usagePeriod),
    [usageLogs, usagePeriod]
  );

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

  const hasReportData = useMemo(
    () =>
      reportItems.length > 0 ||
      categoryPerformance.length > 0 ||
      usageChartData.some((entry) => Number(entry.count || 0) > 0),
    [categoryPerformance, reportItems, usageChartData]
  );

  const handleExportCsv = () => {
    if (isLoading) {
      toast.info('Reports are still loading. Try again in a moment.');
      return;
    }

    if (!hasReportData) {
      toast.info('No report data available to export yet.');
      return;
    }

    try {
      const exportedAt = new Date();
      const csvLines = [
        createCsvRow(['Inventory Reports Export']),
        createCsvRow(['Generated At', exportedAt.toLocaleString('en-PH')]),
        '',
        createCsvRow(['Summary']),
        createCsvRow(['Metric', 'Value']),
        createCsvRow(['Total Inventory Value', stats.totalValue.toFixed(2)]),
        createCsvRow(['Active Items', stats.activeItems]),
        createCsvRow(['Low Stock Items', stats.lowStockItems]),
        createCsvRow(['Out Of Stock Items', stats.outOfStockItems]),
        createCsvRow(['Expired Items', stats.expiredItems]),
        createCsvRow(['Items Needing Attention', stats.attentionItems]),
        createCsvRow(['Stock Turnover', stats.stockTurnover]),
        createCsvRow(['Waste Rate (%)', stats.wasteRate]),
        createCsvRow(['Health Score (%)', stats.healthScore]),
        '',
        createCsvRow(['Item Details']),
        createCsvRow([
          'Item Name',
          'Category',
          'Quantity',
          'Low Stock Threshold',
          'Cost Price',
          'Inventory Value',
          'Adjustment Count',
          'Status',
        ]),
        ...reportItems.map((item) =>
          createCsvRow([
            item.name,
            item.category,
            item.quantity,
            item.threshold,
            item.costPrice.toFixed(2),
            item.value.toFixed(2),
            item.adjustmentCount,
            getReportItemStatus(item),
          ])
        ),
        '',
        createCsvRow(['Category Performance']),
        createCsvRow(['Category', 'Items', 'Quantity', 'Value', 'Value Share (%)']),
        ...categoryPerformance.map((category) =>
          createCsvRow([
            category.category,
            category.items,
            category.quantity,
            Number(category.value || 0).toFixed(2),
            category.percent,
          ])
        ),
        '',
        createCsvRow([selectedUsageMeta.sectionTitle]),
        createCsvRow([selectedUsageMeta.columnLabel, 'Adjustments']),
        ...usageChartData.map((entry) => createCsvRow([entry.label, entry.count])),
        '',
        createCsvRow(['Top Moving Items']),
        createCsvRow(['Item Name', 'Category', 'Adjustment Count', 'Quantity']),
        ...topMoving.map((item) =>
          createCsvRow([item.name, item.category, item.adjustmentCount, item.quantity])
        ),
        '',
        createCsvRow(['Slow Moving Items']),
        createCsvRow(['Item Name', 'Category', 'Adjustment Count', 'Quantity']),
        ...slowMoving.map((item) =>
          createCsvRow([item.name, item.category, item.adjustmentCount, item.quantity])
        ),
        '',
        createCsvRow(['Needs Attention']),
        createCsvRow(['Item Name', 'Category', 'Quantity', 'Threshold', 'Status']),
        ...needsAttention.map((item) =>
          createCsvRow([
            item.name,
            item.category,
            item.quantity,
            item.threshold,
            getReportItemStatus(item),
          ])
        ),
      ];

      const blob = new Blob([`\uFEFF${csvLines.join('\r\n')}`], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileDate = exportedAt.toISOString().slice(0, 10);

      link.href = url;
      link.download = `inventory-reports-${fileDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Reports CSV exported successfully');
    } catch (error) {
      console.error('Failed to export reports CSV:', error);
      toast.error('Failed to export reports CSV');
    }
  };

  const handleOpenPdfModal = () => {
    if (isLoading) {
      toast.info('Reports are still loading. Try again in a moment.');
      return;
    }

    if (!hasReportData) {
      toast.info('No report data available to export yet.');
      return;
    }

    setIsPdfModalOpen(true);
  };

  const handleExportPdf = async (mode) => {
    const session = getAuthSession();

    setIsGeneratingPdf(true);

    try {
      await downloadReportsPdf({
        mode,
        stats,
        reportItems,
        categoryPerformance,
        usageData: usageChartData,
        usageMeta: selectedUsageMeta,
        topMoving,
        slowMoving,
        needsAttention,
        generatedBy: getGeneratorDisplayName(session),
        generatedEmail: session?.email || '',
      });

      toast.success('Reports PDF exported successfully');
      setIsPdfModalOpen(false);
    } catch (error) {
      console.error('Failed to export reports PDF:', error);
      toast.error('Failed to export reports PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F4F0] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
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

        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading}
            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleOpenPdfModal}
            disabled={isGeneratingPdf}
            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#3D261D] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#2A1A14] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>

      <StatCards cards={reportStatCards} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 mb-4 sm:mb-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 lg:col-span-3">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp className="w-4 h-4 text-[#3D261D]" />
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {selectedUsageMeta.chartTitle}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {USAGE_PERIOD_OPTIONS.map((option) => {
                const isActive = option.value === usagePeriod;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUsagePeriod(option.value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#3D261D] text-white'
                        : 'bg-[#F6F1EC] text-[#6F5C50] hover:bg-[#EDE4DC]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">{selectedUsageMeta.chartSubtitle}</p>

          {isLoading ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400">
              Loading...
            </div>
          ) : usageChartData.every((entry) => Number(entry.count || 0) === 0) ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400 text-center px-4">
              No stock adjustment records found for this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <AreaChart data={usageChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe6" vertical={false} />
                <XAxis
                  dataKey="label"
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

        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 lg:col-span-2">
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
            <>
              <ResponsiveContainer width="100%" height={180}>
              <RechartsPie>
                <Pie
                  data={categoryPerformance}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
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
              </RechartsPie>
            </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryPerformance.map((entry, index) => (
                  <div key={entry.category} className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-[11px] text-[#5a4a40] truncate">{entry.category}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 lg:col-span-1">
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
                margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
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
                  width={68}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill={BRAND} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
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

        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 lg:col-span-3">
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

        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 lg:col-span-2 flex flex-col">
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

      <PdfExportModal
        open={isPdfModalOpen}
        isGenerating={isGeneratingPdf}
        onClose={() => setIsPdfModalOpen(false)}
        onSelect={handleExportPdf}
      />
    </div>
  );
}
