import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");
const BASE_URL = import.meta.env.VITE_BASE_URL;

const DateOrderDownload = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      alert("لطفاً بازه زمانی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(
        `${BASE_URL}/orderItems/date_range`,
        {
          params: {
            from: fromDate,
            to: toDate,
          },
        }
      );

      if (!data?.data || data.data.length === 0) {
        alert("هیچ اطلاعاتی یافت نشد");
        return;
      }

      const items = data.data;

      // Calculate summary
      const totalCount = items.length;
      const totalMoney = items.reduce(
        (sum, item) => sum + Number(item.money || 0),
        0
      );
      const totalReceipt = items.reduce(
        (sum, item) => sum + Number(item.receipt || 0),
        0
      );
      const totalRemaining = totalMoney - totalReceipt;

      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
      });

      doc.setR2L(false);

      // Font
      doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
      doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
      doc.setFont("Vazirmatn");

      // Title
      doc.setFontSize(14);
      doc.text(
        `گزارش سفارشات از ${fromDate} تا ${toDate}`,
        550,
        120,
        { align: "right" }
      );

      const headers = [
        ["باقیمانده", "دریافتی", "مبلغ", "مشتری", "تعداد", "نام فایل", "سایز", "تاریخ", "شماره"]
      ];

      const body = items.map((item) => [
        (item.money - (item.receipt || 0)),
        (item.receipt || 0),
        (item.money),
        (item.customerName),
        (item.qnty),
        (item.fileName),
        (item.size),
        moment(item.createdAt).format("YYYY/MM/DD"),
        (item.id),
      ]);

      autoTable(doc, {
        startY: 142,
        margin: { top: 142 },
        head: headers,
        body: body,
        theme: "grid",
        styles: {
          font: "Vazirmatn",
          fontSize: 10,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          font: "Vazirmatn",
          fontStyle: "normal",
          fillColor: [220, 220, 220],
          textColor: 20,
          halign: "center",
        },
      });

      const today = moment().format("YYYY/MM/DD");
      const y = doc.lastAutoTable.finalY + 30;

      doc.setFontSize(11);
      doc.text(`مجموع سفارشات: ${totalCount}`, 550, y, { align: "right" });
      doc.text(`مجموع مبلغ: ${totalMoney}`, 550, y + 18, { align: "right" });
      doc.text(`دریافتی: ${totalReceipt}`, 550, y + 36, { align: "right" });
      doc.text(`باقیمانده: ${totalRemaining}`, 550, y + 54, { align: "right" });
      doc.text(`صادر شده: ${today}`, 550, y + 72, { align: "right" });

      doc.save(
        `orders_${moment().format("YYYY-MM-DD")}.pdf`
      );

    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex items-center gap-4">
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="border p-2 rounded"
      />

      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-cyan-800 text-white px-4 py-2 rounded"
      >
        {loading ? "در حال ساخت PDF..." : "دانلود PDF"}
      </button>
    </div>
  );
};

export default DateOrderDownload;
