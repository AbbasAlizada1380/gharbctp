import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import OrderItemForm from "./OrderItemForm";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Orders = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false); // toggle new customer input

  const [form, setForm] = useState({
    customer: "",
    newCustomerName: "", // for adding new customer
    orderItems: [{ size: "", qnty: "", price: "", money: "", fileName: "" }],
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
     Submit
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      // If adding new customer, remove customer and use newCustomerName
      customer: addingCustomer ? undefined : form.customer,
    };

    try {
      console.log(payload);
      
      await axios.post(`${BASE_URL}/order-items`, payload);
      alert("سفارش موفقانه ثبت شد");
      setForm({
        customer: "",
        newCustomerName: "",
        orderItems: [{ size: "", qnty: "", price: "", money: "", fileName: "" }],
      });
      setAddingCustomer(false);
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت سفارش");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
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

        {/* Order Items */}
        <div className="space-y-4">
          {form.orderItems.map((item, index) => (
            <OrderItemForm
              key={index}
              item={item}
              index={index}
              handleItemChange={handleItemChange}
              deleteOrderItem={deleteOrderItem}
              canDelete={form.orderItems.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={addOrderItem}
            className="flex items-center gap-2 bg-cyan-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-900 transition"
          >
            <FaPlus />
            افزودن مورد جدید
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-cyan-800 text-white py-3 rounded-md hover:bg-cyan-900 transition"
        >
          ثبت سفارش
        </button>
      </div>
    </div>
  );
};

export default Orders;
