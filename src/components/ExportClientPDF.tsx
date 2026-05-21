import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/Button';

export function ExportClientPDF({ client, transactions }: { client: any; transactions: any[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const paidTransactions = transactions.filter(t => t.status === 'posted' || t.status === 'paid');
  const totalPayments = paidTransactions.reduce((sum, t) => sum + (t.amountCents || 0), 0) / 100;
  const numMonths = paidTransactions.length;
  const avgMonthly = numMonths > 0 ? totalPayments / numMonths : 0;
  
  const amounts = paidTransactions.map(t => (t.amountCents || 0) / 100);
  const highestPayment = amounts.length > 0 ? Math.max(...amounts) : 0;
  const lowestPayment = amounts.length > 0 ? Math.min(...amounts) : 0;

  const handleExport = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    try {
      pdfRef.current.style.display = 'block';
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
      pdfRef.current.style.display = 'none';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`client_${client.name || 'report'}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={handleExport} loading={isExporting} className="rounded-full h-10 px-4 bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white">
        تصدير العميل كـ PDF
      </Button>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div 
          ref={pdfRef} 
          style={{ 
            padding: '40px', 
            background: 'white', 
            color: 'black', 
            width: '800px',
            fontFamily: "'Cairo', sans-serif",
            direction: 'rtl'
          }}
        >
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
              .pdf-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .pdf-table th, .pdf-table td { border: 1px solid #ddd; padding: 12px; text-align: right; }
              .pdf-table th { background-color: #5850ec; color: white; }
              .pdf-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; border-bottom: 2px solid #5850ec; padding-bottom: 10px; }
              .pdf-info { margin-bottom: 30px; font-size: 14px; line-height: 1.8; }
              .pdf-section { margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px; }
              .analytics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px; }
              .analytics-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; }
              .analytics-label { font-size: 12px; color: #6c757d; font-weight: bold; }
              .analytics-value { font-size: 20px; font-weight: bold; color: #5850ec; margin-top: 5px; }
            `}
          </style>
          
          <div className="pdf-title">تقرير العميل: {client.name || 'غير مسمى'}</div>
          
          <div className="pdf-info">
            <div><strong>الشركة:</strong> {client.company || 'غير محدد'}</div>
            <div><strong>البريد الإلكتروني:</strong> {client.email || 'غير محدد'}</div>
            <div><strong>رقم الهاتف:</strong> {client.phone || 'غير محدد'}</div>
            <div><strong>العنوان:</strong> {client.address || 'غير محدد'}</div>
            <div><strong>نوع الخدمة:</strong> {client.clientType || 'غير محدد'}</div>
          </div>

          <table className="pdf-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {transactions && transactions.length > 0 ? (
                transactions.map((t, index) => (
                  <tr key={index}>
                    <td>{new Date(t.date ?? t.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td>{t.description || '-'}</td>
                    <td>{((t.amountCents || 0) / 100).toLocaleString('ar-EG')}</td>
                    <td>{t.status === 'paid' || t.status === 'posted' ? 'مدفوع' : 'معلق'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>لا توجد مدفوعات مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pdf-section">
            <div className="pdf-title" style={{ borderBottom: 'none' }}>تحليل البيانات والأرقام</div>
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-label">إجمالي المدفوعات حتى الآن</div>
                <div className="analytics-value">{totalPayments.toLocaleString('ar-EG')}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">المتوسط الشهري للمدفوعات</div>
                <div className="analytics-value">{avgMonthly.toLocaleString('ar-EG')}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">عدد الأشهر المسجلة</div>
                <div className="analytics-value">{numMonths.toLocaleString('ar-EG')}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">أعلى شهر دفع فيه</div>
                <div className="analytics-value">{highestPayment.toLocaleString('ar-EG')}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">أقل شهر دفع فيه</div>
                <div className="analytics-value">{lowestPayment.toLocaleString('ar-EG')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
