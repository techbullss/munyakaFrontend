"use client";

import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CubeIcon,
  TruckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  CogIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
type MonthlySalesData = {
  month: string;
  sales: number;
};

type SalesSummary = {
  totalSales: number;
  todaySales: number;
  monthlySales: number;
  salesChange: number;
  monthlyBreakdown?: MonthlySalesData[];
};

type RecentActivity = {
  type: string;
  message: string;
  details: string;
  amount: string;
  time: string;
};

type TopProduct = {
  productName: string;
  totalSold: number;
  totalRevenue: number;
};

type DashboardDTO = {
  salesSummary: SalesSummary;
  recentActivities: RecentActivity[];
  topProducts: TopProduct[];
  quickStats: Record<string, any>;
};

export default function Dashboard() {
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:8080/api/dashboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data: DashboardDTO = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  //  Loading State
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );

  //  Error State
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );

  //  Stats section
  const stats = [
    {
      title: "Total Sales",
      value: formatCurrency(dashboardData?.salesSummary.totalSales),
      change: `ksh ${dashboardData?.salesSummary.salesChange ?? 0}%`,
      icon: BanknotesIcon,
      color: "green",
    },
    
    {
      title: "Inventory Items",
      value: dashboardData?.quickStats.totalSales ?? "0",
      change: "-3%",
      icon: CubeIcon,
      color: "purple",
    },
    {
      title: "Today's Sales",
      value: formatCurrency(dashboardData?.salesSummary.todaySales),
      change: "+4%",
      icon: ShoppingCartIcon,
      color: "orange",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name || "User"} 👋
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const color =
            stat.color === "green"
              ? "text-green-600 bg-green-100"
              : stat.color === "blue"
              ? "text-blue-600 bg-blue-100"
              : stat.color === "purple"
              ? "text-purple-600 bg-purple-100"
              : "text-orange-600 bg-orange-100";
          return (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <div
                    className={`inline-flex items-center px-2 py-1 mt-2 rounded-full text-xs font-medium ${
                      stat.change.startsWith("+")
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                    {stat.change} from last month
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Sales Overview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Sales Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Sales Overview
            </h2>
            <p className="text-sm text-gray-600">
              Monthly Sales:{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(dashboardData?.salesSummary.monthlySales)}
              </span>
            </p>
          </div>
          <div className="h-64">
  {dashboardData?.salesSummary?.monthlyBreakdown ? (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dashboardData.salesSummary.monthlyBreakdown}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={(date) => date.slice(8, 10)} // show day only
        />
        <YAxis />
        <Tooltip formatter={(value) => `KSh ${value}`} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-full border border-dashed border-gray-200 rounded-lg bg-gray-50">
      <ChartBarIcon className="h-10 w-10 text-gray-400 mb-2" />
      <p className="text-gray-500 text-sm">No sales data available</p>
    </div>
  )}
</div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {dashboardData?.recentActivities?.map((activity, i) => (
              <div
                key={i}
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div
                  className={`p-2 rounded-lg ${
                    activity.type === "sale"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  {activity.details && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.details}
                    </p>
                  )}
                  {activity.amount && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {activity.amount}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Top Selling Products
        </h2>
        <div className="space-y-3">
          {dashboardData?.topProducts?.map((product, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {product.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.totalSold} units sold
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(product.totalRevenue)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
