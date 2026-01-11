import { useState, useEffect } from "react";
import axios from "axios";
import sizes from "../services/Size.js";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const OUTGOING_API_URL = `${BASE_URL}/stock/outgoing`;

const Outgoing = () => {
  const [items, setItems] = useState([{ size: "", quantity: "" }]);
  const [outgoings, setOutgoings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalMoney: 0,
    averageSaleValue: 0
  });
  const [stockInfo, setStockInfo] = useState({});

  // Fetch all outgoings
  const fetchOutgoings = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${OUTGOING_API_URL}?page=${page}&limit=10`);
      setOutgoings(response.data.outgoings);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
      setSummary(response.data.summary || {});
      setStockInfo(response.data.stockLevels || {});
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching outgoings:", error);
      alert("خطا در دریافت اطلاعات خروجی‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single outgoing for edit
  const fetchOutgoingById = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${OUTGOING_API_URL}/${id}`);
      const outgoing = response.data;
      
      // Set form for editing
      setItems([{
        size: outgoing.size || "",
        quantity: outgoing.quantity || ""
      }]);
      setEditingId(id);
      
      // Scroll to form
      document.getElementById('outgoing-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error fetching outgoing:", error);
      alert("خطا در دریافت اطلاعات خروجی");
    } finally {
      setLoading(false);
    }
  };

  // Create new outgoing
  const createOutgoing = async (outgoingData) => {
    try {
      const response = await axios.post(OUTGOING_API_URL, outgoingData);
      alert("خروجی با موفقیت ثبت شد");
      fetchOutgoings(currentPage);
      resetForm();
      return response.data;
    } catch (error) {
      console.error("Error creating outgoing:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || "خطا در ثبت خروجی";
      alert(errorMsg);
      throw error;
    }
  };

  // Update outgoing
  const updateOutgoing = async (id, outgoingData) => {
    try {
      const response = await axios.put(`${OUTGOING_API_URL}/${id}`, outgoingData);
      alert("خروجی با موفقیت بروزرسانی شد");
      fetchOutgoings(currentPage);
      resetForm();
      return response.data;
    } catch (error) {
      console.error("Error updating outgoing:", error.response?.data || error.message);
      alert(error.response?.data?.message || "خطا در بروزرسانی خروجی");
      throw error;
    }
  };

  // Partial update outgoing
  const partialUpdateOutgoing = async (id, outgoingData) => {
    try {
      const response = await axios.patch(`${OUTGOING_API_URL}/${id}`, outgoingData);
      alert("خروجی با موفقیت بروزرسانی شد");
      fetchOutgoings(currentPage);
      return response.data;
    } catch (error) {
      console.error("Error partially updating outgoing:", error);
      alert("خطا در بروزرسانی جزئی خروجی");
    }
  };

  // Delete outgoing
  const deleteOutgoing = async (id) => {
    if (!window.confirm("آیا از حذف این خروجی اطمینان دارید؟")) {
      return;
    }

    try {
      await axios.delete(`${OUTGOING_API_URL}/${id}`);
      alert("خروجی با موفقیت حذف شد");
      fetchOutgoings(currentPage);
    } catch (error) {
      console.error("Error deleting outgoing:", error);
      alert("خطا در حذف خروجی");
    }
  };

  // Search outgoings
  const searchOutgoings = async () => {
    try {
      setLoading(true);
      // Note: You might need to implement search endpoint in your backend
      const response = await axios.get(`${OUTGOING_API_URL}?search=${searchTerm}`);
      setOutgoings(response.data.outgoings);
    } catch (error) {
      console.error("Error searching outgoings:", error);
      alert("خطا در جستجوی خروجی‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Check stock availability for a size
  const checkStockAvailability = async (size) => {
    try {
      // You might want to create an endpoint to check stock
      // For now, we'll fetch from the summary data
      return stockInfo[size] || "0";
    } catch (error) {
      console.error("Error checking stock:", error);
      return "0";
    }
  };

  // Update a single item
  const handleChange = async (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];

    // Update the field
    updatedItems[index][name] = value;

    // If size changed, check stock availability
    if (name === "size" && value) {
      const availableStock = await checkStockAvailability(value);
      // You can display this info to the user if needed
      console.log(`Available stock for ${value}: ${availableStock}`);
    }

    setItems(updatedItems);
  };

  // Add new empty row
  const addItem = () => {
    setItems([...items, { size: "", quantity: "" }]);
  };

  // Remove row from form
  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  // Reset form
  const resetForm = () => {
    setItems([{ size: "", quantity: "" }]);
    setEditingId(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = [];
    items.forEach((item, index) => {
      if (!item.size) validationErrors.push(`سطر ${index + 1}: اندازه را انتخاب کنید`);
      if (!item.quantity || parseFloat(item.quantity) <= 0) validationErrors.push(`سطر ${index + 1}: تعداد معتبر وارد کنید`);
    });
    
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    setLoading(true);
    
    try {
      // If editing, update existing outgoing
      if (editingId) {
        await updateOutgoing(editingId, items[0]);
      } 
      // If creating, create each item as separate outgoing
      else {
        for (const item of items) {
          await createOutgoing({
            size: item.size,
            quantity: item.quantity
          });
        }
      }
    } catch (error) {
      // Error is already handled in the create/update functions
    } finally {
      setLoading(false);
    }
  };

  // Initialize - fetch outgoings on component mount
  useEffect(() => {
    fetchOutgoings();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  // Format number
  const formatNumber = (number) => {
    return new Intl.NumberFormat('fa-IR').format(number);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-cyan-800 mb-6">مدیریت خروجی‌ها</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-red-800">مجموع تعداد فروش</h3>
          <p className="text-2xl font-bold">{formatNumber(summary.totalQuantity)} عدد</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800">مجموع مبلغ فروش</h3>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalMoney)} تومان</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800">میانگین ارزش فروش</h3>
          <p className="text-2xl font-bold">{formatCurrency(summary.averageSaleValue)} تومان</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="جستجو بر اساس اندازه یا تاریخ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md p-2"
          />
          <button
            onClick={searchOutgoings}
            className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700"
          >
            جستجو
          </button>
          <button
            onClick={() => {
              setSearchTerm("");
              fetchOutgoings();
            }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            نمایش همه
          </button>
        </div>
      </div>

      {/* Form Section */}
      <div id="outgoing-form" className="mb-8 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-cyan-800 mb-4">
          {editingId ? "ویرایش خروجی" : "ثبت خروجی جدید"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b border-gray-200 pb-4 mb-4"
            >
              {/* Size */}
              <div className="md:col-span-2">
                <label className="block mb-1 text-sm font-medium">اندازه</label>
                <select
                  name="size"
                  value={item.size}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-cyan-300"
                  required
                >
                  <option value="">انتخاب اندازه</option>
                  {sizes.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {item.size && stockInfo[item.size] && (
                  <p className="text-xs text-gray-500 mt-1">
                    موجودی فعلی: {formatNumber(stockInfo[item.size])} عدد
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block mb-1 text-sm font-medium">تعداد</label>
                <input
                  type="number"
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-cyan-300"
                  placeholder="تعداد"
                  min="0"
                  step="0.001"
                  required
                />
              </div>

              {/* Remove Button (only show if multiple items and not editing) */}
              {items.length > 1 && !editingId && (
                <div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {!editingId && (
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition"
              >
                + مورد جدید
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-800 text-white py-3 rounded-md hover:bg-cyan-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "در حال پردازش..." : editingId ? "بروزرسانی خروجی" : "ثبت خروجی"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-400 text-white px-4 py-3 rounded-md hover:bg-gray-500 transition"
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Outgoings List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-cyan-800">لیست خروجی‌ها ({totalItems} مورد)</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">در حال بارگذاری...</p>
          </div>
        ) : outgoings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">هیچ خروجی ثبت نشده است</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-right border">ردیف</th>
                    <th className="p-3 text-right border">اندازه</th>
                    <th className="p-3 text-right border">تعداد</th>
                    <th className="p-3 text-right border">قیمت واحد (میانگین)</th>
                    <th className="p-3 text-right border">مبلغ کل</th>
                    <th className="p-3 text-right border">تاریخ</th>
                    <th className="p-3 text-right border">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoings.map((outgoing, index) => {
                    const unitPrice = parseFloat(outgoing.money) / parseFloat(outgoing.quantity);
                    return (
                      <tr key={outgoing.id} className="hover:bg-gray-50">
                        <td className="p-3 border">{(currentPage - 1) * 10 + index + 1}</td>
                        <td className="p-3 border">
                          <div>
                            {outgoing.size}
                            {stockInfo[outgoing.size] && (
                              <div className="text-xs text-gray-500">
                                موجودی: {formatNumber(stockInfo[outgoing.size])}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 border">{formatNumber(outgoing.quantity)}</td>
                        <td className="p-3 border">{formatCurrency(unitPrice.toFixed(3))}</td>
                        <td className="p-3 border font-semibold text-green-700">
                          {formatCurrency(outgoing.money)}
                        </td>
                        <td className="p-3 border">{formatDate(outgoing.createdAt)}</td>
                        <td className="p-3 border">
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchOutgoingById(outgoing.id)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                            >
                              ویرایش
                            </button>
                            <button
                              onClick={() => deleteOutgoing(outgoing.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
                <button
                  onClick={() => fetchOutgoings(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  قبلی
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => fetchOutgoings(i + 1)}
                    className={`px-4 py-2 rounded ${currentPage === i + 1 ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => fetchOutgoings(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Outgoing;