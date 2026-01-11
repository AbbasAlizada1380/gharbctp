import React from "react";
import { FaTrash } from "react-icons/fa";
import sizes from "../services/Size.js";

const OrderItemForm = ({ item, index, handleItemChange, deleteOrderItem, canDelete }) => {
  return (
    <div className="p-4 border border-gray-300 rounded-md relative bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Size */}
        <div>
          <label className="block mb-1 text-sm font-medium">سایز</label>
          <select
            value={item.size}
            onChange={(e) => handleItemChange(index, "size", e.target.value)}
            required
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
            onChange={(e) => handleItemChange(index, "qnty", e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block mb-1 text-sm font-medium">قیمت</label>
          <input
            type="number"
            min="0"
            value={item.price}
            onChange={(e) => handleItemChange(index, "price", e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* File Name */}
        <div>
          <label className="block mb-1 text-sm font-medium">نام فایل</label>
          <input
            type="text"
            value={item.fileName}
            onChange={(e) => handleItemChange(index, "fileName", e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            placeholder="example.pdf"
          />
        </div>

        {/* Money */}
        <div>
          <label className="block mb-1 text-sm font-medium">مجموع مبلغ</label>
          <input
            type="number"
            min="0"
            value={item.money}
            onChange={(e) => handleItemChange(index, "money", e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-gray-50"
          />
        </div>
      </div>

      {/* Delete Button */}
      {canDelete && (
        <button
          type="button"
          onClick={() => deleteOrderItem(index)}
          className="absolute top-2 right-2 text-red-500"
        >
          <FaTrash />
        </button>
      )}
    </div>
  );
};

export default OrderItemForm;
