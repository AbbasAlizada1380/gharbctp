import { useEffect, useState } from "react";
import sizes from "../services/Size.js"; // Optional if you want size labels

const BASE_URL = import.meta.env.VITE_BASE_URL;
const EXIST_API_URL = `${BASE_URL}/stock/exist`;

const ExistingStock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalStock: 0,
    lowStockCount: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch existing stock from API
  const fetchStock = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });
      
      if (search) {
        params.append("size", search);
      }

      const response = await fetch(`${EXIST_API_URL}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle both response formats
      if (result.data) {
        // New format: { success: true, count: 1, data: [...] }
        setStockItems(result.data);
        setSummary({
          totalItems: result.count || 0,
          totalStock: result.summary?.totalStock || 0,
          lowStockCount: result.summary?.lowStockCount || 0
        });
        setTotalPages(result.pagination?.totalPages || 1);
      } else if (result.exists) {
        // Alternative format: { exists: [...], summary: {...}, pagination: {...} }
        setStockItems(result.exists);
        setSummary(result.summary || {});
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        // Direct array format
        setStockItems(result);
        setSummary({
          totalItems: result.length,
          totalStock: result.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0),
          lowStockCount: 0
        });
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching existing stock:", error);
      setError("خطا در دریافت اطلاعات موجودی");
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock on component mount and when page/search changes
  useEffect(() => {
    fetchStock(currentPage, searchTerm);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchStock(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchStock(newPage, searchTerm);
    }
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchTerm("");
    fetchStock(1, "");
  };

  // Format number with Persian locale
  const formatNumber = (number) => {
    return new Intl.NumberFormat('fa-IR').format(number);
  };

  // Get size label if available
  const getSizeLabel = (size) => {
    if (!sizes || !Array.isArray(sizes)) return size;
    
    const sizeObj = sizes.find(s => s.value === size || s.label === size);
    return sizeObj ? sizeObj.label : size;
  };

  // Get stock status color
  const getStockStatus = (quantity) => {
    const qty = parseFloat(quantity);
    if (qty === 0) return "bg-red-100 text-red-800";
    if (qty < 10) return "bg-yellow-100 text-yellow-800";
    if (qty < 20) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  // Get stock status text
  const getStockStatusText = (quantity) => {
    const qty = parseFloat(quantity);
    if (qty === 0) return "اتمام موجودی";
    if (qty < 5) return "کمبود شدید";
    if (qty < 10) return "کمبود";
    if (qty < 20) return "متوسط";
    return "کافی";
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-cyan-800 mb-4">موجودی فعلی</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">
            در حال بارگذاری اطلاعات موجودی...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-cyan-800 mb-6">موجودی فعلی انبار</h2>

      

      {stockItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">هیچ موجودی ثبت نشده است</p>
          {searchTerm && (
            <p className="text-gray-400 mt-2">
              نتیجه‌ای برای "{searchTerm}" یافت نشد
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Stock Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-right border border-gray-200">ردیف</th>
                  <th className="p-3 text-right border border-gray-200">اندازه</th>
                  <th className="p-3 text-right border border-gray-200">تعداد</th>
                  <th className="p-3 text-right border border-gray-200">وضعیت</th>
                  <th className="p-3 text-right border border-gray-200">آخرین به‌روزرسانی</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item, index) => {
                  const rowNumber = (currentPage - 1) * 10 + index + 1;
                  const quantity = parseFloat(item.quantity || 0);
                  const statusClass = getStockStatus(item.quantity);
                  const statusText = getStockStatusText(item.quantity);
                  
                  return (
                    <tr 
                      key={item.id || index} 
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="p-3 border border-gray-200 text-center">
                        {formatNumber(rowNumber)}
                      </td>
                      <td className="p-3 border border-gray-200 font-medium">
                        {getSizeLabel(item.size)}
                      </td>
                      <td className="p-3 border border-gray-200 font-bold">
                        {formatNumber(quantity)}
                      </td>
                      <td className="p-3 border border-gray-200">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="p-3 border border-gray-200 text-sm text-gray-600">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('fa-IR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
              >
                قبلی
              </button>
              
              <div className="flex gap-1">
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
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-md transition ${
                        currentPage === pageNum
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {formatNumber(pageNum)}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
              >
                بعدی
              </button>
              
              <span className="text-sm text-gray-600 mr-2">
                صفحه {formatNumber(currentPage)} از {formatNumber(totalPages)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExistingStock;