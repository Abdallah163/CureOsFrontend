import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const Field = ({
  label,
  name,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
  error,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-2.5 border rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400
        ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
    />
    {error && (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [pendingData, setPendingData] = useState(null);
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
    if (!form.email.trim()) e.email = "البريد الإلكتروني مطلوب";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "بريد إلكتروني غير صالح";
    if (!form.clinicName.trim()) e.clinicName = "اسم العيادة مطلوب";
    if (!form.nationalId.trim()) e.nationalId = "الرقم القومي مطلوب";
    else if (!/^\d{14}$/.test(form.nationalId))
      e.nationalId = "الرقم القومي يجب أن يكون 14 رقماً";
    else if (!/^\d{12}\d{2}$/.test(form.nationalId))
      e.nationalId = "آخر رقمين من الرقم القومي غير صحيحين";
    if (!form.password) e.password = "كلمة المرور مطلوبة";
    else if (form.password.length < 6)
      e.password = "كلمة المرور 6 أحرف على الأقل";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "كلمتا المرور غير متطابقتين";
    if (form.whatsappNumber && !/^\d{11,15}$/.test(form.whatsappNumber))
      e.whatsappNumber = "رقم غير صالح (أرقام فقط، 11-15 خانة)";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const registerUser = async (isTrial) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        clinicName: form.clinicName,
        whatsappNumber: form.whatsappNumber,
        nationalId: form.nationalId,
        password: form.password,
        isTrial,
      });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/home");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "حدث خطأ أثناء التسجيل";
      if (err.response?.status === 402 && err.response?.data?.requirePayment) {
        setPendingData(err.response.data);
        setShowPaymentPrompt(true);
      } else {
        setErrors({ server: msg });
      }
    }
    setLoading(false);
  };

  const handleSubmitPaid = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await registerUser(false);
  };

  const handleFreeTrial = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await registerUser(true);
  };

  const goToPayment = () => {
    navigate("/payment", { state: { fromRegister: true, ...pendingData } });
  };

  if (showPaymentPrompt) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 border border-amber-100 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">💳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            يجب الدفع أولاً
          </h1>
          <p className="text-gray-500 mb-2">
            عذراً {pendingData?.name}، يجب دفع الاشتراك قبل إنشاء الحساب.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            بعد الدفع، يمكنك العودة لإكمال التسجيل بنفس البيانات.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-right text-sm space-y-2">
            <p>
              <strong>الاسم:</strong> {pendingData?.name}
            </p>
            <p>
              <strong>البريد:</strong> {pendingData?.email}
            </p>
            <p>
              <strong>الرقم القومي:</strong> {pendingData?.nationalId}
            </p>
            <p className="text-amber-700 font-bold">
              المطلوب: دفع الاشتراك قبل إنشاء الحساب
            </p>
          </div>
          <button
            onClick={goToPayment}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-md mb-3"
          >
            اذهب إلى صفحة الدفع 💳
          </button>
          <button
            onClick={() => setShowPaymentPrompt(false)}
            className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            تعديل البيانات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 border border-gray-100">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h1>
          <p className="text-gray-500 text-sm mt-1">
            أدخل بياناتك لبدء استخدام النظام
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-sm text-green-700">
          <p className="font-bold mb-1">🎁 تجربة مجانية لمدة 5 أيام</p>
          <p>
            يمكنك تجربة النظام مجاناً قبل الاشتراك — حد أقصى 100 زيارة و 50
            رسالة واتساب
          </p>
        </div>

        {errors.server && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm flex items-center gap-2">
            <span>❌</span> {errors.server}
          </div>
        )}

        <form onSubmit={handleSubmitPaid}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="الاسم الكامل"
              name="name"
              placeholder="د. أحمد محمد"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Field
              label="اسم العيادة"
              name="clinicName"
              placeholder="عيادة النور"
              value={form.clinicName}
              onChange={handleChange}
              error={errors.clinicName}
              required
            />
          </div>

          <Field
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="doctor@clinic.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Field
            label="الرقم القومي "
            name="nationalId"
            placeholder="14 رقماً — يُستخدم كـ ID"
            value={form.nationalId}
            onChange={handleChange}
            error={errors.nationalId}
            required
          />

          <Field
            label="رقم واتساب"
            name="whatsappNumber"
            placeholder="201012345678 (اختياري)"
            value={form.whatsappNumber}
            onChange={handleChange}
            error={errors.whatsappNumber}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="كلمة المرور"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <Field
              label="تأكيد كلمة المرور"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
          </div>

          {form.password && (
            <div className="mb-4 -mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      form.password.length >= i * 3
                        ? i <= 1
                          ? "bg-red-400"
                          : i <= 2
                            ? "bg-yellow-400"
                            : i <= 3
                              ? "bg-blue-400"
                              : "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {form.password.length < 6
                  ? "ضعيفة جداً"
                  : form.password.length < 9
                    ? "مقبولة"
                    : form.password.length < 12
                      ? "جيدة"
                      : "قوية ✓"}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "جارٍ..." : "اشتراك (500 ج.م) ←"}
            </button>
            <button
              type="button"
              onClick={handleFreeTrial}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              🎁 تجربة مجانية 5 أيام
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          لديك حساب بالفعل؟{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
