import { useState, useEffect } from "react";
import axios from "axios";
import sizes from "../services/Size.js";


const BASE_URL = import.meta.env.VITE_BASE_URL;
const INCOME_API_URL = `${BASE_URL}/stock/income`;

const Incoming = () => {
  const [items, setItems] = useState([{ size: "", quantity: "", price: "", money: "" }]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [summary, setSummary] = useState({
    totalMoney: 0,
    totalSpent: 0,
    totalProfit: 0
  });

  // Fetch all incomes
  const fetchIncomes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${INCOME_API_URL}?page=${page}&limit=10`);
      setIncomes(response.data.incomes);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
      setSummary(response.data.summary || {});
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      alert("خطا در دریافت اطلاعات درآمدها");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single income for edit
  const fetchIncomeById = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${INCOME_API_URL}/${id}`);
      const income = response.data;

      // Set form for editing
      setItems([{
        size: income.size || "",
        quantity: income.quantity || "",
        price: income.price || "",
        money: income.money || "",
        spent: income.spent || "0"
      }]);
      setEditingId(id);

      // Scroll to form
      document.getElementById('income-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error fetching income:", error);
      alert("خطا در دریافت اطلاعات درآمد");
    } finally {
      setLoading(false);
    }
  };

  // Create new income
  const createIncome = async (incomeData) => {
    try {
      const response = await axios.post(INCOME_API_URL, incomeData);
      alert("درآمد با موفقیت ثبت شد");
      fetchIncomes(currentPage);
      resetForm();
      return response.data;
    } catch (error) {
      console.error("Error creating income:", error.response?.data || error.message);
      alert(error.response?.data?.message || "خطا در ثبت درآمد");
      throw error;
    }
  };

  // Update income
  const updateIncome = async (id, incomeData) => {
    try {
      const response = await axios.put(`${INCOME_API_URL}/${id}`, incomeData);
      alert("درآمد با موفقیت بروزرسانی شد");
      fetchIncomes(currentPage);
      resetForm();
      return response.data;
    } catch (error) {
      console.error("Error updating income:", error.response?.data || error.message);
      alert(error.response?.data?.message || "خطا در بروزرسانی درآمد");
      throw error;
    }
  };

  // Partial update income
  const partialUpdateIncome = async (id, incomeData) => {
    try {
      const response = await axios.patch(`${INCOME_API_URL}/${id}`, incomeData);
      alert("درآمد با موفقیت بروزرسانی شد");
      fetchIncomes(currentPage);
      return response.data;
    } catch (error) {
      console.error("Error partially updating income:", error);
      alert("خطا در بروزرسانی جزئی درآمد");
    }
  };

  // Delete income
  const deleteIncome = async (id) => {
    if (!window.confirm("آیا از حذف این درآمد اطمینان دارید؟")) {
      return;
    }

    try {
      await axios.delete(`${INCOME_API_URL}/${id}`);
      alert("درآمد با موفقیت حذف شد");
      fetchIncomes(currentPage);
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("خطا در حذف درآمد");
    }
  };

  // Search incomes
  const searchIncomes = async () => {
    try {
      setLoading(true);
      // Note: You might need to implement search endpoint in your backend
      const response = await axios.get(`${INCOME_API_URL}?search=${searchTerm}`);
      setIncomes(response.data.incomes);
    } catch (error) {
      console.error("Error searching incomes:", error);
      alert("خطا در جستجوی درآمدها");
    } finally {
      setLoading(false);
    }
  };

  // Calculate money for a single item
  const calculateMoney = (quantity, price) => {
    const qnty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    return (qnty * prc).toFixed(2);
  };

  // Update a single item
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];

    // Update the field
    updatedItems[index][name] = value;

    // Auto-calculate money if quantity or price changes
    if (name === "quantity" || name === "price") {
      const money = calculateMoney(
        updatedItems[index].quantity,
        updatedItems[index].price
      );
      updatedItems[index].money = money;
    }

    setItems(updatedItems);
  };

  // Add new empty row
  const addItem = () => {
    setItems([...items, { size: "", quantity: "", price: "", money: "", spent: "0" }]);
  };

  // Remove row from form
  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  // Reset form
  const resetForm = () => {
    setItems([{ size: "", quantity: "", price: "", money: "", spent: "0" }]);
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
      if (!item.price || parseFloat(item.price) <= 0) validationErrors.push(`سطر ${index + 1}: قیمت معتبر وارد کنید`);
    });

    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    setLoading(true);

    try {
      // If editing, update existing income
      if (editingId) {
        await updateIncome(editingId, items[0]);
      }
      // If creating, create each item as separate income
      else {
        for (const item of items) {
          await createIncome({
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            spent: item.spent || "0"
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize - fetch incomes on component mount
  useEffect(() => {
    fetchIncomes();
  }, []);

  // Format date
const formatDate = (dateString) => {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
};


  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-cyan-800 mb-6">مدیریت واردات</h2>


      {/* Form Section */}
      <div id="income-form" className="mb-8 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-cyan-800 mb-4">
          {editingId ? "ویرایش درآمد" : "ثبت درآمد جدید"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end border-b border-gray-200 pb-4 mb-4"
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

              {/* Price */}
              <div>
                <label className="block mb-1 text-sm font-medium">قیمت</label>
                <input
                  type="number"
                  name="price"
                  value={item.price}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-cyan-300"
                  placeholder="قیمت واحد"
                  min="0"
                  step="0.001"
                  required
                />
              </div>

            

              {/* Money (Auto-calculated) */}
              <div>
                <label className="block mb-1 text-sm font-medium">مبلغ کل</label>
                <input
                  type="text"
                  name="money"
                  value={item.money}
                  readOnly
                  className="w-full border border-gray-300 bg-gray-50 rounded-md p-2"
                  placeholder="محاسبه خودکار"
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
              {loading ? "در حال پردازش..." : editingId ? "بروزرسانی درآمد" : "ثبت درآمد"}
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

      {/* Incomes List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-cyan-800">لیست درآمدها ({totalItems} مورد)</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">در حال بارگذاری...</p>
          </div>
        ) : incomes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">هیچ درآمدی ثبت نشده است</p>
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
                    <th className="p-3 text-right border">قیمت واحد</th>
                    <th className="p-3 text-right border">مبلغ کل</th>
                    <th className="p-3 text-right border">مصرف شده</th>
                    <th className="p-3 text-right border">تاریخ</th>
                    <th className="p-3 text-right border">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income, index) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="p-3 border">{(currentPage - 1) * 10 + index + 1}</td>
                      <td className="p-3 border">{income.size}</td>
                      <td className="p-3 border">{income.quantity}</td>
                      <td className="p-3 border">{income.price}</td>
                      <td className="p-3 border font-semibold text-green-700">
                        {income.money}
                      </td>
                      <td className="p-3 border text-red-600">
                        {income.spent || 0}
                      </td>
                      <td className="p-3 border">{formatDate(income.createdAt)}</td>
                      <td className="p-3 border">
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchIncomeById(income.id)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => deleteIncome(income.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex justify-center gap-2">
                <button
                  onClick={() => fetchIncomes(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  قبلی
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => fetchIncomes(i + 1)}
                    className={`px-4 py-2 rounded ${currentPage === i + 1 ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => fetchIncomes(currentPage + 1)}
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

export default Incoming;