import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    api.get('/api/patients').then(r => setPatients(r.data)).catch(console.error);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Link to="/home" className="text-gray-400 text-sm hover:text-gray-600">← الرئيسية</Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold">📋 ملفات المرضى الرقمية</h1>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid gap-3">
          {patients.map(p => (
            <Link key={p._id} to={`/patients/${p._id}`}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex justify-between items-start hover:border-blue-200 transition">
              <div className="flex-1">
                <p className="font-bold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400" dir="ltr">{p.phone}</p>
                {p.chronicDiseases && <p className="text-xs text-red-400 mt-1">⚠ {p.chronicDiseases}</p>}
              </div>
              <div className="text-left text-sm text-gray-400">
                <p>{p.totalVisits || 0} زيارة</p>
                <p>{(p.totalSpent || 0).toLocaleString()} ج.م</p>
                {p.medicalHistory?.length > 0 && <p className="text-blue-400">📄 {p.medicalHistory.length} سجل</p>}
              </div>
            </Link>
          ))}
          {patients.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>لا يوجد مرضى بعد. ستظهر ملفات المرضى عند إضافة مواعيد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
