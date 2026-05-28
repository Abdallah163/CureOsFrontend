import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';

const PHONE = '201029393767';
const PHONE_DISPLAY = '+20 102 939 3767';

const ADDON_PERCENTAGE = 0.30; // 30% من سعر الباقة
const ADDON_PRICE_FIXED = 450; // سعر ثابت للإضافة (في حال عدم اختيار باقة رئيسية)

const PLANS = [
  {
    id: 'weekly',
    name: 'الأسبوعية',
    badge: null,
    price: 500,
    duration: 'أسبوع واحد',
    durationNote: 'تتجدد أسبوعياً',
    color: 'green',
    highlight: false,
    description: 'باقة مناسبة للعيادات الصغيرة',
    features: [
      { text: 'رفع ملفات Excel',               ok: true },
      { text: 'لوحة تحكم أساسية',               ok: true },
      { text: '250 زيارة مشمولة',              ok: true },
      { text: 'رسائل واتساب عادية',             ok: false },
      { text: 'تقارير إيرادات يومية',            ok: true },
      { text: 'تصدير تقرير PDF',                ok: false },
      { text: 'تذكير المرضى عبر واتساب',        ok: true },
      { text: 'قياس رضا المرضى غير مشمول',      ok: false },
      { text: 'الإجراءات التصحيحية الذكية',      ok: false },
      { text: 'تقارير متقدمة ومقارنات',         ok: false },
      { text: 'دعم فني بالأولوية',              ok: false },
    ],
    support: 'دعم عبر البريد الإلكتروني',
    cta: 'اختر هذه الباقة',
  },
  {
    id: 'monthly',
    name: 'الشهرية',
    badge: 'الأكثر شعبية',
    price: 1500,
    duration: 'شهر واحد',
    durationNote: 'تتجدد شهرياً',
    color: 'blue',
    highlight: true,
    description: 'باقة متوسطة مع مميزات كاملة',
    features: [
      { text: 'رفع ملفات Excel',               ok: true },
      { text: 'لوحة تحكم متكاملة',              ok: true },
      { text: 'زيارات غير محدودة',              ok: true },
      { text: 'مرضى غير محدودين',               ok: true },
      { text: 'تقارير إيرادات يومية وشهرية',    ok: true },
      { text: 'تصدير تقرير PDF',                ok: true },
      { text: 'تذكير المرضى عبر واتساب',        ok: true },
      { text: 'قياس رضا المرضى مشمول',          ok: true },
      { text: 'الإجراءات التصحيحية الذكية',      ok: true },
      { text: 'تقارير متقدمة ومقارنات',         ok: true },
      { text: 'دعم فني بالأولوية',              ok: true },
    ],
    support: 'دعم عبر البريد الإلكتروني',
    cta: 'اشتراك مميز',
  },
  {
    id: '4months',
    name: 'رباعية الأشهر',
    badge: '💰 أفضل قيمة',
    price: 4000,
    duration: '4 أشهر',
    durationNote: 'وفر 2000 ج.م عن السعر العادي (6000 ج.م)',
    color: 'indigo',
    highlight: true,
    description: 'جميع المميزات بدون حدود — أطول فترة توفير',
    features: [
      { text: 'رفع ملفات Excel',               ok: true },
      { text: 'لوحة تحكم متكاملة',              ok: true },
      { text: 'زيارات غير محدودة',              ok: true },
      { text: 'مرضى غير محدودين',               ok: true },
      { text: 'تقارير إيرادات يومية وشهرية',    ok: true },
      { text: 'تصدير تقرير PDF',                ok: true },
      { text: 'تذكير المرضى عبر واتساب',        ok: true },
      { text: 'قياس رضا المرضى مشمول',          ok: true },
      { text: 'الإجراءات التصحيحية الذكية',      ok: true },
      { text: 'تقارير متقدمة ومقارنات',         ok: true },
      { text: 'دعم فني بالأولوية + واتساب',     ok: true },
    ],
    support: 'دعم فوري عبر واتساب',
    cta: 'احصل على الأفضل',
  },
];

const METHODS = [
  {
    id: 'instapay',
    name: 'InstaPay',
    icon: '💳',
    gradient: 'from-violet-600 to-indigo-600',
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-700',
    steps: [
      'افتح تطبيق البنك أو تطبيق InstaPay',
      'اختر "تحويل فوري" أو "InstaPay"',
      `أدخل الرقم: ${PHONE_DISPLAY}`,
      'أدخل المبلغ المحدد وأرسل',
      'احتفظ بصورة الإيصال وارفعه أدناه',
    ],
  },
  {
    id: 'vodafone',
    name: 'Vodafone Cash',
    icon: '📱',
    gradient: 'from-red-600 to-rose-500',
    light: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    btn: 'bg-red-600 hover:bg-red-700',
    steps: [
      'افتح تطبيق Vodafone Cash أو اتصل بـ *9#',
      'اختر "تحويل أموال"',
      `أدخل الرقم: ${PHONE_DISPLAY}`,
      'أدخل المبلغ وأكّد بكلمة المرور',
      'احتفظ بصورة الإيصال وارفعه أدناه',
    ],
  },
];

export default function Payment() {
  const location = useLocation();
  const expired = !!location.state?.expired;
  const [selectedPlan, setSelectedPlan]     = useState('monthly');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [copied, setCopied]                 = useState(false);
  const [receipt, setReceipt]               = useState(null);
  const [submitted, setSubmitted]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [serverMsg, setServerMsg]           = useState(null);
  const [regData, setRegData]               = useState({
    name: location.state?.name || '',
    email: location.state?.email || '',
    clinicName: location.state?.clinicName || '',
    whatsappNumber: location.state?.whatsappNumber || '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/api/auth/me')
      .then((res) => {
        const u = res.data.user;
        if (u) {
          setRegData((prev) => ({
            name: prev.name || u.name || '',
            email: prev.email || u.email || '',
            clinicName: prev.clinicName || u.clinicName || '',
            whatsappNumber: prev.whatsappNumber || u.whatsappNumber || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const plan   = PLANS.find(p => p.id === selectedPlan);
  const method = METHODS.find(m => m.id === selectedMethod);

  // حساب السعر مع الإضافات
  const hasAdvertising = selectedAddons.includes('advertising');
  const addonPrice = plan ? Math.round(plan.price * ADDON_PERCENTAGE) : ADDON_PRICE_FIXED;
  const totalPrice = plan ? plan.price + (hasAdvertising ? addonPrice : 0) : 0;

  const copyPhone = () => {
    navigator.clipboard.writeText(PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan)   { alert('اختر الباقة أولاً'); return; }
    if (!selectedMethod) { alert('اختر طريقة الدفع'); return; }
    if (!receipt)        { alert('يرجى رفع صورة الإيصال'); return; }
    if (!regData.name || !regData.email) {
      alert('أدخل الاسم والبريد المرتبط بحسابك'); return;
    }

    setSubmitting(true);
    setServerMsg(null);

    try {
      const formData = new FormData();
      formData.append('receipt', receipt);
      formData.append('plan', selectedPlan);
      formData.append('addons', JSON.stringify(selectedAddons));
      formData.append('amount', totalPrice || plan?.price || 500);
      formData.append('paymentMethod', selectedMethod);
      formData.append('name', regData.name);
      formData.append('email', regData.email);
      formData.append('clinicName', regData.clinicName || '');
      formData.append('whatsappNumber', regData.whatsappNumber || '');

      const res = await api.post('/api/payment/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setServerMsg({ type: 'success', text: res.data.message });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'خطأ في إرسال طلب الدفع';
      setServerMsg({ type: 'error', text: msg });
    }
    setSubmitting(false);
  };

  // ── شاشة التأكيد ──
  if (submitted) return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-green-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال طلبك!</h2>
        <p className="text-gray-500 mb-6">سيتم مراجعة الإيصال وتفعيل حسابك خلال <strong>24 ساعة</strong></p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 text-right space-y-2">
            <p>📦 الباقة: <strong>{plan?.name} — {plan?.price.toLocaleString()} ج.م</strong></p>
            {hasAdvertising && <p>📢 الإعلانات: <strong>+{addonPrice.toLocaleString()} ج.م (40 رسالة)</strong></p>}
            <p>💰 الإجمالي: <strong>{totalPrice.toLocaleString()} ج.م</strong></p>
            <p>📅 المدة: <strong>{plan?.duration}</strong></p>
            <p>💳 طريقة الدفع: <strong>{method?.name}</strong></p>
            <p>📎 الإيصال: <strong>{receipt?.name}</strong></p>
            {regData.email && <p>📧 البريد: <strong>{regData.email}</strong></p>}
          </div>
        {serverMsg?.type === 'success' && (
          <p className="text-green-600 text-sm mb-4">{serverMsg.text}</p>
        )}
        <div className="flex flex-col gap-2">
          <Link to="/login" className="block w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      {serverMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${serverMsg.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {serverMsg.text}
        </div>
      )}

      <div className="bg-gradient-to-l from-teal-700 to-indigo-600 text-white py-10 px-4 text-center">
        <p className="text-teal-200 text-sm mb-2 font-medium">🏥 CureOS</p>
        <h1 className="text-3xl font-extrabold mb-3">
          {expired ? 'تجديد الاشتراك' : 'رفع إيصال الدفع'}
        </h1>
        <p className="text-teal-100 text-sm max-w-md mx-auto">
          {expired
            ? 'انتهت الفترة المجانية. ادفع وارفع الإيصال — سيتم التفعيل بعد مراجعة الأدمن.'
            : 'اختر الباقة وارفع الإيصال. يُفعَّل حسابك بعد موافقة المدير.'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-gray-800 text-lg mb-4">بيانات حسابك</h2>
          <p className="text-sm text-gray-500 mb-4">استخدم نفس البريد الذي سجّلت به. لا يوجد حساب؟ <Link to="/register" className="text-teal-700 font-semibold">سجّل مجاناً</Link></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الاسم *</label>
              <input type="text" value={regData.name}
                onChange={e => setRegData(p => ({ ...p, name: e.target.value }))}
                className="w-full p-2.5 border border-teal-200 rounded-lg text-sm bg-white" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">البريد *</label>
              <input type="email" value={regData.email}
                onChange={e => setRegData(p => ({ ...p, email: e.target.value }))}
                className="w-full p-2.5 border border-teal-200 rounded-lg text-sm bg-white" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">العيادة</label>
              <input type="text" value={regData.clinicName}
                onChange={e => setRegData(p => ({ ...p, clinicName: e.target.value }))}
                className="w-full p-2.5 border border-teal-200 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">واتساب</label>
              <input type="text" value={regData.whatsappNumber}
                onChange={e => setRegData(p => ({ ...p, whatsappNumber: e.target.value }))}
                className="w-full p-2.5 border border-teal-200 rounded-lg text-sm bg-white" />
            </div>
          </div>
        </div>

        {/* ── Step 1: الباقات ── */}
        <h2 className="font-bold text-gray-700 text-lg mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-600 text-white rounded-full text-sm flex items-center justify-center font-bold">1</span>
          اختر باقتك
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative rounded-2xl border-2 p-6 text-right transition-all duration-200 w-full
                ${selectedPlan === p.id
                  ? p.highlight
                    ? 'border-indigo-500 shadow-xl shadow-indigo-100 bg-white'
                    : 'border-blue-400 shadow-lg bg-white'
                  : p.highlight
                    ? 'border-indigo-200 bg-white hover:border-indigo-400'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-l from-indigo-600 to-purple-600 text-white text-xs px-4 py-1 rounded-full font-bold whitespace-nowrap shadow">
                  {p.badge}
                </span>
              )}
              {selectedPlan === p.id && (
                <div className="absolute top-4 left-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
              <div className="mb-4">
                <p className={`font-extrabold text-xl ${p.highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{p.name}</p>
                <p className="text-gray-400 text-xs mt-1">{p.description}</p>
              </div>
              <div className="mb-4">
                <span className={`text-4xl font-extrabold ${p.highlight ? 'text-indigo-600' : 'text-blue-600'}`}>
                  {p.price.toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm"> ج.م / {p.duration}</span>
                <p className="text-xs text-green-600 mt-1 font-medium">{p.durationNote}</p>
              </div>
              <ul className="space-y-2 text-sm">
                {p.features.map((f, i) => (
                  <li key={i} className={`flex items-center gap-2 ${f.ok ? 'text-gray-700' : 'text-gray-300'}`}>
                    <span className={`text-base flex-shrink-0 ${f.ok ? 'text-green-500' : 'text-gray-300'}`}>
                      {f.ok ? '✓' : '✗'}
                    </span>
                    {f.text}
                    {f.isNew && <span className="bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full font-bold">جديد</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
                <span>🎧</span> {p.support}
              </div>
            </button>
          ))}
        </div>

        {/* ── الإضافات ── */}
        {plan && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 mb-8">
            <h2 className="font-bold text-gray-700 text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-purple-600 text-white rounded-full text-sm flex items-center justify-center font-bold">+</span>
              الإضافات الاختيارية
            </h2>
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              hasAdvertising
                ? 'border-purple-400 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-purple-200 bg-white'
            }`}>
              <input
                type="checkbox"
                checked={hasAdvertising}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAddons([...selectedAddons, 'advertising']);
                  } else {
                    setSelectedAddons(selectedAddons.filter(a => a !== 'advertising'));
                  }
                }}
                className="w-5 h-5 accent-purple-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📢</span>
                  <span className="font-bold text-gray-800">حملة إعلانات واتساب</span>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">إضافة</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  أرسل 40 رسالة دعائية لمرضاك السابقين عبر واتساب — حملة ترويجية لخدماتك
                </p>
              </div>
              <div className="text-left">
                <p className="text-lg font-extrabold text-purple-700">{addonPrice.toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
                <p className="text-xs text-gray-400">مرة واحدة</p>
              </div>
            </label>

            {/* إجمالي السعر مع الإضافات */}
            <div className="mt-4 bg-gradient-to-l from-teal-50 to-indigo-50 rounded-xl p-4 border border-teal-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">💰 الإجمالي شامل الإضافات</span>
              <span className="text-2xl font-extrabold text-teal-700">{totalPrice.toLocaleString()} <span className="text-sm font-normal">ج.م</span></span>
            </div>
          </div>
        )}

        {/* ── Step 2: طريقة الدفع ── */}
        <h2 className="font-bold text-gray-700 text-lg mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-600 text-white rounded-full text-sm flex items-center justify-center font-bold">2</span>
          اختر طريقة الدفع
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`p-5 rounded-2xl border-2 text-right transition-all duration-200
                ${selectedMethod === m.id ? `${m.border} ${m.light} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <span className="text-4xl">{m.icon}</span>
              <p className={`font-bold mt-2 ${selectedMethod === m.id ? m.text : 'text-gray-700'}`}>{m.name}</p>
              {selectedMethod === m.id && (
                <span className={`inline-block mt-1 w-5 h-5 ${m.btn.split(' ')[0]} rounded-full text-white text-xs text-center leading-5`}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Step 3: تعليمات الدفع ── */}
        {method && plan && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-gray-700 text-lg mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full text-sm flex items-center justify-center font-bold">3</span>
              خطوات الدفع عبر {method.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <div className={`${method.light} ${method.border} border rounded-xl p-4 flex items-center justify-between`}>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">رقم {method.name}</p>
                  <p className={`text-xl font-extrabold tracking-wide ${method.text}`} dir="ltr">{PHONE_DISPLAY}</p>
                </div>
                <button onClick={copyPhone} className={`${method.btn} text-white px-3 py-1.5 rounded-lg text-xs font-medium transition`}>
                  {copied ? '✓ تم' : 'نسخ'}
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">المبلغ المطلوب</p>
                  <p className="text-xl font-extrabold text-gray-800">{totalPrice.toLocaleString()} <span className="text-sm font-normal text-gray-400">ج.م</span></p>
                  {hasAdvertising && (
                    <p className="text-xs text-purple-600 mt-0.5">
                      {plan.price.toLocaleString()} ج.م (الباقة) + {addonPrice.toLocaleString()} ج.م (إعلانات)
                    </p>
                  )}
                </div>
                <span className="text-2xl">💵</span>
              </div>
            </div>

            <ol className="space-y-2 mb-6">
              {method.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className={`w-6 h-6 rounded-full ${method.light} ${method.text} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">
                📎 ارفع صورة الإيصال <span className="text-red-500">*</span>
              </p>
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${receipt ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}`}>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files[0] && setReceipt(e.target.files[0])} />
                {receipt ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm text-green-600 font-medium mt-1">{receipt.name}</span>
                    <span className="text-xs text-gray-400">اضغط لتغيير الملف</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📤</span>
                    <span className="text-sm text-gray-400 mt-1">اسحب الملف أو اضغط للاختيار</span>
                    <span className="text-xs text-gray-300">صورة أو PDF</span>
                  </>
                )}
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-gradient-to-l ${method.gradient} hover:opacity-90 disabled:opacity-50`}
            >
              {submitting ? 'جارٍ الإرسال...' : 'إرسال الإيصال للمراجعة ←'}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mb-6">
          🛡️ مشمول بضمان استرداد كامل المبلغ خلال 7 أيام من التفعيل
        </p>

        <div className="text-center">
          <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
