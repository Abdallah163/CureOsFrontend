import React, { useState } from 'react';
import api from '../api';

export default function UploadExcel({ onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (
      selected.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      selected.type === 'application/vnd.ms-excel'
    )) {
      setFile(selected);
      setMessage(null);
    } else {
      setFile(null);
      setMessage({ type: 'error', text: 'يرجى اختيار ملف Excel فقط (.xlsx أو .xls)' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/upload/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'تم رفع الملف وتحليله بنجاح ✅' });
      setFile(null);
      if (onUpload) onUpload();
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل رفع الملف: ' + (err.response?.data?.message || err.message) });
    }
    setUploading(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-lg font-bold mb-3">📂 رفع ملف Excel</h3>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="border rounded p-2 text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? 'جارٍ الرفع...' : 'رفع الملف'}
        </button>
      </div>

      {file && (
        <p className="mt-2 text-sm text-gray-600">الملف المختار: <strong>{file.name}</strong></p>
      )}

      {message && (
        <p className={`mt-2 text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}