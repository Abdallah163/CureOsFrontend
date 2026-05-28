import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  useEffect(() => {
    api
      .get("/api/clinics")
      .then((r) => setClinics(r.data))
      .catch(console.error);
  }, []);

  const createClinic = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/api/clinics", form);
      setClinics([...clinics, r.data]);
      setShowForm(false);
      setForm({ name: "", address: "", phone: "" });
    } catch (err) {
      alert(err.response?.data?.message || "خطأ");
    }
  };

  const deleteClinic = async (id) => {
    if (!window.confirm("حذف العيادة؟")) return;
    await api.delete(`/api/clinics/${id}`);
    setClinics(clinics.filter((c) => c._id !== id));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            ← الرئيسية
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold">🌐 العيادات المتعددة</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm"
        >
          ＋ إضافة عيادة
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {showForm && (
          <form
            onSubmit={createClinic}
            className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm"
          >
            <h3 className="font-bold mb-4">عيادة جديدة</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500">اسم العيادة *</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">العنوان</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">الهاتف</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm"
            >
              حفظ
            </button>
          </form>
        )}

        {clinics.map((c) => (
          <div
            key={c._id}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex justify-between items-start"
          >
            <div>
              <p className="font-bold text-gray-800">
                {c.name}{" "}
                {c.isMain && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    الرئيسية
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">{c.address || "—"}</p>
              <p className="text-sm text-gray-400">{c.phone || "—"}</p>
            </div>
            <button
              onClick={() => deleteClinic(c._id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              🗑
            </button>
          </div>
        ))}
        {clinics.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            لا توجد عيادات بعد. أضف عيادتك الأولى!
          </p>
        )}
      </div>
    </div>
  );
}
