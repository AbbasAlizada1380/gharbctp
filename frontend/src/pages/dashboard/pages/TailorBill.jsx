import React, { useRef } from 'react';

interface BillData {
  customerName: string;
  phone: string;
  country: string;
  gender: string;
  clothingType: string;
  height: string;
  sleeve: string;
  waist: string;
  chest: string;
  hip: string;
  skirtLength: string;
  collar: string;
  shoulder: string;
  tailorName: string;
  cutterName: string;
  [key: string]: string;
}

interface PrintableBillProps {
  data: BillData;
  title?: string;
  companyName?: string;
  logoUrl?: string;
}

const PrintableBill: React.FC<PrintableBillProps> = ({
  data,
  title = 'فاکتور سفارش لباس',
  companyName = 'شرکت خیاطی',
  logoUrl
}) => {
  const billRef = useRef<HTMLDivElement>(null);

  const fields = [
    ["نام مشتری", "customerName"],
    ["شماره تماس", "phone"],
    ["کشور", "country"],
    ["جنسیت", "gender"],
    ["نوع لباس", "clothingType"],
    ["قد", "height"],
    ["آستین", "sleeve"],
    ["کمر", "waist"],
    ["سینه", "chest"],
    ["باسن", "hip"],
    ["قد دامن", "skirtLength"],
    ["یقه", "collar"],
    ["شانه", "shoulder"],
    ["اسم خیاط", "tailorName"],
    ["اسم برشکار", "cutterName"]
  ];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && billRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page {
                margin: 20mm;
              }
              body {
                font-family: 'Vazirmatn', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              .bill-container {
                box-shadow: none !important;
                border: 1px solid #000 !important;
              }
            }
            @media screen {
              .print-only {
                display: none;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Vazirmatn', sans-serif;
              direction: rtl;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .bill-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              padding: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0e0e0;
            }
            .logo {
              max-width: 120px;
              max-height: 120px;
              margin-bottom: 15px;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 18px;
              color: #7f8c8d;
              margin-bottom: 20px;
            }
            .bill-number {
              background: #3498db;
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              display: inline-block;
              font-size: 14px;
            }
            .bill-info {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-group {
              margin-bottom: 15px;
            }
            .info-label {
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 5px;
              font-size: 16px;
            }
            .info-value {
              color: #34495e;
              font-size: 18px;
              padding: 8px 0;
              border-bottom: 1px solid #ecf0f1;
            }
            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #2c3e50;
              margin: 25px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #3498db;
            }
            .measurements-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 15px;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .measurement-item {
              display: flex;
              justify-content: space-between;
              padding: 10px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
            }
            .measurement-label {
              font-weight: 600;
              color: #2c3e50;
            }
            .measurement-value {
              color: #e74c3c;
              font-weight: 700;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #bdc3c7;
              text-align: center;
              color: #7f8c8d;
              font-size: 14px;
            }
            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ecf0f1;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              width: 200px;
              border-top: 1px solid #000;
              margin: 40px auto 10px;
            }
            .print-btn {
              background: #27ae60;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-family: 'Vazirmatn', sans-serif;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
              margin-top: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .print-btn:hover {
              background: #219955;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
            }
            .timestamp {
              color: #95a5a6;
              font-size: 14px;
              margin-bottom: 20px;
              text-align: center;
            }
            .watermark {
              position: absolute;
              opacity: 0.1;
              font-size: 120px;
              font-weight: bold;
              color: #000;
              transform: rotate(-45deg);
              z-index: -1;
              top: 40%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            ${billRef.current?.innerHTML || ''}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 100);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="no-print mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200 flex items-center justify-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          چاپ فاکتور
        </button>
        <p className="text-gray-600 mt-2 text-sm">
          برای بهترین نتیجه، از چاپ رنگی استفاده کنید
        </p>
      </div>

      <div 
        ref={billRef}
        className="bill-container bg-white rounded-xl shadow-xl p-8 border border-gray-200"
      >
        {/* Watermark */}
        <div className="watermark print-only">{companyName}</div>

        {/* Header */}
        <div className="header">
          {logoUrl && (
            <img src={logoUrl} alt={companyName} className="logo mx-auto" />
          )}
          <h1 className="title">{title}</h1>
          <p className="company-name">{companyName}</p>
          <div className="bill-number">
            شماره فاکتور: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
          </div>
          <div className="timestamp">{formatDate()}</div>
        </div>

        {/* Customer Information */}
        <div className="section-title">مشخصات مشتری</div>
        <div className="bill-info">
          {fields.slice(0, 5).map(([label, name]) => (
            <div key={name} className="info-group">
              <div className="info-label">{label}</div>
              <div className="info-value">{data[name] || '--'}</div>
            </div>
          ))}
        </div>

        {/* Measurements */}
        <div className="section-title">اندازه‌گیری‌ها</div>
        <div className="measurements-grid">
          {fields.slice(5, 13).map(([label, name]) => (
            <div key={name} className="measurement-item">
              <span className="measurement-label">{label}</span>
              <span className="measurement-value">{data[name] || '--'}</span>
            </div>
          ))}
        </div>

        {/* Tailor Information */}
        <div className="section-title">اطلاعات خیاطی</div>
        <div className="bill-info">
          {fields.slice(13).map(([label, name]) => (
            <div key={name} className="info-group">
              <div className="info-label">{label}</div>
              <div className="info-value">{data[name] || '--'}</div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="section-title">توضیحات</div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <p className="text-gray-700">
            • کلیه اندازه‌ها بر حسب سانتی‌متر می‌باشد
            <br />
            • مدت زمان تحویل: ۱۴ روز کاری
            <br />
            • گارانتی دوخت: ۶ ماه
            <br />
            • در صورت هرگونه مغایرت در اندازه‌ها، ظرف ۲۴ ساعت اطلاع دهید
          </p>
        </div>

        {/* Signatures */}
        <div className="signatures">
          <div className="signature-box">
            <div>امضای مسئول</div>
            <div className="signature-line"></div>
          </div>
          <div className="signature-box">
            <div>امضای مشتری</div>
            <div className="signature-line"></div>
            <div className="text-sm text-gray-600 mt-2">تأیید صحت اندازه‌ها</div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>
            آدرس: تهران، خیابان ولیعصر، پلاک ۱۲۳۴ | تلفن: ۰۲۱-۱۲۳۴۵۶۷۸
            <br />
            ایمیل: info@example.com | وبسایت: www.example.com
          </p>
          <p className="mt-2 text-xs">
            این فاکتور در تاریخ {formatDate()} صادر شده است.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableBill;

interface PrintableBillProps {
  data: BillData;
  title?: string;
  companyName?: string;
  logoUrl?: string;
}

const PrintableBill: React.FC<PrintableBillProps> = ({
  data,
  title = 'فاکتور سفارش لباس',
  companyName = 'شرکت خیاطی',
  logoUrl
}) => {
  const billRef = useRef<HTMLDivElement>(null);

  const fields = [
    ["نام مشتری", "customerName"],
    ["شماره تماس", "phone"],
    ["کشور", "country"],
    ["جنسیت", "gender"],
    ["نوع لباس", "clothingType"],
    ["قد", "height"],
    ["آستین", "sleeve"],
    ["کمر", "waist"],
    ["سینه", "chest"],
    ["باسن", "hip"],
    ["قد دامن", "skirtLength"],
    ["یقه", "collar"],
    ["شانه", "shoulder"],
    ["اسم خیاط", "tailorName"],
    ["اسم برشکار", "cutterName"]
  ];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && billRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page {
                margin: 20mm;
              }
              body {
                font-family: 'Vazirmatn', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              .bill-container {
                box-shadow: none !important;
                border: 1px solid #000 !important;
              }
            }
            @media screen {
              .print-only {
                display: none;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Vazirmatn', sans-serif;
              direction: rtl;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .bill-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              padding: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0e0e0;
            }
            .logo {
              max-width: 120px;
              max-height: 120px;
              margin-bottom: 15px;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 18px;
              color: #7f8c8d;
              margin-bottom: 20px;
            }
            .bill-number {
              background: #3498db;
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              display: inline-block;
              font-size: 14px;
            }
            .bill-info {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-group {
              margin-bottom: 15px;
            }
            .info-label {
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 5px;
              font-size: 16px;
            }
            .info-value {
              color: #34495e;
              font-size: 18px;
              padding: 8px 0;
              border-bottom: 1px solid #ecf0f1;
            }
            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #2c3e50;
              margin: 25px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #3498db;
            }
            .measurements-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 15px;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .measurement-item {
              display: flex;
              justify-content: space-between;
              padding: 10px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
            }
            .measurement-label {
              font-weight: 600;
              color: #2c3e50;
            }
            .measurement-value {
              color: #e74c3c;
              font-weight: 700;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #bdc3c7;
              text-align: center;
              color: #7f8c8d;
              font-size: 14px;
            }
            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ecf0f1;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              width: 200px;
              border-top: 1px solid #000;
              margin: 40px auto 10px;
            }
            .print-btn {
              background: #27ae60;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-family: 'Vazirmatn', sans-serif;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
              margin-top: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .print-btn:hover {
              background: #219955;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
            }
            .timestamp {
              color: #95a5a6;
              font-size: 14px;
              margin-bottom: 20px;
              text-align: center;
            }
            .watermark {
              position: absolute;
              opacity: 0.1;
              font-size: 120px;
              font-weight: bold;
              color: #000;
              transform: rotate(-45deg);
              z-index: -1;
              top: 40%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            ${billRef.current?.innerHTML || ''}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 100);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="no-print mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200 flex items-center justify-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          چاپ فاکتور
        </button>
        <p className="text-gray-600 mt-2 text-sm">
          برای بهترین نتیجه، از چاپ رنگی استفاده کنید
        </p>
      </div>

      <div 
        ref={billRef}
        className="bill-container bg-white rounded-xl shadow-xl p-8 border border-gray-200"
      >
        {/* Watermark */}
        <div className="watermark print-only">{companyName}</div>

        {/* Header */}
        <div className="header">
          {logoUrl && (
            <img src={logoUrl} alt={companyName} className="logo mx-auto" />
          )}
          <h1 className="title">{title}</h1>
          <p className="company-name">{companyName}</p>
          <div className="bill-number">
            شماره فاکتور: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
          </div>
          <div className="timestamp">{formatDate()}</div>
        </div>

        {/* Customer Information */}
        <div className="section-title">مشخصات مشتری</div>
        <div className="bill-info">
          {fields.slice(0, 5).map(([label, name]) => (
            <div key={name} className="info-group">
              <div className="info-label">{label}</div>
              <div className="info-value">{data[name] || '--'}</div>
            </div>
          ))}
        </div>

        {/* Measurements */}
        <div className="section-title">اندازه‌گیری‌ها</div>
        <div className="measurements-grid">
          {fields.slice(5, 13).map(([label, name]) => (
            <div key={name} className="measurement-item">
              <span className="measurement-label">{label}</span>
              <span className="measurement-value">{data[name] || '--'}</span>
            </div>
          ))}
        </div>

        {/* Tailor Information */}
        <div className="section-title">اطلاعات خیاطی</div>
        <div className="bill-info">
          {fields.slice(13).map(([label, name]) => (
            <div key={name} className="info-group">
              <div className="info-label">{label}</div>
              <div className="info-value">{data[name] || '--'}</div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="section-title">توضیحات</div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <p className="text-gray-700">
            • کلیه اندازه‌ها بر حسب سانتی‌متر می‌باشد
            <br />
            • مدت زمان تحویل: ۱۴ روز کاری
            <br />
            • گارانتی دوخت: ۶ ماه
            <br />
            • در صورت هرگونه مغایرت در اندازه‌ها، ظرف ۲۴ ساعت اطلاع دهید
          </p>
        </div>

        {/* Signatures */}
        <div className="signatures">
          <div className="signature-box">
            <div>امضای مسئول</div>
            <div className="signature-line"></div>
          </div>
          <div className="signature-box">
            <div>امضای مشتری</div>
            <div className="signature-line"></div>
            <div className="text-sm text-gray-600 mt-2">تأیید صحت اندازه‌ها</div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>
            آدرس: تهران، خیابان ولیعصر، پلاک ۱۲۳۴ | تلفن: ۰۲۱-۱۲۳۴۵۶۷۸
            <br />
            ایمیل: info@example.com | وبسایت: www.example.com
          </p>
          <p className="mt-2 text-xs">
            این فاکتور در تاریخ {formatDate()} صادر شده است.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableBill;