import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const Field = ({ label, name, type = "text", placeholder, required, value, onChange, error }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-400
        ${error ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    clinicName: "",
    whatsappNumber: "",
    nationalId: "",
    password: "",
    confirmPassword: "",
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.email.trim()) e.email = "البريد مطلوب";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "بريد غير صالح";
    if (!form.clinicName.trim()) e.clinicName = "اسم العيادة مطلوب";
    if (form.nationalId && !/^\d{14}$/.test(form.nationalId))
      e.nationalId = "14 رقماً إن وُجد";
    if (!form.password || form.password.length < 6)
      e.password = "6 أحرف على الأقل";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "غير متطابقة";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined, server: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        clinicName: form.clinicName.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        nationalId: form.nationalId || undefined,
        password: form.password,
      });
      if (!res.data?.token) {
        setErrors({ server: "تم إنشاء الحساب لكن لم يصل رمز الدخول. جرّب تسجيل الدخول يدوياً." });
        return;
      }
      localStorage.setItem("token", res.data.token);
      window.location.href = "/home";
    } catch (err) {
      setErrors({
        server:
          err.response?.data?.message ||
          (err.response ? "حدث خطأ أثناء التسجيل" : "تعذر الاتصال بالخادم"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="auth-page">
      <div className="auth-card max-w-lg">
        <div className="text-center mb-6">
          <div className="auth-logo">🏥</div>
          <h1 className="text-2xl font-bold text-slate-800">إنشاء حساب</h1>
          <p className="text-slate-500 text-sm mt-1">ابدأ مجاناً — أسبوع كامل بكل المميزات</p>
        </div>

        <div className="auth-banner mb-5">
          <p className="font-bold">🎁 7 أيام مجانية</p>
          <p className="text-sm opacity-90">بدون دفع مسبق — كل المميزات متاحة فوراً</p>
        </div>

        {errors.server && (
          <div className="auth-error mb-4">{errors.server}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الاسم" name="name" placeholder="د. أحمد" value={form.name} onChange={handleChange} error={errors.name} required />
            <Field label="العيادة" name="clinicName" placeholder="عيادة النور" value={form.clinicName} onChange={handleChange} error={errors.clinicName} required />
          </div>
          <Field label="البريد" name="email" type="email" placeholder="doctor@clinic.com" value={form.email} onChange={handleChange} error={errors.email} required />
          <Field label="الرقم القومي" name="nationalId" placeholder="14 رقماً (اختياري)" value={form.nationalId} onChange={handleChange} error={errors.nationalId} />
          <Field label="واتساب (اختياري)" name="whatsappNumber" placeholder="201012345678" value={form.whatsappNumber} onChange={handleChange} error={errors.whatsappNumber} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="كلمة المرور" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} required />
            <Field label="تأكيد" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
          </div>
          <button type="submit" disabled={loading} className="auth-btn w-full mt-2">
            {loading ? "جارٍ الإنشاء..." : "إنشاء حساب والبدء ←"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          لديك حساب؟ <Link to="/login" className="text-teal-600 font-semibold hover:underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}