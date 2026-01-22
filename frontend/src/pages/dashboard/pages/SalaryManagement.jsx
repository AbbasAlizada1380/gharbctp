import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  staffId: "",
  receipt: 0,
  attendance: {
    Saturday: { attendance: false, overtime: 0 },
    Sunday: { attendance: false, overtime: 0 },
    Monday: { attendance: false, overtime: 0 },
    Tuesday: { attendance: false, overtime: 0 },
    Wednesday: { attendance: false, overtime: 0 },
    Thursday: { attendance: false, overtime: 0 },
  },
};

const SalaryManagement = () => {
  const [staffs, setStaffs] = useState([]);
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  // ---------------- FETCH DATA ----------------
  const fetchStaff = async () => {
    const res = await axios.get(`${BASE_URL}/staff`);
    setStaffs(res.data.staffs || []);
  };

  const fetchAttendance = async () => {
    const res = await axios.get(`${BASE_URL}/attendance`);
    setRecords(res.data);
  };

  useEffect(() => {
    fetchStaff();
    fetchAttendance();
  }, []);

  // ---------------- HANDLE INPUT ----------------
  const handleAttendanceChange = (day, field, value) => {
    setForm(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [day]: {
          ...prev.attendance[day],
          [field]: field === "attendance" ? value : Number(value),
        },
      },
    }));
  };

  // ---------------- CREATE / UPDATE ----------------
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/attendance/${editingId}`, {
          attendance: form.attendance,
          receipt: form.receipt,
        });
      } else {
        await axios.post(`${BASE_URL}/attendance`, form);
      }

      // Refresh records after update/create
      await fetchAttendance();

      // Reset form
      setForm(initialForm);
      setEditingId(null);

    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = record => {
    setEditingId(record.id);
    setForm({
      staffId: record.staffId,
      receipt: record.receipt || 0,
      attendance: record.attendance,
    });
  };


  // ---------------- DELETE ----------------
  const handleDelete = async id => {
    if (!confirm("آیا از حذف این رکورد اطمینان دارید؟")) return;
    await axios.delete(`${BASE_URL}/attendance/${id}`);
    fetchAttendance();
  };

  const daysOrder = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const persianDays = {
    Saturday: "شنبه",
    Sunday: "یکشنبه",
    Monday: "دوشنبه",
    Tuesday: "سه‌شنبه",
    Wednesday: "چهارشنبه",
    Thursday: "پنجشنبه"
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">مدیریت حضور و غیاب</h1>
        <p className="text-gray-600">ثبت و مدیریت حضور و حقوق کارمندان</p>

        {editingId && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <FaEdit className="h-5 w-5" />
              <span className="font-semibold">حالت ویرایش – رکورد #{editingId}</span>
            </div>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "ویرایش حضور و غیاب" : "ثبت حضور و غیاب جدید"}
              </h2>
              <p className="text-sm text-white/80">
                {editingId ? "ویرایش اطلاعات حضور و غیاب" : "ثبت حضور و غیاب برای کارمند"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> انتخاب کارمند
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={form.staffId}
                onChange={e => setForm({ ...form, staffId: e.target.value })}
                required
              >
                <option value="">انتخاب کارمند</option>
                {Array.isArray(staffs) &&
                  staffs.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} - {staff.fatherName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Attendance Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daysOrder.map(day => (
                <div key={day} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">{persianDays[day]}</h3>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="hidden peer"
                          checked={form.attendance[day].attendance}
                          onChange={e =>
                            handleAttendanceChange(day, "attendance", e.target.checked)
                          }
                        />
                        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${form.attendance[day].attendance ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${form.attendance[day].attendance ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-sm text-gray-600">
                          {form.attendance[day].attendance ? <FaCheck className="text-green-500" /> : <FaTimes className="text-gray-400" />}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اضافه‌کاری (ساعت)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={form.attendance[day].overtime}
                        onChange={e =>
                          handleAttendanceChange(day, "overtime", e.target.value)
                        }
                        disabled={!form.attendance[day].attendance}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        ساعت
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-4 border-t border-gray-200">

              {/* Total & Receipt Section */}
              {editingId && (
                <div className="flex flex-col md:flex-row gap-4 flex-1">

                  {/* Total Display */}
                  <div className="bg-gray-100 p-4 rounded-lg flex flex-col justify-center items-start">
                    <label className="text-sm font-medium text-gray-700 mb-1">مجموع کل</label>
                    <span className="text-lg font-bold text-emerald-700">
                      {records.find(r => r.id === editingId)?.total || 0} ؋
                    </span>
                  </div>

                  {/* Receipt Input */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مبلغ پرداخت شده (Receipt)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={records.find(r => r.id === editingId)?.total || undefined}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      value={form.receipt}
                      onChange={e =>
                        setForm({ ...form, receipt: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm(initialForm);
                      setEditingId(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    لغو ویرایش
                  </button>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-800 to-cyan-600 text-white rounded-lg hover:from-blue-900 hover:to-blue-700 transition font-medium shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{editingId ? "ذخیره تغییرات" : "ثبت حضور و غیاب"}</span>
                  </div>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">لیست حضور و غیاب</h2>
                <p className="text-sm text-white/80">
                  {records.length} رکورد
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-blue-50 text-cyan-800">
              <tr>
                <th className="p-3 border-b font-semibold">#</th>
                <th className="p-3 border-b font-semibold">کارمند</th>
                <th className="p-3 border-b font-semibold">روزهای حضور</th>
                <th className="p-3 border-b font-semibold">مجموع اضافه‌کاری (ساعت)</th>
                <th className="p-3 border-b font-semibold">حقوق اضافه‌کاری</th>
                <th className="p-3 border-b font-semibold">حقوق پایه</th>
                <th className="p-3 border-b font-semibold">مجموع کل</th>
                <th className="p-3 border-b font-semibold">   پرداخت شده</th>
                <th className="p-3 border-b font-semibold">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">هیچ رکوردی ثبت نشده است</p>
                      <p className="text-gray-400 text-sm mt-1">برای شروع، حضور و غیاب جدیدی ثبت کنید</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record, index) => {
                  const attendanceDays = Object.values(record.attendance || {}).filter(day => day.attendance).length;
                  const totalOvertime = Object.values(record.attendance || {}).reduce((sum, day) => sum + (day.overtime || 0), 0);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                    >
                      <td className="p-3 text-gray-600">{index + 1}</td>
                      <td className="p-3">
                        <div className="text-right">
                          <div className="font-medium text-gray-800">{record.Staff?.name}</div>
                          <div className="text-sm text-gray-500">{record.Staff?.fatherName}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {attendanceDays} روز
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {totalOvertime.toFixed(1)} ساعت
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            {(record.overtime || 0)} ؋ کل
                          </span>
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                            {record.overtime && totalOvertime ?
                              (record.overtime / totalOvertime) : 0} ؋ / ساعت
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                          {(record.salary || 0)} ؋
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                          {(record.total || 0)} ؋
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                          {(record.receipt || 0)} ؋
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 text-cyan-700 hover:bg-blue-50 rounded-lg transition"
                            title="ویرایش"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryManagement;