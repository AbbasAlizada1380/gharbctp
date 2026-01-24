import Pagination from "../../pagination/Pagination";
import { FaEdit, FaTrash } from "react-icons/fa";

const ExpenseTable = ({
  expenses,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">لیست هزینه‌ها</h2>

            </div>
          </div>

        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead className="bg-cyan-50 text-cyan-800">
            <tr>
              <th className="p-3 border-b font-semibold">#</th>
              <th className="p-3 border-b font-semibold">هدف هزینه</th>
              <th className="p-3 border-b font-semibold">پرداخت کننده</th>
              <th className="p-3 border-b font-semibold">مبلغ (افغانی)</th>
              <th className="p-3 border-b font-semibold">توضیحات</th>
              <th className="p-3 border-b font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-800 rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600">در حال بارگذاری...</p>
                  </div>
                </td>
              </tr>
            ) : expenses.length ? (
              expenses.map((e, index) => (
                <tr
                  key={e.id}
                  className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                >
                  <td className="p-3 text-gray-600">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  <td className="p-3 font-medium text-gray-800">
                    <div className="max-w-xs mx-auto truncate">
                      {e.purpose}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {e.by}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col items-center">
                      <span className="text-purple-700 font-bold text-lg">
                        {parseFloat(e.amount || 0)}
                      </span>
                      <span className="text-xs text-gray-500">افغانی</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="max-w-xs mx-auto">
                      {e.description ? (
                        <div className="text-gray-600 text-sm truncate" title={e.description}>
                          {e.description}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(e)}
                        className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg transition"
                        title="ویرایش"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-8">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 text-lg">هیچ هزینه‌ای ثبت نشده است</p>
                    <p className="text-gray-400 text-sm mt-1">برای شروع، هزینه جدیدی اضافه کنید</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;
