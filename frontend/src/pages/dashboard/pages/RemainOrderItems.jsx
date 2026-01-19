import { useEffect, useState } from "react";
import axios from "axios";
import { FaBoxOpen, FaSpinner, FaTimes, FaFileInvoiceDollar, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const RemainOrderItems = ({ customer, onClose }) => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customer || !customer.id) return;

    const fetchRemainOrderItems = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          `${BASE_URL}/remain/${customer.id}/orders`
        );

        setOrderItems(res.data.orderItems || []);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "خطا در دریافت سفارشات باقیمانده"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRemainOrderItems();
  }, [customer]);

  if (!customer) return null;

  // Calculate totals
  const totalQuantity = orderItems.reduce((sum, item) => sum + (parseInt(item.qnty) || 0), 0);
  const totalMoney = orderItems.reduce((sum, item) => sum + (parseFloat(item.money) || 0), 0);
  const totalPrice = orderItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  return (
    <div className="mt-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-cyan-800 to-cyan-600 text-white rounded-t-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <FaBoxOpen className="text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              گزارش سفارشات
            </h2>
            <p className="text-sm text-white/80">
              مشتری: <span className="font-semibold">{customer.fullname}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
            <FaFileInvoiceDollar />
            <span className="text-sm">{orderItems.length} سفارش</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="بستن"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
            <p className="text-gray-600">در حال بارگذاری سفارشات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 font-semibold">⚠️ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              تلاش مجدد
            </button>
          </div>
        ) : orderItems.length === 0 ? (
          <div className="text-center py-12">
            <FaBoxOpen className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">هیچ سفارش باقیمانده‌ای وجود ندارد</p>
            <p className="text-gray-400 text-sm mt-1">تمام سفارشات این مشتری پرداخت شده است</p>
          </div>
        ) : (
          <>


            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-center">
                <thead className="bg-cyan-50 text-cyan-800">
                  <tr>
                    <th className="p-3 border-b font-semibold">#</th>
                    <th className="p-3 border-b font-semibold">نام فایل</th>
                    <th className="p-3 border-b font-semibold">سایز</th>
                    <th className="p-3 border-b font-semibold">تعداد</th>
                    <th className="p-3 border-b font-semibold">قیمت (افغانی)</th>
                    <th className="p-3 border-b font-semibold">مبلغ (افغانی)</th>
                    <th className="p-3 border-b font-semibold">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                    >
                      <td className="p-3 text-gray-600">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{item.fileName}</td>
                      <td className="p-3 text-gray-600">{item.size}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {item.qnty}
                        </span>
                      </td>
                      <td className="p-3 text-green-700 font-semibold">
                        {parseFloat(item.price || 0)}
                      </td>
                      <td className="p-3 text-purple-700 font-bold">
                        {parseFloat(item.money || 0)}
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {item.createdAt ?
                          new Date(item.createdAt)
                            .toLocaleDateString('fa-IR')
                            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                          : '—'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="p-3 text-right font-semibold text-gray-700">
                      مجموع:
                    </td>
                    <td className="p-3 font-bold text-blue-700">{totalQuantity}</td>
                    <td className="p-3 font-bold text-green-700">
                      {totalPrice}
                    </td>
                    <td className="p-3 font-bold text-purple-700">
                      {totalMoney}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RemainOrderItems;