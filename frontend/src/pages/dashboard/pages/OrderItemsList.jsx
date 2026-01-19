import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSpinner,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaCheck,
  FaUndo
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const OrderItemsList = ({
  refreshTrigger
}) => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    size: "",
    qnty: "",
    price: "",
    money: "",
    fileName: ""
  });
  const [originalItem, setOriginalItem] = useState(null);

  // Fetch order items
  const fetchOrderItems = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: currentPage,
        limit: perPage,
      };

      const res = await axios.get(`${BASE_URL}/orderItems`, { params });

      setOrderItems(res.data.orderItems || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);

    } catch (err) {
      console.error("Error fetching order items:", err);
      setError(err.response?.data?.message || "خطا در دریافت سفارشات");
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems();
  }, [currentPage, perPage, refreshTrigger]);

  // Start editing an item
  const startEdit = (item) => {
    setEditingId(item.id);
    setOriginalItem({ ...item });
    setEditForm({
      size: item.size || "",
      qnty: item.qnty || "",
      price: item.price || "",
      money: item.money || "",
      fileName: item.fileName || ""
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      size: "",
      qnty: "",
      price: "",
      money: "",
      fileName: ""
    });
    setOriginalItem(null);
  };

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate money if qnty or price changes
      if (field === "qnty" || field === "price") {
        const qnty = Number(updated.qnty) || 0;
        const price = Number(updated.price) || 0;
        updated.money = (qnty * price).toString();
      }
      
      return updated;
    });
  };

  // Save edited item
  const saveEdit = async () => {
    if (!editingId) return;

    try {
      // Prepare payload
      const payload = {
        size: editForm.size,
        qnty: Number(editForm.qnty),
        price: Number(editForm.price),
        money: Number(editForm.money),
        fileName: editForm.fileName
      };

      // Send update request
      await axios.put(`${BASE_URL}/orderItems/${editingId}`, payload);

      // Update local state
      setOrderItems(prev => prev.map(item => 
        item.id === editingId 
          ? { ...item, ...payload } 
          : item
      ));

      // Reset editing state
      cancelEdit();
      
      alert("سفارش با موفقیت ویرایش شد");
      
    } catch (err) {
      console.error("Error updating order item:", err);
      alert(err.response?.data?.message || "خطا در ویرایش سفارش");
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    return orderItems.reduce((acc, item) => {
      acc.totalQuantity += parseInt(item.qnty) || 0;
      acc.totalMoney += parseFloat(item.money) || 0;
      return acc;
    }, { totalQuantity: 0, totalMoney: 0 });
  };

  const totals = calculateTotals();

  // Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  // Format in 'fa-IR' locale
  const formatted = date.toLocaleDateString("fa-IR");
  // Replace Persian/Arabic digits with English digits
  return formatted.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
};


  // Check if there are changes
  const hasChanges = () => {
    if (!originalItem) return false;
    return (
      editForm.size !== originalItem.size ||
      editForm.qnty !== originalItem.qnty ||
      editForm.price !== originalItem.price ||
      editForm.money !== originalItem.money ||
      editForm.fileName !== originalItem.fileName
    );
  };

  if (loading && orderItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری سفارشات...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FaFileInvoiceDollar className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">لیست سفارشات</h2>
              <p className="text-sm text-white/80">
                {totalItems} سفارش | صفحه {currentPage} از {totalPages}
                {editingId && (
                  <span className="ml-4 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                    حالت ویرایش #{editingId}
                  </span>
                )}
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

      {/* Error Message */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Order Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead className="bg-cyan-50 text-cyan-800">
            <tr>
              <th className="p-3 border-b font-semibold">#</th>
              <th className="p-3 border-b font-semibold">نام فایل</th>
              <th className="p-3 border-b font-semibold">سایز</th>
              <th className="p-3 border-b font-semibold">تعداد</th>
              <th className="p-3 border-b font-semibold">قیمت (افغانی)</th>
              <th className="p-3 border-b font-semibold">مبلغ (افغانی)</th>
              <th className="p-3 border-b font-semibold">
                <div className="flex items-center justify-center gap-1">
                  <FaCalendarAlt />
                  <span>تاریخ ثبت</span>
                </div>
              </th>
              <th className="p-3 border-b font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FaFileInvoiceDollar className="text-4xl text-gray-300" />
                    <p className="text-lg">هیچ سفارشی یافت نشد</p>
                    <p className="text-sm text-gray-400">شروع به ثبت سفارش جدید کنید</p>
                  </div>
                </td>
              </tr>
            ) : (
              orderItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 border-b last:border-0 transition-colors ${
                    editingId === item.id ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="p-3 text-gray-600">
                    {(currentPage - 1) * perPage + index + 1}
                  </td>
                  
                  {/* File Name Cell */}
                  <td className="p-3">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editForm.fileName}
                        onChange={(e) => handleEditChange("fileName", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="نام فایل"
                      />
                    ) : (
                      <div className="font-medium text-gray-800 max-w-xs truncate">
                        {item.fileName || "—"}
                      </div>
                    )}
                  </td>
                  
                  {/* Size Cell */}
                  <td className="p-3">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editForm.size}
                        onChange={(e) => handleEditChange("size", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="سایز"
                        required
                      />
                    ) : (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {item.size}
                      </span>
                    )}
                  </td>
                  
                  {/* Quantity Cell */}
                  <td className="p-3">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        min="1"
                        value={editForm.qnty}
                        onChange={(e) => handleEditChange("qnty", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                        placeholder="تعداد"
                        required
                      />
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                        {item.qnty}
                      </span>
                    )}
                  </td>
                  
                  {/* Price Cell */}
                  <td className="p-3">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.price}
                        onChange={(e) => handleEditChange("price", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                        placeholder="قیمت"
                        required
                      />
                    ) : (
                      <span className="text-green-700 font-semibold">
                        {parseFloat(item.price || 0).toLocaleString('en-US')}
                      </span>
                    )}
                  </td>
                  
                  {/* Money Cell */}
                  <td className="p-3">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.money}
                        onChange={(e) => handleEditChange("money", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center bg-gray-50"
                        placeholder="مبلغ"
                        required
                        readOnly // Auto-calculated, but can be manually overridden
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                      />
                    ) : (
                      <span className="text-purple-700 font-bold">
                        {parseFloat(item.money || 0).toLocaleString('en-US')}
                      </span>
                    )}
                  </td>
                  
                  {/* Date Cell */}
                  <td className="p-3 text-gray-500 text-sm">
                    {formatDate(item.createdAt)}
                  </td>
                  
                  {/* Actions Cell */}
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            title="ذخیره"
                            disabled={!hasChanges()}
                          >
                            <FaSave />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            title="لغو"
                          >
                            <FaTimes />
                          </button>
                          {hasChanges() && (
                            <button
                              onClick={() => {
                                setEditForm({
                                  size: originalItem.size || "",
                                  qnty: originalItem.qnty || "",
                                  price: originalItem.price || "",
                                  money: originalItem.money || "",
                                  fileName: originalItem.fileName || ""
                                });
                              }}
                              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                              title="بازنشانی"
                            >
                              <FaUndo />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg"
                            title="ویرایش"
                            disabled={editingId !== null}
                          >
                            <FaEdit />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {orderItems.length > 0 && (
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="p-3 text-right font-semibold text-gray-700">
                  مجموع کل:
                </td>
                <td colSpan="2" className="p-3 text-right font-bold text-blue-700">
                  {totals.totalQuantity.toLocaleString('en-US')}
                </td>
                <td className="p-3 font-bold text-purple-700">
                  {totals.totalMoney.toLocaleString('en-US')}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              نمایش {(currentPage - 1) * perPage + 1} تا {Math.min(currentPage * perPage, totalItems)} از {totalItems} مورد
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || editingId !== null}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={editingId !== null}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-cyan-800 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      } ${editingId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || editingId !== null}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Warning */}
      {editingId && (
        <div className="bg-yellow-50 border border-yellow-200 p-3">
          <div className="flex items-center justify-center gap-2 text-yellow-800">
            <FaEdit />
            <span className="font-medium">شما در حال ویرایش سفارش #{editingId} هستید</span>
            <button
              onClick={cancelEdit}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
            >
              لغو ویرایش
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderItemsList;