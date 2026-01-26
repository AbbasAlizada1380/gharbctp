import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaChartLine,
  FaCalendarAlt,
  FaSync,
  FaBoxOpen,
  FaWallet,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaFileExcel,
  FaFilePdf,
  FaUsers,
  FaUserTie,
  FaShoppingCart,
  FaReceipt,
  FaBox,
  FaChartBar,
  FaDatabase,
  FaCogs,
  FaIndustry,
  FaStore,
  FaUserCheck,
  FaUserClock,
  FaPercentage,
  FaProductHunt
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DashboardHome = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [reportType, setReportType] = useState("all");
  const { currentUser } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("summary");

  const fetchReportData = async (start = null, end = null, type = "all") => {
    try {
      setLoading(true);
      const params = { reportType: type };
      if (start) params.startDate = start.toISOString().split("T")[0];
      if (end) params.endDate = end.toISOString().split("T")[0];

      const response = await axios.get(`${BASE_URL}/report`, { params });
      if (response.data.success) {
        setReportData(response.data.report);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(response.data.message || "خطا در دریافت اطلاعات");
      }
    } catch (err) {
      setError(err.response?.data?.message || "خطا در دریافت اطلاعات");
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fa-AF").format(Math.round(amount)) + " افغانی";
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("fa-AF").format(Math.round(number));
  };

  const handleDateFilter = () => {
    fetchReportData(startDate, endDate, reportType);
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setReportType("all");
    fetchReportData(null, null, "all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">در حال دریافت اطلاعات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => fetchReportData()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <FaSync />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const { summary, financial, customers, staff, inventory, system } = reportData;

  // Navigation Tabs
  const tabs = [
    { id: "summary", label: "خلاصه", icon: FaChartBar },
    { id: "financial", label: "مالی", icon: FaMoneyBillWave },
    { id: "customers", label: "مشتریان", icon: FaUsers },
    { id: "staff", label: "کارمندان", icon: FaUserTie },
    { id: "inventory", label: "انبار", icon: FaBox },
    { id: "system", label: "سیستم", icon: FaDatabase },
  ];

  // Summary Stats Cards
  const summaryCards = [
    {
      title: "درآمد کل",
      value: formatCurrency(summary.financial.totalIncome),
      icon: FaMoneyBillWave,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      description: "مجموع دریافتی‌ها",
    },
    {
      title: "هزینه‌ها",
      value: formatCurrency(summary.financial.totalExpenses),
      icon: FaReceipt,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      description: "مجموع مخارج",
    },
    {
      title: "سود خالص",
      value: formatCurrency(summary.financial.netProfit),
      icon: FaChartLine,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      description: "درآمد منهای هزینه",
    },
    {
      title: "نقدینگی",
      value: formatCurrency(summary.financial.cashOnHand),
      icon: FaWallet,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      description: "موجودی نقدی",
    },
    {
      title: "مشتریان",
      value: formatNumber(summary.operations.totalCustomers),
      icon: FaUsers,
      color: "bg-gradient-to-r from-cyan-500 to-cyan-600",
      description: "تعداد مشتریان",
    },
    {
      title: "سفارشات",
      value: formatNumber(summary.operations.totalOrders),
      icon: FaShoppingCart,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      description: "تعداد سفارشات",
    },
    {
      title: "کارمندان",
      value: formatNumber(summary.operations.totalStaff),
      icon: FaUserTie,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      description: "تعداد کارمندان",
    },
    {
      title: "موجودی انبار",
      value: formatCurrency(summary.operations.inventoryValue),
      icon: FaBox,
      color: "bg-gradient-to-r from-teal-500 to-teal-600",
      description: "ارزش موجودی",
    },
  ];

  // Render Content Based on Active Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              >
                <div className={`${card.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <card.icon className="text-2xl opacity-90" />
                    <span className="text-sm font-semibold">{card.title}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    {card.value}
                  </div>
                  <p className="text-gray-600 text-sm">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            {/* Financial Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaChartBar className="text-cyan-600" />
                خلاصه مالی
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 font-semibold">مجموع دریافتی از مالکین</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(financial.totals.totalMoney)}</p>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-green-700">محاسبه‌ای: {formatCurrency(financial.totals.calculatedMoney)}</span>
                    <span className="text-green-700">دستی: {formatCurrency(financial.totals.manualMoney)}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-semibold">مجموع دریافتی از مشتریان</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(financial.totals.totalReceipts)}</p>
                  <p className="text-blue-700 text-sm mt-1">{financial.count.receipts} تراکنش</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <p className="text-red-800 font-semibold">مجموع هزینه‌ها</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(financial.totals.totalExpenses)}</p>
                  <p className="text-red-700 text-sm mt-1">{financial.count.expenses} تراکنش</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-800 font-semibold">گردش نقدی</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(financial.totals.netCashFlow)}</p>
                  <p className="text-purple-700 text-sm mt-1">{financial.totals.netCashFlow > 0 ? "مثبت" : "منفی"}</p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaReceipt className="text-green-600" />
                  آخرین دریافتی‌ها
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {financial.breakdown.receipts.slice(0, 10).map((receipt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{receipt.customer}</p>
                        <p className="text-sm text-gray-500">{new Date(receipt.date).toLocaleDateString('fa-IR')}</p>
                      </div>
                      <span className="font-bold text-green-600">{formatCurrency(receipt.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaMoneyBillWave className="text-red-600" />
                  آخرین هزینه‌ها
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {financial.breakdown.expenses.slice(0, 10).map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{expense.purpose}</p>
                        <p className="text-sm text-gray-500">توسط {expense.by}</p>
                      </div>
                      <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "customers":
        return (
          <div className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <FaUsers className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">کل مشتریان</p>
                    <p className="text-2xl font-bold text-gray-800">{formatNumber(customers.totals.totalCustomers)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">فعال: {customers.totals.activeCustomers}</span>
                  <span className="text-red-600">غیرفعال: {customers.totals.inactiveCustomers}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FaShoppingCart className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">ارزش سفارشات</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(customers.totals.totalOrdersValue)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{customers.count.orders} سفارش</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FaClock className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">مانده حساب</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(customers.totals.pendingAmount)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{customers.count.pendingOrders} سفارش در انتظار</p>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 mb-4">مشتریان برتر</h4>
              <div className="space-y-4">
                {customers.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                        {customer.customerName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{customer.customerName || "مشتری ناشناس"}</p>
                        <p className="text-sm text-gray-500">{customer.orderCount} سفارش</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-6">
            {/* Staff Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <FaUserTie className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">کارمندان</h4>
                    <p className="text-sm text-gray-500">آمار کارمندان و حقوق</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">تعداد کارمندان:</span>
                    <span className="font-bold text-gray-800">{formatNumber(staff.totals.totalStaff)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">حقوق پرداختی:</span>
                    <span className="font-bold text-green-600">{formatCurrency(staff.totals.totalSalaryPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">اضافه‌کار:</span>
                    <span className="font-bold text-orange-600">{formatCurrency(staff.totals.totalOvertimePaid)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-gray-800 font-semibold">مجموع پرداختی:</span>
                    <span className="font-bold text-indigo-600">{formatCurrency(staff.totals.totalPaid)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h4 className="text-lg font-bold text-gray-800 mb-4">لیست کارمندان</h4>
                <div className="space-y-4">
                  {staff.staffList.map((employee, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{employee.name}</p>
                          <p className="text-sm text-gray-500">{employee.fatherName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{formatCurrency(employee.salary)}</p>
                        <p className="text-sm text-gray-500">هفتگی</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-6">
            {/* Inventory Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <FaBox className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">ارزش موجودی</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(inventory.totals.netInventory)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{inventory.count.existItems} نوع محصول</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FaProductHunt className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">ورودی‌ها</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(inventory.totals.totalIncomeValue)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{inventory.count.incomeRecords} رکورد</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FaTruck className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">خروجی‌ها</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(inventory.totals.totalOutgoingValue)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{inventory.count.outgoingRecords} رکورد</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FaStore className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">موجودی فعلی</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(inventory.totals.totalExistValue)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">بر اساس قیمت خرید</p>
              </div>
            </div>

            {/* Inventory Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 mb-4">موجودی بر اساس سایز</h4>
              <div className="space-y-4">
                {inventory.sizeBreakdown.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{item.size}</span>
                      <span className="font-bold text-gray-800">{item.currentStock} عدد</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>ورودی: {item.totalIn}</span>
                      <span>خروجی: {item.totalOut}</span>
                      <span>موجودی: {item.currentStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "system":
        return (
          <div className="space-y-6">
            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FaUsers className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">کاربران سیستم</p>
                    <p className="text-2xl font-bold text-gray-800">{formatNumber(system.users.total)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">فعال: {system.users.active}</span>
                  <span className="text-gray-600">نقش: {system.users.list[0]?.role || "نامشخص"}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <FaUserTie className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">مالکین</p>
                    <p className="text-2xl font-bold text-gray-800">{formatNumber(system.owners.total)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">فعال: {system.owners.active}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FaDatabase className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600">دیتابیس</p>
                    <p className="text-2xl font-bold text-gray-800">{system.database.totalTables} جدول</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">وضعیت: <span className="text-green-600">{system.database.systemHealth}</span></p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            داشبورد جامع مدیریت
          </h1>
          <p className="text-gray-600">
            گزارش کامل سیستم مدیریت چاپخانه
            {lastUpdated && (
              <span className="text-sm text-gray-500 mr-2">
                - آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <FaFilter />
            {showFilters ? "مخفی کردن فیلترها" : "نمایش فیلترها"}
          </button>
          
          <button
            onClick={() => fetchReportData()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <FaSync />
            بروزرسانی
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaFilter className="text-cyan-600" />
            فیلترهای گزارش
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">از تاریخ</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholderText="انتخاب تاریخ شروع"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تا تاریخ</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholderText="انتخاب تاریخ پایان"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع گزارش</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">همه اطلاعات</option>
                <option value="financial">گزارش مالی</option>
                <option value="customers">گزارش مشتریان</option>
                <option value="staff">گزارش کارمندان</option>
                <option value="inventory">گزارش انبار</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleDateFilter}
                className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all"
              >
                اعمال فیلتر
              </button>
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
              >
                بازنشانی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Period Info */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl p-4 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-xl" />
            <div>
              <h3 className="font-bold">دوره گزارش</h3>
              <p className="text-sm opacity-90">{reportData.period}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">تاریخ تولید گزارش</p>
            <p className="font-bold">{new Date(reportData.reportDate).toLocaleDateString('fa-IR')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-cyan-600 border-b-2 border-cyan-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-8">
        {renderTabContent()}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaChartLine className="text-cyan-600" />
          شاخص‌های عملکرد
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <FaPercentage className="text-blue-600 text-3xl mx-auto mb-4" />
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {summary.performance.avgOrderValue > 0 ? formatCurrency(summary.performance.avgOrderValue) : "0"}
            </div>
            <div className="text-blue-700 font-semibold">میانگین ارزش سفارش</div>
            <p className="text-blue-600 text-sm mt-2">به ازای هر مشتری</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <FaIndustry className="text-green-600 text-3xl mx-auto mb-4" />
            <div className="text-3xl font-bold text-green-900 mb-2">
              {formatNumber(summary.performance.staffProductivity)}
            </div>
            <div className="text-green-700 font-semibold">بهره‌وری کارمندان</div>
            <p className="text-green-600 text-sm mt-2">سفارش به ازای هر کارمند</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <FaCogs className="text-purple-600 text-3xl mx-auto mb-4" />
            <div className="text-3xl font-bold text-purple-900 mb-2">
              {customers.totals.pendingAmount > 0 ? "نیاز به پیگیری" : "همه تسویه"}
            </div>
            <div className="text-purple-700 font-semibold">وضعیت حساب‌ها</div>
            <p className="text-purple-600 text-sm mt-2">
              مانده حساب: {formatCurrency(customers.totals.pendingAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;