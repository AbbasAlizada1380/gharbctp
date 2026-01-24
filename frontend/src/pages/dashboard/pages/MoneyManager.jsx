import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function MoneyManager() {
  const [moneyList, setMoneyList] = useState([]);
  const [owners, setOwners] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 🔹 Fetch owners
  const fetchOwners = async () => {
    const res = await axios.get(`${BASE_URL}/owner`);
    setOwners(res.data.owners);
  };

  // 🔹 Fetch money records
  const fetchMoney = async () => {
    const res = await axios.get(`${BASE_URL}/money`);
    setMoneyList(res.data.moneyList);
  };

  useEffect(() => {
    fetchOwners();
    fetchMoney();
  }, []);

  // 🔹 Create / Update money
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerId || !amount) return;

    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/money/${editingId}`, {
          amount,
        });
      } else {
        await axios.post(`${BASE_URL}/money`, {
          ownerId,
          amount,
        });
      }

      resetForm();
      fetchMoney();
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOwnerId("");
    setAmount("");
    setEditingId(null);
  };

  // 🔹 Edit
  const handleEdit = (item) => {
    setEditingId(item.id);
    setOwnerId(item.ownerId);
    setAmount(item.amount);
    setShowForm(true);
  };

  // 🔹 Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    await axios.delete(`${BASE_URL}/money/${id}`);
    fetchMoney();
  };

  const totalAmount = moneyList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
  {/* دکمه نمایش/پنهان کردن فرم */}
  <div className="flex justify-between items-center">
    <h2 className="text-xl font-bold text-gray-800">سابقه تراکنش‌ها</h2>
    <button
      onClick={() => {
        setShowForm(!showForm);
        if (editingId) resetForm();
      }}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
        showForm 
          ? "bg-gradient-to-r from-gray-600 to-gray-500 text-white" 
          : "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-700 hover:to-cyan-600"
      }`}
    >
      {showForm ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          بستن فرم
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          تراکنش جدید
        </>
      )}
    </button>
  </div>

  {/* فرم - بهبود یافته */}
  {showForm && (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg p-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {editingId ? "ویرایش تراکنش" : "افزودن تراکنش جدید"}
          </h3>
          <p className="text-sm text-gray-600">
            {editingId ? "جزئیات تراکنش را به‌روزرسانی کنید" : "اطلاعات تراکنش جدید را وارد کنید"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مالک
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors bg-white"
              required
            >
              <option value="">انتخاب مالک</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ (دلار)
            </label>
            <div className="relative">
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pr-10 pl-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-left"
                required
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال پردازش...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {editingId ? "به‌روزرسانی تراکنش" : "افزودن تراکنش"}
              </>
            )}
          </button>

          {(editingId || showForm) && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800 font-medium rounded-lg hover:from-gray-500 hover:to-gray-400 transition-all"
            >
              لغو
            </button>
          )}
        </div>
      </form>
    </div>
  )}

  {/* جدول - بهبود یافته */}
  <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <th className="text-right py-4 px-6 font-semibold text-gray-700">مالک</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">مبلغ</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">تاریخ</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">وضعیت</th>
            <th className="text-right py-4 px-6 font-semibold text-gray-700">عملیات</th>
          </tr>
        </thead>

        <tbody>
          {moneyList.map((item) => (
            <tr 
              key={item.id} 
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-600 font-semibold">
                      {item.owner?.name?.charAt(0) || "O"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.owner?.name}</p>
                    <p className="text-xs text-gray-500">شناسه: {item.id}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-cyan-600 font-bold">
                    ${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="text-gray-600" dir="rtl">
                  {new Date(item.createdAt).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                  <p className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </td>
              <td className="py-4 px-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full ml-2"></span>
                  تکمیل شده
                </span>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 transition-all"
                    title="حذف"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-yellow-700 rounded-lg hover:from-yellow-100 hover:to-yellow-200 transition-all"
                    title="ویرایش"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {moneyList.length === 0 && (
            <tr>
              <td colSpan="5" className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">هیچ تراکنشی یافت نشد</h3>
                  <p className="text-gray-500 mb-4">با افزودن اولین تراکنش شروع کنید</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      افزودن اولین تراکنش
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
  );
}