import React, { useEffect, useRef } from "react";
import { FaPrint, FaTimes, FaCheckCircle, FaFileInvoiceDollar, FaUser, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import jalaali from "jalaali-js";

const PrintBillOrder = ({ isOpen, onClose, order, autoPrint }) => {
  const hasAutoPrintedRef = useRef(false);
  const printTimeoutRef = useRef(null);

  const formatCurrency = (num) => {
    const number = Number(num || 0);
    return new Intl.NumberFormat('fa-IR').format(number) + " افغانی";
  };

  // Function to convert number to Persian words
  const convertNumberToPersianWords = (num) => {
    const number = Math.abs(parseFloat(num) || 0);
    
    // If number is 0
    if (number === 0) return "صفر";
    
    // Units in Persian
    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دوصد', 'سه صد', 'چهارصد', 'پنجصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    
    // Large numbers in Persian
    const largeNumbers = [
      { value: 1000000000, word: 'میلیارد' },
      { value: 1000000, word: 'میلیون' },
      { value: 1000, word: 'هزار' }
    ];

    const convertThreeDigit = (n) => {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      
      let words = '';
      
      if (hundred > 0) {
        words += hundreds[hundred] + ' و ';
      }
      
      if (remainder === 0) {
        return words.slice(0, -3); // Remove " و " if no remainder
      }
      
      if (ten === 1) {
        words += teens[unit];
      } else {
        if (ten > 1) {
          words += tens[ten];
          if (unit > 0) {
            words += ' و ';
          }
        }
        if (unit > 0) {
          words += units[unit];
        }
      }
      
      return words.trim();
    };

    let result = '';
    let remaining = Math.floor(number);
    
    // Handle large numbers
    for (const large of largeNumbers) {
      if (remaining >= large.value) {
        const count = Math.floor(remaining / large.value);
        const threeDigitWords = convertThreeDigit(count);
        result += threeDigitWords + ' ' + large.word + ' و ';
        remaining %= large.value;
      }
    }
    
    // Handle the rest (less than 1000)
    if (remaining > 0) {
      result += convertThreeDigit(remaining);
    } else {
      // Remove trailing " و " if nothing left
      result = result.slice(0, -3);
    }
    
    // Handle decimals (Afghanis)
    const decimal = Math.round((number - Math.floor(number)) * 100);
    if (decimal > 0) {
      result += ' و ' + convertThreeDigit(decimal) + ' پول خرد';
    }
    
    return result.trim() + (result ? ' افغانی' : '');
  };

  const handlePrint = () => {
    window.print();
  };

  // Auto print functionality
  useEffect(() => {
    if (autoPrint && isOpen && order && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      printTimeoutRef.current = setTimeout(() => {
        window.print();
      }, 800);
    }

    return () => {
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, [autoPrint, isOpen, order]);

  // Reset auto-print flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasAutoPrintedRef.current = false;
    }
  }, [isOpen]);

  // Early return if not ready to render
  if (!isOpen || !order) {
    return null;
  }

  // Generate bill number and timestamp
  const billNumber = order.id ? `${order.id.toString()}` : "---";

  function formatToJalali(dateString) {
    const date = new Date(dateString);
    const { jy, jm, jd } = jalaali.toJalaali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "بعدازظهر" : "قبل‌ازظهر";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${jy}/${pad(jm)}/${pad(jd)} - ${pad(hours)}:${pad(minutes)} ${ampm}`;
  }

  // Get customer information
  const customer = order.Customer || {};
  
  // Convert amount to Persian words
  const amountInWords = convertNumberToPersianWords(order.amount);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/90 to-gray-800/90 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0 backdrop-blur-sm">
      {/* A5 Container with modern design */}
      <div className="px-5">
        <div
          id="printable-area"
          className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl py-8 overflow-hidden flex flex-col print:shadow-none print:rounded-none relative border border-gray-200"
          style={{
            width: "148mm",
            height: "210mm",
            direction: "rtl",
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
          <div className="absolute top-20 right-0 w-24 h-24 opacity-5">
            <div className="text-6xl">💰</div>
          </div>
          <div className="absolute bottom-20 left-0 w-24 h-24 opacity-5">
            <div className="text-6xl">📄</div>
          </div>

          {/* Header Section */}
          <div className="px-6 pt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-800">رسید پرداخت</h1>
                <p className="text-sm text-gray-600">Receipt</p>
              </div>
              <div className="text-left">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 rounded-xl border border-cyan-100">
                  <div className="text-xs text-gray-500 font-medium">شماره رسید</div>
                  <div className="text-xl font-bold text-cyan-700">{billNumber}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatToJalali(order.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info with card design */}
          <div className="px-6 py-4">
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <FaUser className="text-cyan-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">مشخصات مشتری</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">اسم کامل:</span>
                    <span className="font-bold text-gray-800 text-sm">
                      {customer.fullname || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">کد مشتری:</span>
                    <span className="font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full text-sm">
                      {customer.id || "—"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">شماره تماس:</span>
                    <span className="font-medium text-gray-800 text-sm dir-ltr">
                      {customer.phoneNumber || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">تاریخ صدور:</span>
                    <span className="font-medium text-gray-800 text-sm">
                      {formatToJalali(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 px-6 py-4">
            {/* Amount Card with emphasis */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-100 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                    <FaMoneyBillWave className="text-2xl text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">مبلغ پرداختی</h2>
                    <p className="text-sm text-gray-600">Payment Amount</p>
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-emerald-700 mb-3">
                    {formatCurrency(order.amount)}
                  </div>
                  
                  {/* Amount in words */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-2 font-medium">مبلغ به حروف:</div>
                    <div className="text-lg font-bold text-gray-800 leading-relaxed text-center">
                      {amountInWords}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <FaCheckCircle className="text-green-500" />
                    <span>این رسید به عنوان سند پرداخت معتبر می‌باشد</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="grid grid-cols-3 gap-6">
              {/* Signature */}
              <div className="text-center">
                <div className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-gray-400 text-sm">امضا مسئول</span>
                </div>
                <div className="text-xs text-gray-500">امضای مسئول رسید</div>
              </div>

              {/* Stamp */}
              <div className="text-center">
                <div className="h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-2 relative">
                  <div className="absolute inset-0 rounded-full m-2"></div>
                  <span className="text-red-500 text-xs font-bold rotate-12">مهر شرکت</span>
                </div>
                <div className="text-xs text-gray-500">مهر و اثر شرکت</div>
              </div>

              {/* Company Info */}
              <div className="text-center">
                <div className="h-20 flex flex-col items-center justify-center mb-2">
                  <div className="text-lg font-bold text-gray-800">شرکت ما</div>
                  <div className="text-xs text-gray-600 mt-1">تلفن: ۰۷۸۰۱۲۳۴۵۶</div>
                </div>
                <div className="text-xs text-gray-500">اطلاعات شرکت</div>
              </div>
            </div>
          </div>

          {/* Bottom Information */}
          <div className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              شماره پیگیری: {order.id} • این رسید در سیستم مالی شرکت ثبت شده است
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Modern Design */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-center gap-4 print:hidden">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl flex items-center gap-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
          <FaTimes size={16} />
          <span className="font-medium">بستن</span>
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
          <FaPrint size={16} />
          <span className="font-medium">چاپ رسید</span>
        </button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 148mm !important;
            height: 210mm !important;
            margin: 0;
            padding: 10mm;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
          }
          
          /* Hide decorative elements for print */
          #printable-area > div:first-child,
          #printable-area > div:last-child,
          #printable-area .absolute {
            display: none !important;
          }
          
          /* Optimize colors for print */
          #printable-area {
            background: white !important;
            background-image: none !important;
          }
          
          #printable-area .bg-gradient-to-r,
          #printable-area .bg-gradient-to-br {
            background: #f8fafc !important;
          }
          
          /* Ensure text is black for better print */
          #printable-area * {
            color: #000 !important;
            border-color: #e5e7eb !important;
          }
          
          /* Print-specific adjustments */
          .print-hidden {
            display: none !important;
          }
        }
        
        /* Custom direction class */
        .dir-ltr {
          direction: ltr;
        }
        
        /* Ensure proper text wrapping for amount in words */
        .break-words {
          word-break: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
    </div>
  );
};

export default PrintBillOrder;