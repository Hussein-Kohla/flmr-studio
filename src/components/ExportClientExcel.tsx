import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Button } from '@/components/ui/Button';

/**
 * Export client financial data as an Excel report.
 * @param client Full client object with subscription and details.
 * @param transactions Array of transaction objects related to the client.
 */
export function ExportClientExcel({ client, transactions }: { client: any; transactions: any[] }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FLMR Studio';
      workbook.lastModifiedBy = 'FLMR Studio';
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet('Transactions');

      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Amount ($)', key: 'amount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      // Add title rows
      sheet.insertRow(1, [`Client Report - ${client?.name || 'Unnamed'}`]);
      sheet.insertRow(2, [`Company: ${client?.company || ''}`]);
      sheet.insertRow(3, [`Email: ${client?.email || ''}`]);
      sheet.insertRow(4, [`Phone: ${client?.phone || ''}`]);
      sheet.insertRow(5, [`Client Type: ${client?.clientType || ''}`]);
      sheet.insertRow(6, []); // Empty row before table headers

      // Apply styles to title
      sheet.getCell('A1').font = { size: 16, bold: true };
      
      // The header row is now shifted down by 6 rows
      sheet.getRow(7).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5850EC' } // Brand color
      };

      if (transactions && transactions.length > 0) {
        transactions.forEach((t) => {
          sheet.addRow({
            date: new Date(t.date ?? t.createdAt).toLocaleDateString(),
            description: t.description ?? '',
            amount: (t.amountCents / 100).toFixed(2),
            status: t.status ?? '',
          });
        });
      } else {
        sheet.addRow({ description: 'No transactions available.' });
      }

      // Write buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `client_${client?._id || 'report'}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Excel file:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleExport}
      loading={isExporting}
      className="rounded-full h-10 px-4 font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
    >
      تصدير Excel
    </Button>
  );
}
