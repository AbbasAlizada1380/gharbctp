import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import OrderItemForm from "./OrderItemForm";
import OrderItemsList from "./OrderItemsList";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Create 5 empty order items
const createEmptyOrderItems = (count = 5) => {
  return Array.from({ length: count }, () => ({
    size: "",
    qnty: "",
    price: "",
    money: "",
    fileName: ""
  }));
};

const Orders = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add this state

  const [form, setForm] = useState({
    customer: "",
    newCustomerName: "",
    orderItems: createEmptyOrderItems(5),
  });

  /* ===============================
     Fetch Active Customers
  =============================== */
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/customers/active`);
        setCustomers(res.data.customers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  /* ===============================
     Handle Form Change
  =============================== */
  const handleCustomerChange = (e) => {
    setForm((prev) => ({ ...prev, customer: e.target.value }));
  };

  const handleNewCustomerChange = (e) => {
    setForm((prev) => ({ ...prev, newCustomerName: e.target.value }));
  };

  const handleItemChange = (index, name, value) => {
    setForm((prev) => {
      const updatedItems = [...prev.orderItems];
      updatedItems[index][name] = value;

      // Auto-calculate money when qnty or price changes
      if (name === "qnty" || name === "price") {
        const qnty = Number(updatedItems[index].qnty) || 0;
        const price = Number(updatedItems[index].price) || 0;
        updatedItems[index].money = qnty * price;
      }

      return { ...prev, orderItems: updatedItems };
    });
  };

  /* ===============================
     Add / Delete Order Items
  =============================== */
  const addOrderItem = () => {
    setForm((prev) => ({
      ...prev,
      orderItems: [
        ...prev.orderItems,
        { size: "", qnty: "", price: "", money: "", fileName: "" },
      ],
    }));
  };

  const deleteOrderItem = (index) => {
    setForm((prev) => {
      const updatedItems = [...prev.orderItems];
      updatedItems.splice(index, 1);
      return { ...prev, orderItems: updatedItems };
    });
  };

  /* ===============================
     Submit - Filter out empty items
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter out completely empty order items
    const nonEmptyOrderItems = form.orderItems.filter(item =>
      item.size.trim() !== "" ||
      item.qnty !== "" ||
      item.price !== "" ||
      item.fileName.trim() !== ""
    );

    // If no valid items, show error
    if (nonEmptyOrderItems.length === 0) {
      alert("لطفا حداقل یک مورد سفارش را پر کنید");
      return;
    }

    const payload = {
      ...form,
      orderItems: nonEmptyOrderItems,
      customer: addingCustomer ? undefined : form.customer,
    };

    try {
      console.log("Submitting payload:", payload);

      await axios.post(`${BASE_URL}/orderItems`, payload);
      alert("سفارش موفقانه ثبت شد");

      // Reset form but keep 5 empty items
      setForm({
        customer: "",
        newCustomerName: "",
        orderItems: createEmptyOrderItems(5),
      });
      setAddingCustomer(false);
      
      // TRIGGER REFRESH HERE - Increment the refresh trigger
      setRefreshTrigger(prev => prev + 1);
      
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت سفارش");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        <div className="felx"> 
          <h2 className="text-xl font-bold text-cyan-800 mb-6">ثبت سفارش جدید</h2>

          {/* Customer Select / Add */}
          <div className="flex flex-col gap-2">
            <label className="block mb-1 text-sm font-medium">مشتری</label>

            {addingCustomer ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={form.newCustomerName}
                  onChange={handleNewCustomerChange}
                  placeholder="نام مشتری جدید"
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAddingCustomer(false)}
                  className="text-white bg-red-500 px-3 py-2 rounded-md"
                >
                  لغو
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleCustomerChange}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">انتخاب مشتری</option>
                  {Array.isArray(customers) &&
                    customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullname} ({c.phoneNumber})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingCustomer(true)}
                  className="flex items-center gap-1 bg-cyan-800 text-white px-3 py-2 rounded-md"
                >
                  <FaPlus />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Items - Show all 5 initially */}
        <div className="space-y-4">
          {form.orderItems.map((item, index) => (
            <OrderItemForm
              key={index}
              item={item}
              index={index}
              handleItemChange={handleItemChange}
              deleteOrderItem={deleteOrderItem}
              canDelete={form.orderItems.length > 5}
            />
          ))}

          <button
            type="button"
            onClick={addOrderItem}
            className="flex items-center gap-2 bg-cyan-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-900 transition"
          >
            <FaPlus />
            افزودن مورد جدید (مجموع: {form.orderItems.length})
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-cyan-800 text-white py-3 rounded-md hover:bg-cyan-900 transition"
        >
          ثبت سفارش ({form.orderItems.filter(item => item.size || item.qnty || item.price || item.fileName).length} مورد پر شده)
        </button>
      </div>
      
      {/* Pass the refreshTrigger prop */}
      <OrderItemsList refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default Orders;