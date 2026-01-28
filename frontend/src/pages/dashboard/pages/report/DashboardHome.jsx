import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaBuilding,
  FaCreditCard,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaChartLine,
  FaWallet,
  FaPercentage
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinancialReport();
  }, []);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/report`, {
        params: { reportType: "financial" }
      });

      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError("خطا در دریافت گزارش مالی");
      }
    } catch (err) {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  };

  const money = (val) =>
    new Intl.NumberFormat("fa-AF").format(Math.round(val || 0)) + " افغانی";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-cyan-600 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        داشبورد مالی
      </h1>

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat title="پول بالای مشتریان" value={money(data.totalMoneyOnCustomers)} icon={FaUsers} />
        <Stat title="پول برداشتی مالکین" value={money(data.totalMoneyOnOwners)} icon={FaBuilding} />
        <Stat title="دریافتی از مشتریان" value={money(data.totalReceiptFromCustomers)} icon={FaCreditCard} />
        <Stat title="معاشات پرداخت‌شده" value={money(data.totalPaid)} icon={FaHandHoldingUsd} />
        <Stat title="مجموع مصارف" value={money(data.totalExpense)} icon={FaMoneyBillWave} />
        <Stat title="معاش پرداخت‌نشده" value={money(data.totalUnpaidSalary)} icon={FaWallet} />
        <Stat title="تمام معاش" value={money(data.totalSalaryLiability)} icon={FaWallet} />
        <Stat title="سود خالص" value={money(data.netProfit)} icon={FaChartLine} />
      </div>

      {/* Ratios */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          شاخص‌های مالی
        </h3>

        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <span className="text-gray-700">نسبت پرداخت معاش</span>
          <span className="font-bold text-cyan-600 flex items-center gap-1">
            <FaPercentage />
            {data.salaryPaymentRatio?.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

/* Small Stat Card */
const Stat = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-xl shadow p-5 border">
    <div className="flex items-center justify-between mb-3">
      <Icon className="text-cyan-600 text-xl" />
      <span className="text-sm text-gray-600">{title}</span>
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
  </div>
);

export default DashboardHome;
