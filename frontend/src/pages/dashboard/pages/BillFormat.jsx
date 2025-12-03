import React from "react";

export default function BillFormat({ isOpen, data }) {
  return (
    <div
      className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-6 border border-gray-200"
      style={{ direction: "rtl" }}
    >
     

      {/* Bill Fields */}
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between border-b border-gray-200 pb-2"
          >
            <span className="font-medium text-gray-600">{formatLabel(key)}</span>
            <span className="font-semibold text-gray-800">{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center mt-6 text-sm text-gray-500">
        از خرید شما سپاسگزاریم 🌸
      </p>
      <button>X</button>
    </div>
  );
}

// Helper function — makes "customerName" → "Customer Name"
function formatLabel(label) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}
