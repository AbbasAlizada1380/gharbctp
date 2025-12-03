import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PrintOrderBill from "./PrintOrderBill"

const Bills = () => {
  const formFields = [
    ["نام مشتری", "customerName", "text"],
    ["شماره تماس", "phone", "tel"],
    ["کشور", "country", "text"],
    ["جنسیت", "gender", "select"],
    ["نوع لباس", "clothingType", "select"],
    ["قد", "height", "number"],
    ["آستین", "sleeve", "number"],
    ["کمر", "waist", "number"],
    ["سینه", "chest", "number"],
    ["باسن", "hip", "number"],
    ["قد تنبان", "skirtLength", "number"],
    ["یقه", "collar", "number"],
    ["شانه", "shoulder", "number"],
    ["مجموع", "total", "number"],
    ["دریافتی ", "received", "number"],
    ["باقی ", "remained", "number"],
    ["اسم خیاط", "tailorName", "text"],
    ["اسم برشکار", "cutterName", "text"]
  ];

  const genderOptions = [
    { value: "", label: "انتخاب کنید" },
    { value: "male", label: "مرد" },
    { value: "female", label: "زن" }
  ];

  const clothingTypeOptions = [
    { value: "", label: "انتخاب کنید" },
    { value: "suit", label: "کت و شلوار" },
    { value: "shirt", label: "پیراهن" },
    { value: "dress", label: "لباس" },
    { value: "skirt", label: "دامن" },
    { value: "trousers", label: "شلوار" },
    { value: "blouse", label: "بلوز" }
  ];

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    country: '',
    gender: '',
    clothingType: '',
    height: '',
    sleeve: '',
    waist: '',
    chest: '',
    hip: '',
    skirtLength: '',
    collar: '',
    shoulder: '',
    tailorName: '',
    cutterName: ''
  });

  const [isBillOpen, setIsBillOpen] = useState(false);
  const billRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  const handleCloseBill = () => {
    setIsBillOpen(false);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    alert('اطلاعات با موفقیت ثبت شد');
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      phone: '',
      country: '',
      gender: '',
      clothingType: '',
      height: '',
      sleeve: '',
      waist: '',
      chest: '',
      hip: '',
      skirtLength: '',
      collar: '',
      shoulder: '',
      tailorName: '',
      cutterName: ''
    });
  };

  const getPersianDate = () => {
    const now = new Date();
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const year = now.getFullYear().toString().replace(/\d/g, d => persianNumbers[d]);
    const month = (now.getMonth() + 1).toString().padStart(2, '0').replace(/\d/g, d => persianNumbers[d]);
    const day = now.getDate().toString().padStart(2, '0').replace(/\d/g, d => persianNumbers[d]);
    return `${year}/${month}/${day}`;
  };

  const generateBillNumber = () => {
    return `BILL-${Date.now().toString().slice(-8)}`;
  };

  const downloadPDF = async () => {


    try {
      setIsBillOpen(!isBillOpen)
     } catch (error) { }
  };
  // const downloadPDF = async () => {
  //   if (!formData.customerName || !formData.phone) {
  //     alert('لطفا نام مشتری و شماره تماس را وارد کنید');
  //     return;
  //   }

  //   try {
  //     // Create a temporary div for PDF generation with simple styles
  //     const tempDiv = document.createElement('div');
  //     tempDiv.style.width = '210mm';
  //     tempDiv.style.minHeight = '297mm';
  //     tempDiv.style.padding = '20mm';
  //     tempDiv.style.backgroundColor = 'white';
  //     tempDiv.style.direction = 'rtl';
  //     tempDiv.style.fontFamily = 'Arial, sans-serif';

  //     // Bill content with simple CSS
  //     tempDiv.innerHTML = `
  //       <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px;">
  //         <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #222;">فاکتور رسمی خیاطی</h1>
  //         <p style="color: #666; margin: 5px 0;">شماره فاکتور: ${generateBillNumber()}</p>
  //         <p style="color: #666; margin: 5px 0;">تاریخ: ${getPersianDate()}</p>
  //       </div>

  //       <div style="margin-bottom: 30px;">
  //         <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-right: 10px; border-right: 4px solid #4CAF50;">
  //           اطلاعات مشتری
  //         </h2>
  //         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  //           <div>
  //             <p style="color: #333; margin: 8px 0;"><span style="font-weight: bold;">نام مشتری:</span> ${formData.customerName}</p>
  //             <p style="color: #333; margin: 8px 0;"><span style="font-weight: bold;">شماره تماس:</span> ${formData.phone}</p>
  //             <p style="color: #333; margin: 8px 0;"><span style="font-weight: bold;">کشور:</span> ${formData.country}</p>
  //           </div>
  //           <div>
  //             <p style="color: #333; margin: 8px 0;"><span style="font-weight: bold;">جنسیت:</span> ${genderOptions.find(g => g.value === formData.gender)?.label || ''}</p>
  //             <p style="color: #333; margin: 8px 0;"><span style="font-weight: bold;">نوع لباس:</span> ${clothingTypeOptions.find(c => c.value === formData.clothingType)?.label || ''}</p>
  //           </div>
  //         </div>
  //       </div>

  //       <div style="margin-bottom: 30px;">
  //         <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-right: 10px; border-right: 4px solid #2196F3;">
  //           اندازه‌های سفارش (سانتی‌متر)
  //         </h2>
  //         <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
  //           ${formData.height ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">قد</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.height}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.sleeve ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">آستین</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.sleeve}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.waist ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">کمر</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.waist}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.chest ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">سینه</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.chest}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.hip ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">باسن</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.hip}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.skirtLength ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">قد تنبان</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.skirtLength}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.collar ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">یقه</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.collar}</p>
  //             </div>
  //           ` : ''}
  //           ${formData.shoulder ? `
  //             <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
  //               <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">شانه</p>
  //               <p style="font-size: 24px; font-weight: bold; color: #222; margin: 0;">${formData.shoulder}</p>
  //             </div>
  //           ` : ''}
  //         </div>
  //       </div>

  //       ${(formData.tailorName || formData.cutterName) ? `
  //         <div style="margin-bottom: 30px;">
  //           <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-right: 10px; border-right: 4px solid #9C27B0;">
  //             پرسنل اجرایی
  //           </h2>
  //           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  //             ${formData.tailorName ? `
  //               <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
  //                 <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">خیاط مسئول</p>
  //                 <p style="font-size: 20px; font-weight: bold; color: #222; margin: 0;">${formData.tailorName}</p>
  //               </div>
  //             ` : ''}
  //             ${formData.cutterName ? `
  //               <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
  //                 <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">برشکار مسئول</p>
  //                 <p style="font-size: 20px; font-weight: bold; color: #222; margin: 0;">${formData.cutterName}</p>
  //               </div>
  //             ` : ''}
  //           </div>
  //         </div>
  //       ` : ''}

  //       <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #333; text-align: center;">
  //         <p style="color: #666; margin: 10px 0; font-size: 16px;">تاریخ تحویل: ۱۰ روز کاری پس از تأیید نهایی</p>
  //         <p style="color: #222; font-weight: bold; font-size: 18px; margin: 15px 0;">با تشکر از اعتماد شما</p>
  //         <p style="color: #777; font-size: 14px; margin-top: 20px;">این فاکتور به صورت رسمی صادر شده و ملاک انجام سفارش می‌باشد</p>
  //       </div>
  //     `;

  //     document.body.appendChild(tempDiv);

  //     const canvas = await html2canvas(tempDiv, {
  //       scale: 2,
  //       backgroundColor: '#ffffff',
  //       useCORS: true,
  //       logging: true,
  //       onclone: (clonedDoc) => {
  //         // Ensure proper rendering in cloned document
  //         const clonedDiv = clonedDoc.body.lastChild;
  //         clonedDiv.style.width = '210mm';
  //         clonedDiv.style.minHeight = '297mm';
  //       }
  //     });

  //     document.body.removeChild(tempDiv);

  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     const imgWidth = 190;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     const marginLeft = (210 - imgWidth) / 2;

  //     pdf.addImage(imgData, 'PNG', marginLeft, 10, imgWidth, imgHeight);
  //     pdf.save(`فاکتور_${formData.customerName}_${generateBillNumber()}.pdf`);

  //     alert('فاکتور با موفقیت دانلود شد');

  //   } catch (error) {
  //     console.error('Error generating PDF:', error);
  //     alert('خطا در ایجاد فاکتور. لطفا دوباره تلاش کنید.');
  //   }
  // };

  const downloadText = () => {
    if (!formData.customerName || !formData.phone) {
      alert('لطفا نام مشتری و شماره تماس را وارد کنید');
      return;
    }

    const billContent = `
========================================
            فاکتور خیاطی
========================================
شماره فاکتور: ${generateBillNumber()}
تاریخ: ${getPersianDate()}

اطلاعات مشتری:
---------------
• نام مشتری: ${formData.customerName}
• شماره تماس: ${formData.phone}
• کشور: ${formData.country}
• جنسیت: ${genderOptions.find(g => g.value === formData.gender)?.label || ''}

جزئیات سفارش:
---------------
• نوع لباس: ${clothingTypeOptions.find(c => c.value === formData.clothingType)?.label || ''}

اندازه‌ها (سانتی‌متر):
----------------------
${formData.height ? `• قد: ${formData.height}` : ''}
${formData.sleeve ? `• آستین: ${formData.sleeve}` : ''}
${formData.waist ? `• کمر: ${formData.waist}` : ''}
${formData.chest ? `• سینه: ${formData.chest}` : ''}
${formData.hip ? `• باسن: ${formData.hip}` : ''}
${formData.skirtLength ? `• قد تنبان: ${formData.skirtLength}` : ''}
${formData.collar ? `• یقه: ${formData.collar}` : ''}
${formData.shoulder ? `• شانه: ${formData.shoulder}` : ''}

پرسنل:
------
${formData.tailorName ? `• خیاط: ${formData.tailorName}` : ''}
${formData.cutterName ? `• برشکار: ${formData.cutterName}` : ''}

========================================
    با تشکر از اعتماد شما
========================================
تاریخ تحویل: ۱۰ روز کاری
`;

    const blob = new Blob([billContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `فاکتور_${formData.customerName}_${generateBillNumber()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('فاکتور متنی با موفقیت دانلود شد');
  };

  const renderField = ([label, name, type]) => {
    switch (type) {
      case 'select':
        if (name === 'gender') {
          return (
            <div className="flex flex-col space-y-1" key={name}>
              <label htmlFor={name} className="text-sm font-medium text-gray-700">
                {label}:
              </label>
              <select
                id={name}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        } else if (name === 'clothingType') {
          return (
            <div className="flex flex-col space-y-1" key={name}>
              <label htmlFor={name} className="text-sm font-medium text-gray-700">
                {label}:
              </label>
              <select
                id={name}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                {clothingTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        break;

      case 'number':
        return (
          <div className="flex flex-col space-y-1" key={name}>
            <label htmlFor={name} className="text-sm font-medium text-gray-700">
              {label} (سانتی‌متر):
            </label>
            <input
              type="number"
              id={name}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder={`${label} را وارد کنید`}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-left dir-ltr"
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col space-y-1" key={name}>
            <label htmlFor={name} className="text-sm font-medium text-gray-700">
              {label}:
            </label>
            <input
              type={type}
              id={name}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={`${label} را وارد کنید`}
              required={name === 'customerName' || name === 'phone'}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            فرم ثبت سفارش خیاطی
          </h1>
          <p className="text-gray-600 text-lg">
            لطفا اطلاعات مشتری و اندازه‌ها را وارد کنید
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {formFields.map(field => renderField(field))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 focus:outline-none transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    ثبت اطلاعات
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 focus:outline-none transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    پاک کردن فرم
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Download Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-600 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              دانلود فاکتور
            </h3>
            <p className="text-blue-100 mb-6">فاکتور طراحی شده سفارش را دانلود کنید</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadPDF}
                className="flex-1 bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                دانلود PDF
              </button>
              
            </div>
          </div>

          <div className="bg-purple-600 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              خلاصه سفارش
            </h3>
            <div className="text-white space-y-2">
              <p className="flex justify-between">
                <span>نام مشتری:</span>
                <span className="font-bold">{formData.customerName || '---'}</span>
              </p>
              <p className="flex justify-between">
                <span>نوع لباس:</span>
                <span className="font-bold">
                  {clothingTypeOptions.find(c => c.value === formData.clothingType)?.label || '---'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>تاریخ فاکتور:</span>
                <span className="font-bold">{getPersianDate()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 ml-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                پیش‌نمایش اطلاعات
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {Object.values(formData).filter(val => val !== '').length} / {Object.keys(formData).length} فیلد پر شده
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <pre className="text-sm text-gray-700 overflow-x-auto font-mono">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg ml-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">تعداد فیلدها</p>
                <p className="text-xl font-bold text-gray-800">{formFields.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg ml-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">فیلدهای اجباری</p>
                <p className="text-xl font-bold text-gray-800">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg ml-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">درصد تکمیل</p>
                <p className="text-xl font-bold text-gray-800">
                  {Math.round((Object.values(formData).filter(val => val !== '').length / Object.keys(formData).length) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isBillOpen && (
        <div className="relative ">
          <PrintOrderBill
            isOpen={isBillOpen}
            onClose={handleCloseBill}
            order={formData}
          />
        </div>
      )}
    </div>
  );
};

export default Bills;