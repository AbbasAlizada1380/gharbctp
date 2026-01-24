import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const CustomerOrderDownload = ({ customerId }) => {
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!type) {
      alert("لطفاً نوع گزارش را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(
        `${BASE_URL}/orderItems/${customerId}/${type}`
      );

      if (!data?.items || data.items.length === 0) {
        alert("هیچ اطلاعاتی یافت نشد");
        return;
      }
      const toFaNumber = (value) => {
        if (value === null || value === undefined) return "";
        return value.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
      };

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
        `گزارش ${getTypeTitle(type)} - ${data.customerName}`,
        550,
        120,
        { align: "right" }
      );

      // Table headers
      const headers = [
        [
          "شماره سفارش",
          "تاریخ",
          "مبلغ",
          "دریافتی",
          "باقیمانده",
          "وضعیت",
        ]
      ];

      // Table data
      const body = data.items.map((item) => [
        item.status === "paid" ? "پرداخت‌شده" : "باقیمانده‌دار",
        toFaNumber(item.remaining),
        toFaNumber(item.receipt),
        toFaNumber(item.money),
        moment(item.createdAt).format("jYYYY/jMM/jDD"),
        toFaNumber(item.id), // ✅ FIXED
      ]);

      doc.setR2L(false);

      autoTable(doc, {
        startY: 142,          // first page (5cm)
        margin: { top: 142 }, // 👈 ALL pages (5cm)

        head: [[
          "شماره سفارش",
          "تاریخ",
          "مبلغ",
          "دریافتی",
          "باقیمانده",
          "وضعیت",
        ]],

        body: data.items.map((item) => [
          toFaNumber(item.id),
          moment(item.createdAt).format("jYYYY/jMM/jDD"),
          toFaNumber(item.money),
          toFaNumber(item.receipt),
          toFaNumber(item.remaining),
          item.status === "paid" ? "پرداخت‌شده" : "باقیمانده‌دار",
        ]),

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


      // Summary
      const y = doc.lastAutoTable.finalY + 30;
      doc.setFontSize(11);
      doc.text(`مجموع سفارشات: ${data.totalCount.toLocaleString("fa-Af")}.`, 550, y, {
        align: "right",
      });
      doc.text(
        `مجموع مبلغ: ${data.totalMoney.toLocaleString("fa-AF")}`,
        550,
        y + 18,
        { align: "right" }
      );
      doc.text(
        `دریافتی: ${data.totalReceipt.toLocaleString("fa-AF")}`,
        550,
        y + 36,
        { align: "right" }
      );
      doc.text(
        `باقیمانده: ${data.totalRemaining.toLocaleString("fa-AF")}`,
        550,
        y + 54,
        { align: "right" }
      );

      doc.save(
        `${type}_${data.customerName}_${moment().format(
          "jYYYY-jMM-jDD"
        )}.pdf`
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
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border p-2 rounded bg-white text-black"
      >
        <option value="" className="text-black bg-white">
          انتخاب نوع گزارش
        </option>
        <option value="orderId" className="text-black bg-white">
          تمام سفارشات
        </option>
        <option value="receiptOrders" className="text-black bg-white">
          سفارشات پرداخت‌شده
        </option>
        <option value="remainOrders" className="text-black bg-white">
          سفارشات باقیمانده
        </option>
      </select>


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

export default CustomerOrderDownload;

// helpers
function getTypeTitle(type) {
  switch (type) {
    case "orderId":
      return "تمام سفارشات";
    case "receiptOrders":
      return "سفارشات پرداخت‌شده";
    case "remainOrders":
      return "سفارشات باقیمانده";
    default:
      return "";
  }
}
