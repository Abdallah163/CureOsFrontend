import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await api.post('/api/auth/login', {
        email: normalizedEmail,
        password,
      });

      if (!res.data?.token) {
        setError('لم يصل رمز الدخول من الخادم. أعد المحاولة أو تواصل مع الدعم.');
        return;
      }

      localStorage.setItem('token', res.data.token);
      if (res.data.warning) {
        sessionStorage.setItem('subscriptionWarning', JSON.stringify(res.data.warning));
      }
      // إعادة تحميل كاملة لضمان قراءة التوكن في كل المكوّنات (Hostinger + React Router)
      window.location.href = '/home';
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 402 && data?.requirePayment) {
        setError(data.message || 'انتهت الفترة المجانية. سيتم توجيهك لصفحة الدفع.');
        setTimeout(() => {
          navigate('/payment', {
            state: {
              email: data.email || normalizedEmail,
              name: data.name,
              clinicName: data.clinicName,
              expired: true,
            },
          });
        }, 800);
        return;
      }
      if (!err.response) {
        setError('تعذر الاتصال بالخادم. تحقق من الإنترنت أو أعد بناء الموقع بـ REACT_APP_API_URL.');
      } else {
        setError(data?.message || 'بيانات الدخول غير صحيحة');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="auth-page">
      <div className="auth-card max-w-md">
        <div className="text-center mb-7">
          <div className="auth-logo">🏥</div>
          <h1 className="text-2xl font-bold text-slate-800">تسجيل الدخول</h1>
          <p className="text-slate-500 text-sm mt-1">CureOS — لوحة تحكم العيادة</p>
        </div>

        {error && <div className="auth-error mb-5">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="auth-btn w-full">
            {loading ? 'جارٍ الدخول...' : 'دخول →'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link to="/register" className="block w-full border-2 border-teal-600 text-teal-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-600 hover:text-white transition mb-2">
            إنشاء حساب مجاني (7 أيام)
          </Link>
          <Link to="/payment" className="text-sm text-amber-700 hover:underline font-medium">
            تجديد الاشتراك / رفع إيصال
          </Link>
        </div>
      </div>
    </div>
  );
}
