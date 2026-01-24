import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSpinner,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaPlus,
  FaUndo
} from "react-icons/fa";
import Pagination from "../pagination/Pagination"; // Import the Pagination component
import OwnerManager from "./OwnerManager";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  customer: "",
  amount: "",
};

const ReceiptManager = () => {
  const [customers, setCustomers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Original values for reset during edit
  const [originalReceipt, setOriginalReceipt] = useState(null);

  /* ---------------- FETCH CUSTOMERS ---------------- */
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/customers`);
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error("Error fetching customers", error);
      setError("خطا در دریافت مشتریان");
    }
  };

  /* ---------------- FETCH RECEIPTS WITH PAGINATION ---------------- */
  const fetchReceipts = async () => {
    try {
      setFetchLoading(true);
      const params = {
        page: currentPage,
        limit: perPage,
      };
      
      const res = await axios.get(`${BASE_URL}/receipts`, { params });
      
      // Update based on your API response structure
      setReceipts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.count || 0);
      setError("");
    } catch (error) {
      console.error("Error fetching receipts", error);
      setError("خطا در دریافت رسیدها");
      setReceipts([]);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchReceipts();
  }, [currentPage, perPage]); // Add pagination dependencies

  /* ---------------- HANDLE FORM ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        customer: form.customer,
        amount: parseFloat(form.amount)
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/receipts/${editingId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/receipts`, payload);
      }

      setForm(initialForm);
      setEditingId(null);
      setOriginalReceipt(null);
      fetchReceipts(); // Refresh the list
      
      // Show success message
      alert(editingId ? "رسید با موفقیت ویرایش شد" : "رسید با موفقیت ثبت شد");
      
    } catch (error) {
      console.error("Error saving receipt", error);
      setError(error.response?.data?.message || "خطا در ذخیره رسید");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EDIT ---------------- */
  const handleEdit = (receipt) => {
    setForm({
      customer: receipt.customer.toString(),
      amount: receipt.amount.toString(),
    });
    setEditingId(receipt.id);
    setOriginalReceipt(receipt);
  };

  /* ---------------- CANCEL EDIT ---------------- */
  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setOriginalReceipt(null);
  };

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    if (originalReceipt) {
      setForm({
        customer: originalReceipt.customer.toString(),
        amount: originalReceipt.amount.toString(),
      });
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این رسید اطمینان دارید؟")) return;

    try {
      await axios.delete(`${BASE_URL}/receipts/${id}`);
      fetchReceipts(); // Refresh the list
      alert("رسید با موفقیت حذف شد");
    } catch (error) {
      console.error("Delete error", error);
      alert(error.response?.data?.message || "خطا در حذف رسید");
    }
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalReceipt) return true; // New form always has "changes"
    return (
      form.customer !== originalReceipt.customer.toString() ||
      form.amount !== originalReceipt.amount.toString()
    );
  };

  // Get customer name
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id.toString() === customerId.toString());
    return customer?.fullname || customer?.name || "مشتری ناشناس";
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString("fa-IR");
    return formatted.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  };

  // Calculate total amount for current page
  const totalAmount = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount || 0), 0);

  if (fetchLoading && receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری رسیدها...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">مدیریت رسیدها</h1>
        <p className="text-gray-600">ثبت و مدیریت رسیدهای پرداختی</p>
        
        {editingId && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <FaEdit className="h-5 w-5" />
              <span className="font-semibold">حالت ویرایش – رسید #{editingId}</span>
            </div>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FaMoneyBillWave className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "ویرایش رسید" : "ثبت رسید جدید"}
              </h2>
              <p className="text-sm text-white/80">
                {editingId ? "ویرایش اطلاعات رسید پرداختی" : "ثبت رسید پرداختی جدید"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> انتخاب مشتری
              </label>
              <div className="relative">
                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                >
                  <option value="">انتخاب مشتری</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullname || c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> مبلغ (افغانی)
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <FaMoneyBillWave />
                </div>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="مبلغ را وارد کنید"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {editingId && (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <FaTimes />
                      <span>لغو ویرایش</span>
                    </div>
                  </button>
                  {hasChanges() && originalReceipt && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <FaUndo />
                        <span>بازنشانی</span>
                      </div>
                    </button>
                  )}
                </>
              )}
              <button
                type="submit"
                disabled={loading || !hasChanges()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-800 to-cyan-600 text-white rounded-lg hover:from-blue-900 hover:to-blue-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  {loading ? (
                    <FaSpinner className="animate-spin" />
                  ) : editingId ? (
                    <FaSave />
                  ) : (
                    <FaPlus />
                  )}
                  <span>{loading ? "در حال پردازش..." : editingId ? "ذخیره تغییرات" : "ثبت رسید"}</span>
                </div>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <FaFileInvoiceDollar className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">لیست رسیدها</h2>
                <p className="text-sm text-white/80">
                  {totalItems} رسید | صفحه {currentPage} از {totalPages}
                </p>
              </div>
            </div>
            {editingId && hasChanges() && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-200 text-sm animate-pulse">
                  تغییرات ذخیره نشده!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-cyan-50 text-cyan-800">
              <tr>
                <th className="p-3 border-b font-semibold">#</th>
                <th className="p-3 border-b font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <FaUser />
                    <span>مشتری</span>
                  </div>
                </th>
                <th className="p-3 border-b font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <FaMoneyBillWave />
                    <span>مبلغ (افغانی)</span>
                  </div>
                </th>
                <th className="p-3 border-b font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <FaCalendarAlt />
                    <span>تاریخ ثبت</span>
                  </div>
                </th>
                <th className="p-3 border-b font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <FaCalendarAlt />
                    <span>آخرین ویرایش</span>
                  </div>
                </th>
                <th className="p-3 border-b font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaFileInvoiceDollar className="text-4xl text-gray-300" />
                      <p className="text-lg text-gray-500">هیچ رسیدی یافت نشد</p>
                      <p className="text-sm text-gray-400">برای شروع، رسید جدیدی ثبت کنید</p>
                    </div>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, index) => (
                  <tr
                    key={receipt.id}
                    className={`hover:bg-gray-50 border-b last:border-0 transition-colors ${
                      editingId === receipt.id ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="p-3 text-gray-600">
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="p-3">
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          {getCustomerName(receipt.customer)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          کد: {receipt.customer}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                        {parseFloat(receipt.amount || 0).toLocaleString('en-US')}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-sm">
                      {formatDate(receipt.createdAt)}
                    </td>
                    <td className="p-3 text-gray-500 text-sm">
                      {receipt.updatedAt !== receipt.createdAt ? formatDate(receipt.updatedAt) : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(receipt)}
                          className={`p-2 rounded-lg transition ${
                            editingId === receipt.id
                              ? "bg-cyan-700 text-white"
                              : "text-cyan-700 hover:bg-cyan-50"
                          }`}
                          title="ویرایش"
                          disabled={editingId !== null && editingId !== receipt.id}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                          disabled={editingId !== null}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
          <div className="p-6 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
      </div>

      {/* Editing Warning */}
      {editingId && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="flex items-center justify-center gap-3 text-yellow-800">
            <FaEdit />
            <span className="font-medium">شما در حال ویرایش رسید #{editingId} هستید</span>
            <button
              onClick={cancelEdit}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded"
            >
              لغو ویرایش
            </button>
          </div>
          {hasChanges() && (
            <div className="mt-2 text-center text-yellow-700 text-sm">
              تغییرات اعمال شده هنوز ذخیره نشده‌اند
            </div>
          )}
        </div>
      )}

     < OwnerManager/>
    </div>
  );
};

export default ReceiptManager;