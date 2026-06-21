// OrdersWithTabs.jsx
import { useState } from "react";
import Orders from "./Orders";
import OrdersWithCustomerPerItem from "./OrdersWithCustomerPerItem";

const OrdersWithTabs = () => {
  const [activeTab, setActiveTab] = useState("single"); // "single" or "perItem"

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Tab Buttons */}
        <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 mb-6">
          <button
            onClick={() => setActiveTab("single")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === "single"
                ? "bg-white text-cyan-800 shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ثبت سفارش با یک مشتری
          </button>
          <button
            onClick={() => setActiveTab("perItem")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === "perItem"
                ? "bg-white text-cyan-800 shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ثبت سفارش با مشتری جداگانه برای هر کالا
          </button>
        </div>

        {/* Render active component */}
        {activeTab === "single" ? <Orders /> : <OrdersWithCustomerPerItem />}
      </div>
    </div>
  );
};

export default OrdersWithTabs;