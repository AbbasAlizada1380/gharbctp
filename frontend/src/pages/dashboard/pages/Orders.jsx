import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DigitalSection from "./DigitalSection";
import OffsetSection from "./OffsetSection";
import BillSummary from "./BillSummary";
// import PrintOrderBill from "./PrintOrderBill.jsx";
import { FaCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";
import Pagination from "../pagination/Pagination.jsx";
import { IoIosPrint } from "react-icons/io";
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../services/ServiceManager.js";
import {
  FaUser,
  FaPhone,
  FaMoneyBillWave,
  FaFileInvoice,
  FaSave,
  FaEye,
  FaPrint,
  FaLayerGroup,
  FaEdit,
  FaTimes,
  FaIdCard,
} from "react-icons/fa";
import { useSelector } from "react-redux";

const Orders = () => {
  const { currentUser } = useSelector((state) => state.user);
  // Default empty digital item
  const defaultDigitalItem = {
    name: "",
    quantity: null,
    height: null,
    weight: null,
    area: null,
    price_per_unit: null,
    money: null,
  };

  // Default empty offset item
  const defaultOffsetItem = {
    name: "",
    quantity: null,
    price_per_unit: null,
    money: null,
  };

  // Helper function to check if a digital item is filled
  const isDigitalItemFilled = (item) => {
    return (
      item.name.trim() !== "" ||
      item.quantity > 0 ||
      item.height > 0 ||
      item.weight > 0 ||
      item.price_per_unit > 0 ||
      item.money > 0
    );
  };

  // Helper function to check if an offset item is filled
  const isOffsetItemFilled = (item) => {
    return (
      item.name.trim() !== "" ||
      item.quantity > 0 ||
      item.price_per_unit > 0 ||
      item.money > 0
    );
  };

  // Helper function to filter out empty items before sending to backend
  const prepareRecordForSubmit = (record) => {
    const filteredDigital = record.digital.filter(isDigitalItemFilled);
    const filteredOffset = record.offset.filter(isOffsetItemFilled);

    return {
      ...record,
      digital: filteredDigital,
      offset: filteredOffset,
    };
  };

  const [record, setRecord] = useState({
    customer: { name: "", phone_number: "" },
    digital: Array(5)
      .fill()
      .map(() => ({ ...defaultDigitalItem })), // 5 empty digital forms
    offset: Array(5)
      .fill()
      .map(() => ({ ...defaultOffsetItem })), // 5 empty offset forms
    total_money_digital: 0,
    total_money_offset: 0,
    total: 0,
    digitalId: 0,
    recip: null,
    remained: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orders, setOrders] = useState([]);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeSection, setActiveSection] = useState("digital");
  const [editMode, setEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [savedOrderForPrint, setSavedOrderForPrint] = useState(null);

  const fetchOrders = async (page = 1) => {
    const data = await getOrders(page, 20);
    setOrders(data.orders);
    setCurrentPage(data.currentPage);
    setTotalPages(data.totalPages);
  };

  const onPageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      fetchOrders(pageNumber);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, []);

  useEffect(() => {
    if (!record) return;

    const totalDigital = (record.digital || []).reduce(
      (sum, d) => sum + Number(d.money || 0),
      0
    );
    const totalOffset = (record.offset || []).reduce(
      (sum, o) => sum + Number(o.money || 0),
      0
    );
    const total = totalDigital + totalOffset;

    setRecord((prev) => ({
      ...prev,
      total_money_digital: Number(totalDigital.toFixed(2)),
      total_money_offset: Number(totalOffset.toFixed(2)),
      total: Number(total.toFixed(2)),
      remained: Number((total - Number(prev.recip || 0)).toFixed(2)),
    }));
  }, [record?.digital, record?.offset, record?.recip]);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setRecord({
      ...record,
      customer: { ...record.customer, [name]: value },
    });
  };

  // ✅ Handle digitalId change
  const handleDigitalIdChange = (e) => {
    const value = e.target.value;
    setRecord({
      ...record,
      digitalId: value,
    });
  };

  const handleRecipChange = (e) => {
    const value = Number(e.target.value || 0);
    setRecord({
      ...record,
      recip: value,
    });
  };

  const saveRecord = async (shouldPrint = false) => {
    // Prepare the record by filtering out empty items
    const recordToSubmit = prepareRecordForSubmit(record);
    // Check if there are any filled items
    const hasDigitalItems = recordToSubmit.digital.length > 0;
    const hasOffsetItems = recordToSubmit.offset.length > 0;

    if (!hasDigitalItems && !hasOffsetItems) {
      Swal.fire(
        "خطا",
        "لطفاً حداقل یک محصول دیجیتال یا افست را پر کنید",
        "error"
      );
      return;
    }

    try {
      let savedOrder;

      if (editMode) {
        savedOrder = await updateOrder(editingOrderId, recordToSubmit);
        Swal.fire("موفق", "بیل با موفقیت ویرایش شد", "success");
      } else {
        savedOrder = await createOrder(recordToSubmit);
      }
      fetchOrders(currentPage);

      if (shouldPrint) {
        // Use the original record data for printing since it has all the details
        const orderForPrint = {
          ...savedOrder, // This gives us the ID and any other backend data
          customer: {
            name: record.customer.name,
            phone_number: record.customer.phone_number,
          },
          digital: recordToSubmit.digital,
          offset: recordToSubmit.offset,
          total_money_digital: record.total_money_digital,
          total_money_offset: record.total_money_offset,
          total: record.total,
          recip: record.recip,
          remained: record.remained,
          digitalId: record.digitalId,
          createdAt: new Date().toISOString(), // Add current date for the bill
        };

        setSavedOrderForPrint(orderForPrint);
        setSelectedOrder(orderForPrint);
        setIsBillOpen(true);
        setAutoPrint(true);
      } else {
        resetForm();
      }
    } catch (err) {
      // ... error handling ...
    }
  };

  const resetForm = () => {
    setRecord({
      customer: { name: "", phone_number: "" },
      digital: Array(5)
        .fill()
        .map(() => ({ ...defaultDigitalItem })), // Reset to 5 empty digital forms
      offset: Array(5)
        .fill()
        .map(() => ({ ...defaultOffsetItem })), // Reset to 5 empty offset forms
      total_money_digital: 0,
      total_money_offset: 0,
      total: 0,
      recip: 0,
      remained: 0,
      digitalId: null, // ✅ Reset digitalId field
    });
    setEditMode(false);
    setEditingOrderId(null);
    setActiveSection("digital");
    setSavedOrderForPrint(null);
  };

  const handleEditOrder = (order) => {
    // Transform the order data to match the record structure
    setRecord({
      customer: {
        name: order.customer?.name || order.name || "",
        phone_number: order.customer?.phone_number || order.phone_number || "",
      },
      digital:
        order.digital && order.digital.length > 0
          ? order.digital
          : Array(5)
            .fill()
            .map(() => ({ ...defaultDigitalItem })), // Keep 5 forms if no data
      offset:
        order.offset && order.offset.length > 0
          ? order.offset
          : Array(5)
            .fill()
            .map(() => ({ ...defaultOffsetItem })), // Keep 5 forms if no data
      total_money_digital: order.total_money_digital || 0,
      total_money_offset: order.total_money_offset || 0,
      total: order.total || 0,
      digitalId: order.digitalId || 0,
      recip: order.recip || 0,
      remained: order.remained || 0,
      digitalId: order.digitalId || null, // ✅ Include digitalId when editing
    });
    setEditMode(true);
    setEditingOrderId(order.id);

    // Scroll to the top of the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
      Swal.fire("حذف شد!", "سفارش با موفقیت حذف شد.", "success");
      fetchOrders(currentPage);
    } catch (err) {
      Swal.fire("خطا!", "حذف سفارش موفقیت‌آمیز نبود.", "error");
    }

  };

  const handleViewBill = (order) => {
    setSelectedOrder(order);
    setIsBillOpen(true);
    setAutoPrint(false);
  };

  const handleCloseBill = () => {
    setIsBillOpen(false);
    setSelectedOrder(null);
    setAutoPrint(false);
    // If we were printing a saved order, reset the form
    if (savedOrderForPrint) {
      resetForm();
    }
  };

  const handlePrintBill = (order) => {
    setSelectedOrder(order);
    setIsBillOpen(true);
    setAutoPrint(true);
  };

  // Save and Print function
  const handleSaveAndPrint = () => {
    saveRecord(true); // Pass true to indicate we want to print after saving
  };

  // Count filled items for display
  const filledDigitalCount = record.digital.filter(isDigitalItemFilled).length;
  const filledOffsetCount = record.offset.filter(isOffsetItemFilled).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          سیستم مدیریت سفارشات
        </h1>
        <p className="text-gray-600">مدیریت سفارش‌های مشتریان و خدمات چاپی</p>
        {editMode && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <FaEdit className="text-lg" />
              <span className="font-semibold">
                حالت ویرایش - در حال ویرایش سفارش #{editingOrderId}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section Toggle Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
        <div className="bg-white rounded-2xl  p-3  border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <FaUser className="text-cyan-500 text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                معلومات مشتری
              </h2>
            </div>
            {editMode && (
              <button
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <FaTimes className="text-sm" />
                لغو ویرایش
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700 mb-2">
                نام مشتری
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  placeholder="نام مشتری را وارد کنید"
                  value={record.customer.name || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-3 pl-12 border bg-gray-200 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-800 transition-all duration-200  text-gray-800 placeholder-gray-400"
                />
                <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700 mb-2">
                شماره تماس
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="phone_number"
                  placeholder="شماره تماس را وارد کنید"
                  value={record.customer.phone_number || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-3 pl-12 border bg-gray-200 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-800 transition-all duration-200  text-gray-800 placeholder-gray-400"
                />
                <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* ✅ Added digitalId input field */}
            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700 mb-2">
                شناسه دیجیتال
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="digitalId"
                  placeholder="شناسه دیجیتال را وارد کنید"
                  value={record.digitalId || ""}
                  onChange={handleDigitalIdChange}
                  className="w-full px-4 py-3 pl-12 border bg-gray-200 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-800 transition-all duration-200  text-gray-800 placeholder-gray-400"
                />
                <FaIdCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6 mt-4">
          <button
            onClick={() => setActiveSection("digital")}
            className={`flex items-center gap-3 px-6 py-3 rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${activeSection === "digital"
              ? "bg-cyan-800 text-white shadow-blue-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            <FaPrint className="text-lg" />
            چاپ دیجیتال
          </button>

          <button
            onClick={() => setActiveSection("offset")}
            className={`flex items-center gap-3 px-6 py-3 rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${activeSection === "offset"
              ? "bg-cyan-800 text-white shadow-blue-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            <FaPrint className="text-lg" />
            چاپ افست
          </button>
        </div>

        {/* Dynamic Section Display */}
        <div className="transition-all duration-300">
          {activeSection === "digital" && (
            <div className=" ">
              <DigitalSection record={record} setRecord={setRecord} />
            </div>
          )}

          {activeSection === "offset" && (
            <div className="">
              <OffsetSection record={record} setRecord={setRecord} />
            </div>
          )}
        </div>
      </div>

      {/* Bill Summary */}
      <div className="">
        <BillSummary record={record} />
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-100">
        <div className="flex   gap-x-6">
          <div className="flex items-center gap-x-4 flex-1">
            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مبلغ دریافتی
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  placeholder="مبلغ دریافتی را وارد کنید"
                  value={record.recip}
                  onChange={handleRecipChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-800 focus:border-transparent transition-all duration-200 bg-gray-200 text-gray-800 placeholder-gray-400"
                />
                <FaMoneyBillWave className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مبلغ باقیمانده
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="مبلغ باقیمانده"
                  value={record.remained}
                  readOnly
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-800 focus:border-transparent transition-all duration-200 bg-gray-200 text-gray-800 placeholder-gray-400cursor-not-allowed"
                />
                <FaMoneyBillWave className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-end  gap-2">
            {/* Save Button */}
            <button
              onClick={() => saveRecord(false)}
              disabled={
                !record.customer.name.trim() ||
                (filledDigitalCount === 0 && filledOffsetCount === 0)
              }
              className={`flex items-center gap-x-3 px-4 py-3.5 rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${editMode
                ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                : "flex items-center gap-2 text-sm bg-cyan-800 text-white px-4 py-3.5 rounded-md font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl"
                } ${!record.customer.name.trim() ||
                  (filledDigitalCount === 0 && filledOffsetCount === 0)
                  ? "opacity-50 cursor-not-allowed"
                  : "text-white"
                }`}
            >
              <FaSave className="text-lg" />
              {editMode ? "ویرایش اطلاعات" : "ذخیره اطلاعات"}
            </button>

            {/* Save and Print Button */}
            <button
              onClick={handleSaveAndPrint}
              disabled={
                !record.customer.name.trim() ||
                (filledDigitalCount === 0 && filledOffsetCount === 0)
              }
              className={`flex items-center gap-x-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-3.5 rounded-md font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 ${!record.customer.name.trim() ||
                (filledDigitalCount === 0 && filledOffsetCount === 0)
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
            >
              <FaPrint className="text-lg" />
              ذخیره و چاپ
            </button>
          </div>

          <div className="flex items-end ">
            <button
              onClick={() => handleViewBill(record)}
              className="flex items-center gap-x-2 text-sm bg-purple-700 text-white px-4 py-3.5 rounded-md font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl   transform hover:scale-105"
            >
              <FaEye className="text-lg" />
              مشاهده بیل
            </button>
          </div>
        </div>

        {/* Validation message */}
        {(!record.customer.name.trim() ||
          (filledDigitalCount === 0 && filledOffsetCount === 0)) && (
            <div className="mt-5 ">
              <p className="text-red-600 text-sm">
                {!record.customer.name.trim()
                  ? "لطفاً نام مشتری را وارد کنید"
                  : "لطفاً حداقل یک محصول دیجیتال یا افست را پر کنید"}
              </p>
            </div>
          )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100">
        <div className="flex items-center gap-3  p-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <FaFileInvoice className="text-cyan-800 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">لیست سفارشات</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center  border border-gray-300">
            <thead className="bg-cyan-800 text-gray-50">
              <tr>
                <th className="border border-gray-100 px-4 py-2"> شماره بیل</th>
                <th className="border border-gray-100 px-4 py-2">
                  شناسه دیجیتال
                </th>
                <th className="border border-gray-100 px-4 py-2">نام مشتری</th>
                <th className="border border-gray-100 px-4 py-2">شماره تماس</th>
                <th className="border border-gray-100 px-4 py-2">مجموع</th>
                <th className="border border-gray-100 px-4 py-2">دریافتی</th>
                <th className="border border-gray-100 px-4 py-2">باقیمانده</th>
                <th className="border border-gray-100 px-4 py-2">تاریخ</th>
                <th className="border border-gray-100 px-4 py-2">تحویلی</th>
                <th className="border border-gray-300 px-4 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? (
                orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 ${order.isDelivered && order.remained === 0 && "bg-blue-100"
                      } `}
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {order.id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-mono">
                      {order.digitalId || "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {order.customer?.name || order.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {order.customer?.phone_number || order.phone_number}
                    </td>
                    <td className="border font-semibold border-gray-300 px-4 py-2">
                      {order.total}
                    </td>
                    <td className="border font-semibold text-green-600 border-gray-300 px-4 py-2">
                      {order.recip}
                    </td>
                    <td
                      className={`border font-semibold border-gray-300 px-4 py-2 ${order.remained === 0 ? "text-black" : "text-red-500"
                        }`}
                    >
                      {order.remained}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(order.createdAt).toLocaleDateString("fa-AF")}
                    </td>
                    <td className="border  border-gray-300  px-4 py-2">
                      <div className="w-full flex items-center justify-center text-cyan-800">
                        {order.isDelivered ? <FaCheck /> : <ImCross />}
                      </div>
                    </td>
                    <td className="border-b border-gray-300 flex items-center justify-center py-2">
                      <div className="flex  gap-x-2">
                        <button
                          onClick={() => handleViewBill(order)}
                          className="flex items-center justify-center h-8 w-8 cursor-pointer  border border-cyan-800  rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl "
                        >
                          <FaEye className="text-cyan-800" size={20} />
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="flex items-center justify-center h-8 w-8 cursor-pointer  border border-cyan-800  rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl "
                        >
                          <FaEdit className="text-green-600" size={20} />
                        </button>
                        <button
                          onClick={() => handlePrintBill(order)}
                          className="flex items-center justify-center h-8 w-8 cursor-pointer  border border-cyan-800  rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl "
                        >
                          <FaPrint className="text-blue-600" size={20} />
                        </button>
                        {currentUser.role == "admin" && (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="flex items-center justify-center h-8 w-8 cursor-pointer  border border-cyan-800  rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl "
                          >
                            <FaTimes className="text-red-600" size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-gray-500 py-4">
                    هیچ سفارشی وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>

      {/* Print Bill Modal */}
      {/* {isBillOpen && (
        // <div className="relative ">
        //   <PrintOrderBill
        //     isOpen={isBillOpen}
        //     onClose={handleCloseBill}
        //     order={selectedOrder}
        //     autoPrint={autoPrint}
        //   />
        // </div>
      )} */}
    </div>
  );
};

export default Orders;
