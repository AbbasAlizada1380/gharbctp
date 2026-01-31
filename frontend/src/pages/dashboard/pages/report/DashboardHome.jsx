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
import CustomersRemainMoney from "../CustomerRemainMoney";


const DashboardHome = () => {
  const [showRemainModal, setShowRemainModal] = useState(false);
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
    <div className="p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        داشبورد مالی
      </h1>

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          title="پول بالای مشتریان"
          value={money(data.totalMoneyOnCustomers)}
          icon={FaUsers}
          onClick={() => setShowRemainModal(true)}
        />
        <Stat title="دریافتی از مشتریان" value={money(data.totalReceiptFromCustomers)} icon={FaCreditCard} />
        <Stat title="پول برداشتی مالکین" value={money(data.totalMoneyOnOwners)} icon={FaBuilding} />
        <Stat title="مجموع مصارف" value={money(data.totalExpense)} icon={FaMoneyBillWave} />
        <Stat title="معاشات پرداخت‌شده" value={money(data.totalPaid)} icon={FaHandHoldingUsd} />
        <Stat title="معاش پرداخت‌نشده" value={money(data.totalUnpaidSalary)} icon={FaWallet} />
        <Stat title="تمام معاش" value={money(data.totalSalaryLiability)} icon={FaWallet} />
        <Stat title="سود خالص" value={money(data.netProfit)} icon={FaChartLine} />
      </div>
      {showRemainModal && <CustomersRemainMoney onClose={()=>setShowRemainModal(false)} />}
    </div>
  );
};

const Stat = ({ title, value, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow p-5 border
      ${onClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className="text-cyan-600 text-xl" />
      <span className="text-sm text-gray-600">{title}</span>
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>

  </div>
);


export default DashboardHome;
