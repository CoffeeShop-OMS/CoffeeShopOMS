import { useEffect, useState } from 'react';
import {
  Coffee, Package, Calendar, Plus,
  DollarSign, AlertTriangle, TrendingUp, TrendingDown,
  PlusCircle, Trash2, ShoppingCart, RefreshCw, ArrowUpRight, X
} from 'lucide-react';

import StatCards from '../components/inventory/StatCards';
import DailyUsageGraph from '../components/dashboard/DailyUsageGraph';
import { getInventory, getInventoryLogs } from '../services/api';
import { getAuthSession } from '../utils/authStorage';
import { toast } from 'react-toastify';

export default function Dashboard({ setIsAuthenticated }) {
  const [stats, setStats] = useState({ total: 0, lowCount: 0, outCount: 0, value: 0 });
  const [alertItems, setAlertItems] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const session = getAuthSession();
      if (!session?.token) return;
      try {
        const res = await getInventory(session.token, { limit: 100 });
        const items = Array.isArray(res?.data) ? res.data : [];

        let total = items.length;
        let lowCount = 0;
        let outCount = 0;
        let value = 0;
        const alerts = [];

        items.forEach((item) => {
          const quantity = Number(item.quantity || 0);
          const threshold = Number(item.lowStockThreshold || 0);
          const costPrice = Number(item.costPrice || 0);

          if (quantity <= 0) {
            outCount += 1;
            alerts.push({ ...item, severity: 'critical' });
          } else if (quantity <= threshold) {
            lowCount += 1;
            alerts.push({ ...item, severity: 'warning' });
          }

          value += quantity * costPrice;
        });

        if (mounted) {
          // Sort by severity (critical first), then by how low they are
          const sortedAlerts = alerts.sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
            return Number(a.quantity || 0) - Number(b.quantity || 0);
          });

          setStats({ total, lowCount, outCount, value });
          setAllAlerts(sortedAlerts); // Store all alerts
          setAlertItems(sortedAlerts.slice(0, 4)); // Display only top 4
          setLastSync(new Date());
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to load inventory stats');
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 60 * 1000); // refresh every minute
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadLogs = async () => {
      setIsLoadingLogs(true);
      const session = getAuthSession();
      if (!session?.token) {
        setIsLoadingLogs(false);
        return;
      }
      try {
        const res = await getInventoryLogs(session.token, { action: 'STOCK_ADJUST', days: 7, limit: 500 });
        if (mounted) {
          setLogs(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Failed to load usage logs:', err);
        // Silently fail for logs - don't show toast
      } finally {
        if (mounted) setIsLoadingLogs(false);
      }
    };

    loadLogs();
    const interval = setInterval(loadLogs, 60 * 1000); // refresh every minute
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const formattedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="w-full p-8 bg-[#F7F4F0]">
      {/* All Alerts Modal */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-500" /> All Priority Alerts
                </h2>
                <p className="text-sm text-gray-500 mt-1">{allAlerts.length} item{allAlerts.length === 1 ? '' : 's'} need attention</p>
              </div>
              <button
                onClick={() => setShowAllAlerts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {allAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-lg text-gray-600 font-medium">✓ All inventory levels healthy</p>
                  <p className="text-sm text-gray-400 mt-1">No items below threshold</p>
                </div>
              ) : (
                allAlerts.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Current: {item.quantity}{item.unit} / Reorder: {item.lowStockThreshold}{item.unit}
                      </p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ml-4 ${
                      item.severity === 'critical'
                        ? 'bg-red-500 text-white'
                        : 'border border-gray-300 text-gray-600'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

          {/* Welcome Section (styled like InventoryHeader) */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 lg:mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h1
                  className="text-xl sm:text-2xl font-bold text-[#1C100A] tracking-tight"
                  style={{ fontFamily: "serif" }}
                >
                  {getTimeBasedGreeting()}, Manager
                </h1>
                <p className="text-xs text-[#9E8A7A] mt-0.5 hidden sm:block">Your inventory health is <span className="font-semibold text-gray-700">92%</span>. 4 items need your attention.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </button>
              <button className="flex items-center gap-2 bg-[#3D261D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A1A14] transition-colors">
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          </div>

          {/* Top Stats Cards (live data) */}
          <StatCards
            cards={[
              { icon: Package, label: 'Total Items', value: String(stats.total), sub: 'Across all categories', accent: '#3D261D', iconBg: 'bg-[#EDE4DC]', iconColor: '#3D261D' },
              { icon: DollarSign, label: 'Inventory Value', value: `₱${Number(stats.value || 0).toFixed(2)}`, sub: 'Current valuation', accent: '#059669', iconBg: 'bg-emerald-100', iconColor: '#059669' },
              { icon: AlertTriangle, label: 'Low Items', value: String(stats.lowCount), sub: 'Need attention', accent: '#DC2626', iconBg: 'bg-red-100', iconColor: '#DC2626' },
              { icon: RefreshCw, label: 'Last Sync', value: lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', sub: lastSync ? new Date(lastSync).toLocaleDateString() : '', accent: '#6B7280', iconBg: 'bg-gray-100', iconColor: '#374151' },
            ]}
          />

          {/* Middle Section - Graphs & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Big Graph - Daily Ingredient Usage */}
            <DailyUsageGraph logs={logs} isLoading={isLoadingLogs} />

            {/* Priority Alerts */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" /> Priority Alerts
                  </h3>
                  <p className="text-xs text-gray-500">Items below threshold as of today</p>
                </div>
                <button
                  onClick={() => setShowAllAlerts(true)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  View All
                </button>
              </div>
              
              <div className="flex-1 space-y-3">
                {alertItems.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-600 font-medium">✓ All inventory levels healthy</p>
                    <p className="text-[10px] text-gray-400">No items below threshold</p>
                  </div>
                ) : (
                  alertItems.map((item) => (
                    <div key={item.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-500">
                          Current: {item.quantity}{item.unit} / Reorder: {item.lowStockThreshold}{item.unit}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.severity === 'critical'
                          ? 'bg-red-500 text-white'
                          : 'border border-gray-300 text-gray-600'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] text-gray-400">
                  {allAlerts.length === 0
                    ? 'All items in stock'
                    : `${allAlerts.length} item${allAlerts.length === 1 ? '' : 's'} need attention`}
                </span>
                <ArrowUpRight className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Bottom Section - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Stock Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1">Stock Distribution</h3>
              <p className="text-xs text-gray-500 mb-6">Capacity usage by category</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Beans</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5"><div className="bg-[#4A332A] h-3.5 rounded-full" style={{width: '45%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Dairy</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5"><div className="bg-[#4A332A] h-3.5 rounded-full" style={{width: '82%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Syrups</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5"><div className="bg-[#4A332A] h-3.5 rounded-full" style={{width: '35%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Paper</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5"><div className="bg-[#4A332A] h-3.5 rounded-full" style={{width: '60%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Pastry</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5"><div className="bg-[#4A332A] h-3.5 rounded-full" style={{width: '20%'}}></div></div>
                </div>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-4 text-center">
                <div><p className="text-[10px] text-gray-400">Beans</p><p className="font-bold text-gray-900">45%</p></div>
                <div><p className="text-[10px] text-gray-400">Dairy</p><p className="font-bold text-gray-900">82%</p></div>
                <div><p className="text-[10px] text-gray-400">Syrup</p><p className="font-bold text-gray-900">35%</p></div>
              </div>
            </div>

            {/* Inventory Trends */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
              <h3 className="font-bold text-gray-900 mb-1">Inventory Trends</h3>
              <p className="text-xs text-gray-500 mb-6">Total monthly inventory valuation</p>
              
              <div className="h-40 w-full relative mb-4">
                 {/* Dotted lines */}
                 <div className="absolute inset-0 flex flex-col justify-between py-2">
                  <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
                  <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
                  <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
                  <div className="border-b border-gray-300 w-full h-0"></div>
                </div>
                {/* Line Chart SVG */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100">
                  <path d="M0,80 L20,60 L40,75 L60,30 L80,55 L100,10" fill="none" stroke="#4A332A" strokeWidth="2.5" />
                  <circle cx="0" cy="80" r="3" fill="#4A332A" />
                  <circle cx="20" cy="60" r="3" fill="#4A332A" />
                  <circle cx="40" cy="75" r="3" fill="#4A332A" />
                  <circle cx="60" cy="30" r="3" fill="#4A332A" />
                  <circle cx="80" cy="55" r="3" fill="#4A332A" />
                  <circle cx="100" cy="10" r="3" fill="#4A332A" />
                </svg>
                {/* X-Axis labels */}
                <div className="absolute top-38 left-0 right-0 flex justify-between text-[10px] text-gray-400">
                  <span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                </div>
              </div>
              
              <div className="bg-[#FAF8F5] p-3 rounded-lg flex items-center gap-3">
                <div className="bg-[#4A332A] p-1.5 rounded text-white">
                   <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Healthy Growth</p>
                  <p className="text-[10px] text-gray-500">Inventory value up 18% since Q1</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-900 mb-1">Recent Activity</h3>
              <p className="text-xs text-gray-500 mb-6">Live operational logs</p>
              
              <div className="flex-1 relative">
                {/* Vertical Line */}
                <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                
                <div className="space-y-5 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center"><PlusCircle className="w-3 h-3 text-gray-600" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Stock Added <span className="font-normal text-[10px] text-gray-400 ml-1">08:15 AM</span></p>
                      <p className="text-xs text-gray-600">20kg Brazilian Santos</p>
                      <p className="text-[10px] text-gray-400 italic">— Marco B.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-400" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Waste Logged <span className="font-normal text-[10px] text-gray-400 ml-1">10:30 AM</span></p>
                      <p className="text-xs text-gray-600">450ml Whole Milk (Exp.)</p>
                      <p className="text-[10px] text-gray-400 italic">— Sarah K.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center"><ShoppingCart className="w-3 h-3 text-gray-600" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Order Placed <span className="font-normal text-[10px] text-gray-400 ml-1">11:45 AM</span></p>
                      <p className="text-xs text-gray-600">Weekly Dairy Supply</p>
                      <p className="text-[10px] text-gray-400 italic">— System</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center"><RefreshCw className="w-3 h-3 text-gray-600" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Stock Update <span className="font-normal text-[10px] text-gray-400 ml-1">02:20 PM</span></p>
                      <p className="text-xs text-gray-600">Pastry inventory sync</p>
                      <p className="text-[10px] text-gray-400 italic">— InventoryBot</p>
                    </div>
                  </div>
                </div>
              </div>
              <button className="mt-4 text-[10px] font-semibold text-gray-500 hover:text-gray-800 text-center w-full">Load Older Logs</button>
            </div>
          </div>

          {/* Restock Banner */}
          <div className="bg-[#FAF6F4] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-[#F0EBE6]">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="bg-[#3D261D] p-3 rounded-xl">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg font-serif">Need a restock fast?</h3>
                <p className="text-sm text-gray-600">Quick-order from your top 3 suppliers in one click.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-white border border-gray-200 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Supplier Portal</button>
              <button className="bg-[#3D261D] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2A1A14] transition-colors">Create Bulk PO</button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center border-t border-gray-200 pt-6 pb-2">
            <p className="text-[11px] text-gray-400">
              © 2026 Coffee&Tea Inventory Systems. All rights reserved. | System Status: <span className="text-green-500 font-bold">Optimal</span>
            </p>
          </div>

    </div>
  );
}