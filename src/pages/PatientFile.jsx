import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

export default function PatientFile() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [recordForm, setRecordForm] = useState({ type: 'note', title: '', description: '' });

  useEffect(() => {
    api.get(`/api/patients/${id}`).then(r => setPatient(r.data)).catch(console.error);
  }, [id]);

  const addRecord = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post(`/api/patients/${id}/medical-record`, recordForm);
      setPatient(p => ({ ...p, medicalHistory: [...(p.medicalHistory || []), r.data] }));
      setRecordForm({ type: 'note', title: '', description: '' });
    } catch (err) { alert(err.response?.data?.message || 'خطأ'); }
  };

  if (!patient) return <div className="text-center py-20">جارٍ التحميل...</div>;

  const MEDICAL_TYPES = [
    { value: 'visit', label: 'زيارة', color: 'blue' },
    { value: 'prescription', label: 'روشتة', color: 'green' },
    { value: 'diagnosis', label: 'تشخيص', color: 'purple' },
    { value: 'xray', label: 'أشعة', color: 'amber' },
    { value: 'analysis', label: 'تحليل', color: 'red' },
    { value: 'note', label: 'ملاحظة', color: 'gray' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Link to="/patients" className="text-gray-400 text-sm hover:text-gray-600">← المرضى</Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold">📄 {patient.name}</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* بطاقة المريض */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg mb-4">بيانات المريض</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'الاسم', value: patient.name },
              { label: 'الهاتف', value: patient.phone },
              { label: 'الرقم القومي', value: patient.nationalId || '—' },
              { label: 'البريد', value: patient.email || '—' },
              { label: 'الجنس', value: patient.gender || '—' },
              { label: 'فصيلة الدم', value: patient.bloodType || '—' },
              { label: 'تاريخ الميلاد', value: patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('ar-EG') : '—' },
              { label: 'العنوان', value: patient.address || '—' },
            ].map((f, i) => (
              <div key={i}>
                <p className="text-xs text-gray-400">{f.label}</p>
                <p className="font-medium text-gray-700">{f.value}</p>
              </div>
            ))}
          </div>

          {(patient.allergies || patient.chronicDiseases || patient.medications) && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              {patient.allergies && <div><p className="text-xs text-red-400">حساسية</p><p className="text-sm">{patient.allergies}</p></div>}
              {patient.chronicDiseases && <div><p className="text-xs text-amber-400">أمراض مزمنة</p><p className="text-sm">{patient.chronicDiseases}</p></div>}
              {patient.medications && <div><p className="text-xs text-blue-400">أدوية</p><p className="text-sm">{patient.medications}</p></div>}
            </div>
          )}
        </div>

        {/* إضافة سجل طبي */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4">➕ إضافة سجل طبي</h3>
          <form onSubmit={addRecord}>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500">النوع</label>
                <select value={recordForm.type} onChange={e => setRecordForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full p-2 border rounded-lg text-sm">
                  {MEDICAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">العنوان</label>
                <input value={recordForm.title} onChange={e => setRecordForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full p-2 border rounded-lg text-sm" placeholder="عنوان السجل" />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500">الوصف</label>
              <textarea value={recordForm.description} onChange={e => setRecordForm(p => ({ ...p, description: e.target.value }))}
                className="w-full p-2 border rounded-lg text-sm resize-none" rows={2} />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm">إضافة</button>
          </form>
        </div>

        {/* التاريخ الطبي */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4">📜 التاريخ الطبي ({patient.medicalHistory?.length || 0})</h3>
          <div className="space-y-3">
            {[...(patient.medicalHistory || [])].reverse().map((r, i) => {
              const t = MEDICAL_TYPES.find(x => x.value === r.type) || MEDICAL_TYPES[5];
              return (
                <div key={i} className={`p-4 rounded-xl border border-${t.color}-100 bg-${t.color}-50`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-${t.color}-100 text-${t.color}-700`}>
                        {t.label}
                      </span>
                      {r.title && <span className="text-sm font-medium text-gray-700 mr-2">{r.title}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt || r.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  {r.description && <p className="text-sm text-gray-600 mt-2">{r.description}</p>}
                  {r.doctorName && <p className="text-xs text-gray-400 mt-1">د. {r.doctorName}</p>}
                </div>
              );
            })}
            {(!patient.medicalHistory || patient.medicalHistory.length === 0) && (
              <p className="text-center text-gray-400 py-6">لا توجد سجلات طبية بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
