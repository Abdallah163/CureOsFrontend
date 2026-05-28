import React, { useEffect, useState, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const formatArabicDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
};

export default function Dashboard() {
  const dashboardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  const [data, setData] = useState({
    totalRevenue: 0,
    dailyRevenue: [],
    last7Days: [],
    topServices: [],
    retentionRate: 0,
    alert: null,
    patientCount: 0,
    paymentMethods: {},
    averageTicket: 0,
    patientStats: { new: 0, returning: 0, retentionRate: 0 }
  });

  const [surveyData, setSurveyData] = useState({
    currentMonth: { count: 0, avg: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, lowCount: 0 },
    prevMonth: { count: 0, avg: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, lowCount: 0 },
    recentRatings: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!showSurvey) return;
    const fetchSurvey = async () => {
      try {
        const res = await api.get('/api/rating/monthly-analysis');
        setSurveyData(res.data);
      } catch (err) {
        console.error('خطأ في تحميل التقييمات:', err);
      }
    };
    fetchSurvey();
  }, [showSurvey]);

  const dailyLabels = (data.last7Days || []).map(formatArabicDate);

  const lineChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'الإيرادات اليومية (ج.م)',
        data: data.dailyRevenue,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.10)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toLocaleString('ar-EG')} ج.م`,
          title: (items) => items[0].label
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `${val.toLocaleString('ar-EG')} ج.م`
        },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        ticks: { font: { family: 'Arial', size: 11 } },
        grid: { display: false }
      }
    }
  };

  const servicesChartData = {
    labels: (data.topServices || []).map(s => s.name),
    datasets: [
      {
        label: 'عدد الزيارات',
        data: (data.topServices || []).map(s => s.count),
        backgroundColor: ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED'],
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const paymentLabels = Object.keys(data.paymentMethods || {});
  const paymentValues = Object.values(data.paymentMethods || {});
  const doughnutData = {
    labels: paymentLabels,
    datasets: [
      {
        data: paymentValues,
        backgroundColor: ['#2563EB', '#16A34A', '#D97706'],
        borderWidth: 3,
        borderColor: '#fff'
      }
    ]
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F9FAFB',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      let sourceY = 0;
      const sliceHeight = (pageH - margin * 2) * (canvas.width / imgW);

      while (sourceY < canvas.height) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHeight, canvas.height - sourceY);
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, -sourceY);
        const sliceImg = sliceCanvas.toDataURL('image/png');
        const sliceImgH = (sliceCanvas.height * imgW) / canvas.width;
        pdf.addImage(sliceImg, 'PNG', margin, margin, imgW, sliceImgH);
        sourceY += sliceHeight;
        if (sourceY < canvas.height) pdf.addPage();
      }

      const today = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
      pdf.save(`تقرير_العيادة_${today}.pdf`);
    } catch (err) {
      console.error('فشل تصدير PDF:', err);
      alert('حدث خطأ أثناء تصدير التقرير');
    }
    setExporting(false);
  };

  const surveyDistData = {
    labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
    datasets: [{
      label: 'عدد التقييمات',
      data: [
        surveyData.currentMonth.distribution[1] || 0,
        surveyData.currentMonth.distribution[2] || 0,
        surveyData.currentMonth.distribution[3] || 0,
        surveyData.currentMonth.distribution[4] || 0,
        surveyData.currentMonth.distribution[5] || 0,
      ],
      backgroundColor: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#16A34A'],
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  return (
    <div>
      {/* أزرار التصدير */}
      <div className="flex justify-end gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setShowSurvey(!showSurvey)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-200 font-medium"
        >
          📊 {showSurvey ? 'إخفاء تحليل الرضا' : 'تحليل رضا المرضى'}
        </button>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 font-medium"
        >
          {exporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              جارٍ التصدير...
            </>
          ) : '📄 تصدير تقرير PDF'}
        </button>
      </div>

      {/* تحليل رضا المرضى */}
      {showSurvey && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> تحليل رضا المرضى — {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
              <p className="text-xs text-gray-500">عدد التقييمات</p>
              <p className="text-xl font-bold text-purple-700">{surveyData.currentMonth.count}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs text-gray-500">متوسط التقييم</p>
              <p className="text-xl font-bold text-green-700">{surveyData.currentMonth.avg} / 5</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-xs text-gray-500">تقييمات منخفضة</p>
              <p className="text-xl font-bold text-red-700">{surveyData.currentMonth.lowCount}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-gray-500">الشهر الماضي</p>
              <p className="text-xl font-bold text-amber-700">{surveyData.prevMonth.avg || 0} / 5</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">توزيع التقييمات</h4>
              {surveyData.currentMonth.count > 0 ? (
                <Bar data={surveyDistData} options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                  }
                }} />
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">لا توجد تقييمات هذا الشهر</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">آخر التقييمات</h4>
              {surveyData.recentRatings.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {surveyData.recentRatings.map((r, i) => (
                    <div key={i} className={`p-2 rounded-lg text-sm ${r.rating <= 2 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{r.patientName}</span>
                        <span className="text-xs">{'⭐'.repeat(r.rating)}</span>
                      </div>
                      {r.comment && r.comment !== String(r.rating) && (
                        <p className="text-xs text-gray-400 mt-0.5">{r.comment}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">لا توجد تقييمات بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div ref={dashboardRef} className="bg-gray-50 p-4 rounded-xl">

        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-gray-700">
            📊 تقرير أداء العيادة —{' '}
            {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-blue-500">
            <p className="text-gray-500 text-sm mb-1">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.totalRevenue.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-green-500">
            <p className="text-gray-500 text-sm mb-1">إجمالي الزيارات</p>
            <p className="text-2xl font-bold text-green-600">{data.patientCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-yellow-500">
            <p className="text-gray-500 text-sm mb-1">معدل الاحتفاظ</p>
            <p className="text-2xl font-bold text-yellow-600">{data.retentionRate}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-r-4 border-purple-500">
            <p className="text-gray-500 text-sm mb-1">متوسط التذكرة</p>
            <p className="text-2xl font-bold text-purple-600">
              {Number(data.averageTicket || 0).toLocaleString('ar-EG')} ج.م
            </p>
          </div>
        </div>

        {data.alert && (
          <div className="bg-yellow-100 p-3 rounded-lg text-yellow-800 border-r-4 border-yellow-500 mb-4">
            {data.alert}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">📈 إيرادات آخر 7 أيام</h3>
            {data.dailyRevenue.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <p className="text-center text-gray-400 py-10 text-sm">لا توجد بيانات بعد</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">🏆 أكثر الخدمات طلباً</h3>
            {(data.topServices || []).length > 0 ? (
              <Bar
                data={servicesChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                  }
                }}
              />
            ) : (
              <p className="text-center text-gray-400 py-10 text-sm">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">💳 توزيع طرق الدفع</h3>
            {paymentValues.length > 0 ? (
              <div className="flex justify-center">
                <div style={{ maxWidth: 220 }}>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ${ctx.parsed.toLocaleString('ar-EG')} ج.م`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-10 text-sm">لا توجد بيانات بعد</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">👥 إحصائيات المرضى</h3>
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600 text-sm">مرضى جدد</span>
                <span className="text-xl font-bold text-blue-600">
                  {data.patientStats?.new ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600 text-sm">مرضى قدامى</span>
                <span className="text-xl font-bold text-green-600">
                  {data.patientStats?.returning ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-600 text-sm">معدل الاحتفاظ</span>
                <span className="text-xl font-bold text-purple-600">
                  {data.patientStats?.retentionRate ?? data.retentionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
