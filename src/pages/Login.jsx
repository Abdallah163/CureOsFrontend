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
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/home');
      } else {
        alert('لم يتم استقبال رمز المصادقة من السيرفر');
      }
    } catch (err) {
      console.error('خطأ في الدخول:', err.response?.data);
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    }
    setLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">

        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">تسجيل الدخول</h1>
          <p className="text-gray-500 text-sm mt-1">لوحة تحليل أداء العيادة</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              placeholder="doctor@clinic.com"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-gray-400 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-gray-400 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                جارٍ الدخول...
              </>
            ) : 'دخول →'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-3">مستخدم جديد؟ ادفع 500 ج.م واشترك فوراً</p>
          <Link
            to="/register"
            className="w-full inline-block text-center border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 mb-2"
          >
            إنشاء حساب جديد
          </Link>
          <Link
            to="/payment"
            className="block text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            💳 اشتراك سريع (بدون تسجيل مسبق)
          </Link>
        </div>

      </div>
    </div>
  );
}
