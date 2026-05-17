import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, s] = await Promise.all([
          api.get('/api/admin/users'),
          api.get('/api/admin/stats')
        ]);
        setUsers(u.data);
        setStats(s.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleActive = async (id) => {
    try {
      await api.put(`/api/admin/users/${id}/toggle-active`);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch (err) { alert(err.response?.data?.message || 'خطأ'); }
  };

  const logout = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

  if (loading) return <div className="text-center py-20">جارٍ التحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">⚙️ لوحة التحكم — المدير</h1>
        <div className="flex items-center gap-2">
          <Link to="/home" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">الرئيسية</Link>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm">خروج</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-blue-500">
            <p className="text-gray-500 text-sm">إجمالي الأطباء</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalDoctors}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-green-500">
            <p className="text-gray-500 text-sm">نشطون</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeDoctors}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-amber-500">
            <p className="text-gray-500 text-sm">تجريبي</p>
            <p className="text-2xl font-bold text-amber-600">{stats.trialDoctors}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-purple-500">
            <p className="text-gray-500 text-sm">مدفوع</p>
            <p className="text-2xl font-bold text-purple-600">{stats.paidDoctors}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-700">قائمة الأطباء</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">البريد</th>
                  <th className="p-3 text-right">العيادة</th>
                  <th className="p-3 text-right">الرقم القومي</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">الخطة</th>
                  <th className="p-3 text-right">الزيارات</th>
                  <th className="p-3 text-right">واتساب</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3 text-gray-500">{u.clinicName}</td>
                    <td className="p-3 text-gray-400" dir="ltr">{u.nationalId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
<td className="p-3">
                       <span className={`px-2 py-0.5 rounded-full text-xs ${u.plan === '4months' || u.plan === 'monthly' ? 'bg-indigo-100 text-indigo-700' : u.plan === 'weekly' ? 'bg-green-100 text-green-700' : u.plan === 'advertising' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                         {u.plan === '4months' ? 'رباعية الأشهر' : u.plan === 'monthly' ? 'شهرية' : u.plan === 'weekly' ? 'أسبوعية' : u.plan === 'advertising' ? 'الدعاية والإعلان' : u.paymentStatus === 'trial' ? 'تجريبي' : '—'}
                       </span>
                     </td>
                    <td className="p-3 text-gray-500">{u.usage?.visitsCount || 0}/{u.usage?.limitVisits || 0}</td>
                    <td className="p-3 text-gray-500">{u.usage?.whatsappCount || 0}/{u.usage?.limitWhatsapp || 0}</td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(u._id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {u.isActive ? 'إيقاف' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-center text-gray-400 py-8">لا يوجد أطباء بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
