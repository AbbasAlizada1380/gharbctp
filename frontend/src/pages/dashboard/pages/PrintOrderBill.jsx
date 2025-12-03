import React, { useEffect, useRef } from "react";
import moment from "moment-jalaali";
import { FaPhone, FaPrint, FaTimes, FaUser, FaRuler, FaTshirt, FaUserTie, FaCut } from "react-icons/fa";
import jalaali from "jalaali-js";

const PrintBillOrder = ({ isOpen, onClose, order, autoPrint = false }) => {
  const hasAutoPrintedRef = useRef(false);
  const printTimeoutRef = useRef(null);
console.log(order)
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

  const handlePrint = () => {
    window.print();
  };

  // Format currency (if needed in future)
  const formatCurrency = (num) => {
    const number = Number(num || 0);
    return number + " افغانی";
  };

  // Generate bill number
  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `B${year}${month}${day}${random}`;
  };

  // Get current date in Persian
  const getPersianDate = () => {
    const now = new Date();
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const year = now.getFullYear().toString().replace(/\d/g, d => persianNumbers[d]);
    const month = (now.getMonth() + 1).toString().padStart(2, '0').replace(/\d/g, d => persianNumbers[d]);
    const day = now.getDate().toString().padStart(2, '0').replace(/\d/g, d => persianNumbers[d]);
    return `${year}/${month}/${day}`;
  };

  // Format to Jalali with time
  function formatToJalali(dateString) {
    const date = dateString ? new Date(dateString) : new Date();
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
    return `${jy}/${pad(jm)}/${pad(jd)}, ${pad(hours)}:${pad(minutes)} ${ampm}`;
  }

  // Clothing type options mapping
  const clothingTypeOptions = {
    "suit": "کت و شلوار",
    "shirt": "پیراهن",
    "dress": "لباس",
    "skirt": "دامن",
    "trousers": "شلوار",
    "blouse": "بلوز"
  };

  // Gender options mapping
  const genderOptions = {
    "male": "مرد",
    "female": "زن"
  };

  // Extract and prepare data from order
  const billNumber = generateBillNumber();
  const persianDate = getPersianDate();
  const fullDate = formatToJalali();

  // Prepare measurements for display
  const measurements = [
    { label: "قد", value: order.height, unit: "cm" },
    { label: "آستین", value: order.sleeve, unit: "cm" },
    { label: "کمر", value: order.waist, unit: "cm" },
    { label: "سینه", value: order.chest, unit: "cm" },
    { label: "باسن", value: order.hip, unit: "cm" },
    { label: "قد تنبان", value: order.skirtLength, unit: "cm" },
    { label: "یقه", value: order.collar, unit: "cm" },
    { label: "شانه", value: order.shoulder, unit: "cm" },
    // { label: "مجموع", value: order.total, unit: "Af" },
    // { label: "دریافتی", value: order.received, unit: "Af" },
    // { label: "باقی", value: order.remianed, unit: "Af" }
  ].filter(item => item.value && item.value.trim() !== "");

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
      {/* A5 Container */}
      <div className="px-5">
        <div
          id="printable-area"
          className="bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col print:shadow-none print:rounded-none"
          style={{
            width: "148mm",
            height: "210mm",
            direction: "rtl",
          }}
        >
          {/* Header with Logo and Title */}
          <div
            id="header-area"
            className="flex items-center justify-between bg-gradient-to-l from-green-600 to-emerald-700 text-white py-4 px-4 text-center relative"
          >
           <img className="w-16 h-16 rounded-full" src="/logo.png" alt="image" />
            <div><h1 className="text-xl font-bold mb-1">نمایشگاه لباس و خیاطی صلصال برند</h1>
            <p className="text-xs text-green-100 mb-2">خدمات طراحی و دوخت انواع لباس های افغانی</p></div>
            <div className=" flex flex-col text-right text-sm">
              <span>شماره فاکتور: {billNumber}</span>
              <span>تاریخ: {persianDate}</span>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FaUser className="text-green-600" />
              <h2 className="text-sm font-bold text-gray-700">اطلاعات مشتری</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">نام مشتری:</span>
                  <span className="font-semibold">{order.customerName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">شماره تماس:</span>
                  <span className="font-semibold">{order.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">کشور:</span>
                  <span className="font-semibold">{order.country || "—"}</span>
                </div>
              </div>
              
              <div className="space-y-1 border-r pr-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">جنسیت:</span>
                  <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {genderOptions[order.gender] || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">نوع لباس:</span>
                  <span className="font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                    {clothingTypeOptions[order.clothingType] || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">تاریخ تحویل:</span>
                  <span className="font-semibold text-green-600">۱۰ روز کاری</span>
                </div>
              </div>
            </div>
          </div>

          {/* Measurements Section */}
          <div className="p-4 border-b border-gray-200 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <FaRuler className="text-blue-600" />
              <h2 className="text-sm font-bold text-gray-700">اندازه‌های سفارش (سانتی‌متر)</h2>
            </div>
            
            {measurements.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {measurements.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-2 text-center shadow-sm"
                  >
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    <div className="text-lg font-bold text-gray-800">{item.value}</div>
                    <div className="text-xs text-gray-400 mt-1">سانتی‌متر</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                هیچ اندازه‌ای وارد نشده است
              </div>
            )}
          </div>

          {/* Staff Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FaUserTie className="text-purple-600" />
              <h2 className="text-sm font-bold text-gray-700">پرسنل مسئول</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {order.tailorName && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaTshirt className="text-purple-600" />
                    <span className="text-xs text-purple-700 font-semibold">خیاط مسئول</span>
                  </div>
                  <div className="text-sm font-bold text-gray-800 text-center">{order.tailorName}</div>
                </div>
              )}
              
              {order.cutterName && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCut className="text-orange-600" />
                    <span className="text-xs text-orange-700 font-semibold">برشکار مسئول</span>
                  </div>
                  <div className="text-sm font-bold text-gray-800 text-center">{order.cutterName}</div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Footer */}
          <div className="flex border-t border-gray-300 bg-gray-50">
            {/* Left Section - Order Details */}
            <div className="w-1/2 border-l border-gray-300 p-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-bold">مجموع:</span>
                  <span className="text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {order.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm font-bold">دریافتی:</span>
                  <span className="text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold">{order.received}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm font-bold">باقی:</span>
                  <span className="text-red-800 px-2 py-0.5 rounded-full text-xs font-semibold">{order.remained}</span>
                </div>
              
              </div>
            </div>

            {/* Right Section - Signature */}
            <div className="w-1/2 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg">
                <p className="text-gray-600 text-sm font-semibold mb-2">محل امضاء و مُهر</p>
              </div>
           
            </div>
          </div>

          {/* Footer */}
          <div
            id="footer-area"
            className="bg-gray-800 text-white p-3 text-center text-xs"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center gap-2">
                <FaPhone className="text-green-300" />
                <span> تماس: 0780177060: 0774610613</span>
              </div>
              <div className="text-gray-300 text-xs">
        آدرس :کابل کوته سنگی رابی سنتر منزل 4 دوکان نمبر 13_21
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Hide during auto-print */}
      {
        <div className="absolute bottom-6 left-6 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <FaTimes size={14} /> بستن
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <FaPrint size={14} /> چاپ فاکتور
          </button>
        </div>
      }

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
            padding: 0;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
          }
          #header-area {
            background-color: #059669 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #footer-area {
            background-color: #1f2937 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
          
          /* Ensure gradients and backgrounds print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Hide scrollbars for print */
        @media print {
          ::-webkit-scrollbar {
            display: none;
          }
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PrintBillOrder;