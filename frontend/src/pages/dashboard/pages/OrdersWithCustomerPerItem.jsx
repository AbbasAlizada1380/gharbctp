// OrdersWithCustomerPerItem.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaSpinner } from "react-icons/fa";
import OrderItemsList from "./OrderItemsList.jsx";
import sizes from "../services/Size.js";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Create empty order items with an extra "customer" field
const createEmptyOrderItems = (count = 5) => {
  return Array.from({ length: count }, () => ({
    size: "",
    qnty: "",
    price: "",
    money: "",
    fileName: "",
    invoiceNumber: "",
    customer: "", // <-- per‑item customer ID
  }));
};

const OrdersWithCustomerPerItem = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [orderItems, setOrderItems] = useState(createEmptyOrderItems(5));
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });

  // Fetch active customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/customers/active`);
        setCustomers(res.data.customers || []);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Handle changes for any field (including customer)
  const handleItemChange = (index, name, value) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index][name] = value;

      // Auto-calculate money
      if (name === "qnty" || name === "price") {
        const qnty = Number(updated[index].qnty) || 0;
        const price = Number(updated[index].price) || 0;
        updated[index].money = qnty * price;
      }
      return updated;
    });
  };

  // Add / delete order items
  const addOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { size: "", qnty: "", price: "", money: "", fileName: "", invoiceNumber: "", customer: "" },
    ]);
  };

  const deleteOrderItem = (index) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Submit – send each non‑empty item as a separate order
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Filter out completely empty rows
    const nonEmptyItems = orderItems.filter(
      (item) =>
        (item.size.trim() !== "" ||
          item.qnty !== "" ||
          item.price !== "" ||
          item.fileName.trim() !== "") &&
        item.customer !== "" // customer must be selected
    );

    if (nonEmptyItems.length === 0) {
      alert("لطفاً حداقل یک مورد سفارش را پر کرده و مشتری را انتخاب کنید.");
      return;
    }

    // Check that every item has a customer
    const missingCustomer = nonEmptyItems.some((item) => !item.customer);
    if (missingCustomer) {
      alert("برای هر مورد سفارش، یک مشتری انتخاب کنید.");
      return;
    }

    setSubmitting(true);
    setSubmitProgress({ current: 0, total: nonEmptyItems.length });

    let successCount = 0;
    let errorCount = 0;

    // Send each item as its own order
    for (let i = 0; i < nonEmptyItems.length; i++) {
      const item = nonEmptyItems[i];
      const payload = {
        customer: item.customer,
        orderItems: [
          {
            size: item.size,
            qnty: Number(item.qnty) || 0,
            price: Number(item.price) || 0,
            money: Number(item.money) || 0,
            fileName: item.fileName,
            invoiceNumber: item.invoiceNumber || "",
          },
        ],
      };

      try {
        await axios.post(`${BASE_URL}/orderItems`, payload);
        successCount++;
      } catch (err) {
        console.error(`Error submitting item ${i + 1}:`, err);
        errorCount++;
      }

      setSubmitProgress((prev) => ({ ...prev, current: i + 1 }));
    }

    setSubmitting(false);

    if (errorCount === 0) {
      alert(`✅ همه ${successCount} سفارش با موفقیت ثبت شدند.`);
      // Reset form
      setOrderItems(createEmptyOrderItems(5));
      setRefreshTrigger((prev) => prev + 1);
    } else {
      alert(`⚠️ ${successCount} سفارش ثبت شد، ${errorCount} مورد با خطا مواجه شد.`);
    }

    setSubmitProgress({ current: 0, total: 0 });
  };

  // Count filled items (for display)
  const filledCount = orderItems.filter(
    (item) => item.size || item.qnty || item.price || item.fileName
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        <h2 className="text-xl font-bold text-cyan-800 mb-6">
          ثبت سفارش با انتخاب مشتری برای هر کالا
        </h2>

        {/* Order Items – each row now includes a customer dropdown */}
        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-md relative bg-white border-gray-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {/* Customer Dropdown */}
                <div>
                  <label className="block mb-1 text-sm font-medium">مشتری</label>
                  <select
                    value={item.customer}
                    onChange={(e) =>
                      handleItemChange(index, "customer", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">انتخاب مشتری</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullname} ({c.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block mb-1 text-sm font-medium">نمبر بیل</label>
                  <input
                    type="text"
                    value={item.invoiceNumber}
                    onChange={(e) =>
                      handleItemChange(index, "invoiceNumber", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="000"
                  />
                </div>

                {/* File Name */}
                <div>
                  <label className="block mb-1 text-sm font-medium">نام فایل</label>
                  <input
                    type="text"
                    value={item.fileName}
                    onChange={(e) =>
                      handleItemChange(index, "fileName", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="example.pdf"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block mb-1 text-sm font-medium">سایز</label>
                  <select
                    value={item.size}
                    onChange={(e) =>
                      handleItemChange(index, "size", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">انتخاب سایز</option>
                    {sizes.map((s) => (
                      <option key={s.id || s} value={s.label || s}>
                        {s.label || s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block mb-1 text-sm font-medium">تعداد</label>
                  <input
                    type="number"
                    min="1"
                    value={item.qnty}
                    onChange={(e) =>
                      handleItemChange(index, "qnty", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block mb-1 text-sm font-medium">قیمت</label>
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(index, "price", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>

                {/* Money (auto‑calculated) */}
                <div>
                  <label className="block mb-1 text-sm font-medium">مجموع مبلغ</label>
                  <input
                    type="number"
                    min="0"
                    value={item.money || ""}
                    className="w-full border rounded-md px-3 py-2 bg-gray-50"
                    placeholder="0"
                    readOnly
                  />
                </div>
              </div>

              {/* Delete button – only when more than 5 items */}
              {orderItems.length > 5 && (
                <button
                  type="button"
                  onClick={() => deleteOrderItem(index)}
                  className="absolute top-6 right-2 text-red-500 hover:text-red-700"
                  title="حذف این مورد"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addOrderItem}
            className="flex items-center gap-2 bg-cyan-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-900 transition"
          >
            <FaPlus /> افزودن مورد جدید (مجموع: {orderItems.length})
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-md transition ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-cyan-800 text-white hover:bg-cyan-900"
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              در حال ثبت سفارشات... ({submitProgress.current}/{submitProgress.total})
            </span>
          ) : (
            `ثبت سفارشات (${filledCount} مورد پر شده)`
          )}
        </button>
      </div>

      {/* List of existing orders (refreshes after new submission) */}
      <div className="mt-4">
        <OrderItemsList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default OrdersWithCustomerPerItem;