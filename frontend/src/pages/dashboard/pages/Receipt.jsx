import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  customer: "",
  amount: "",
};

const ReceiptManager = () => {
  const [customers, setCustomers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH CUSTOMERS ---------------- */
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/customers`);
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  /* ---------------- FETCH RECEIPTS ---------------- */
  const fetchReceipts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/receipts`);
      setReceipts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching receipts", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchReceipts();
  }, []);

  /* ---------------- HANDLE FORM ---------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log(form);
      if (editingId) {
        await axios.put(`${BASE_URL}/receipts/${editingId}`, form);
      } else {
        await axios.post(`${BASE_URL}/receipts`, form);
      }

      setForm(initialForm);
      setEditingId(null);
      fetchReceipts();
    } catch (error) {
      console.error("Error saving receipt", error);
      alert(error.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EDIT ---------------- */
  const handleEdit = (receipt) => {
    setForm({
      customer: receipt.customer,
      amount: receipt.amount,
    });
    setEditingId(receipt.id);
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this receipt?")) return;

    try {
      await axios.delete(`${BASE_URL}/receipts/${id}`);
      fetchReceipts();
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {editingId ? "Edit Receipt" : "Create Receipt"}
      </h2>

      {/* ---------------- FORM ---------------- */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          name="customer"
          value={form.customer}
          onChange={handleChange}
          required
          className="border rounded px-3 py-2"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullname}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          required
          className="border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          {loading ? "Saving..." : editingId ? "Update" : "Create"}
        </button>
      </form>

      {/* ---------------- TABLE ---------------- */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Customer</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id}>
                <td className="border p-2">
                  {customers.find((c) => c.id === r.customer)?.fullname || "—"}
                </td>
                <td className="border p-2">{r.amount}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(r)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-4 text-gray-500">
                  No receipts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceiptManager;
