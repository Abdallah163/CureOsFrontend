import React, { useState } from "react";
import AppShell from "../components/AppShell";
import Dashboard from "../components/Dashboard";
import UploadExcel from "../components/UploadExcel";

export default function Home() {
  const [refresh, setRefresh] = useState(false);

  const downloadExcelTemplate = () => {
    const XLSX = require("xlsx");
    const template = [
      {
        التاريخ: "2024-01-15",
        "اسم المريض": "محمد أحمد",
        "رقم واتساب": "201012345678",
        "نوع الخدمة": "كشف عام",
        المبلغ: 200,
        "جديد/قديم": "جديد",
        "طريقة الدفع": "كاش",
        الدكتور: "د. أحمد",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "قالب الاستيراد");
    XLSX.writeFile(wb, "قالب_استيراد_زيارات_العيادة.xlsx");
  };

  return (
    <AppShell title="لوحة تحليل أداء العيادة" showLogoUpload>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <UploadExcel onUpload={() => setRefresh(!refresh)} />
        <button
          onClick={downloadExcelTemplate}
          className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 shadow-sm"
        >
          📄 تحميل قالب Excel
        </button>
      </div>
      <Dashboard key={refresh} />
    </AppShell>
  );
}
