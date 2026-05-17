import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Dashboard        from '../components/Dashboard';
import UploadExcel      from '../components/UploadExcel';

export default function Home() {
  const [refresh, setRefresh] = useState(false);
  const logout = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

  const downloadExcelTemplate = () => {
    const XLSX = require('xlsx');
    const template = [{
      'التاريخ': '2024-01-15', 'اسم المريض': 'محمد أحمد', 'رقم واتساب': '201012345678',
      'نوع الخدمة': 'كشف عام', 'المبلغ': 200, 'جديد/قديم': 'جديد', 'طريقة الدفع': 'كاش', 'الدكتور': 'د. أحمد'
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب الاستيراد');
    XLSX.writeFile(wb, 'قالب_استيراد_زيارات_العيادة.xlsx');
  };

  const isAdmin = localStorage.getItem('token'); // التحقق من الصلاحيات لاحقاً عبر API

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">📊 لوحة تحليل أداء العيادة</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/clinics" className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            🌐 عيادات
          </Link>
          <Link to="/patients" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            📋 ملفات
          </Link>
          <Link to="/scheduler" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            📅 المواعيد
          </Link>
          <Link to="/whatsapp" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            📱 واتساب
          </Link>
          <Link to="/payment" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            💳 اشتراك
          </Link>
          <Link to="/admin" className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            ⚙️ إدارة
          </Link>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition">
            خروج
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <UploadExcel onUpload={() => setRefresh(!refresh)} />
          <button onClick={downloadExcelTemplate}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-200 whitespace-nowrap">
            📄 تحميل قالب Excel
          </button>
        </div>
        <Dashboard key={refresh} />
      </div>
    </div>
  );
}
