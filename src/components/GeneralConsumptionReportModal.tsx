import { useEffect, useState } from 'react';
import { BarChart3, Download, Loader2, X } from 'lucide-react';
import {
  calculateGeneralConsumptionReport,
  DepartmentWithReadings,
  generateGeneralConsumptionReportPDF,
  GeneralReportReceipt,
} from '../utils/generalConsumptionReport';
import { formatCurrency, formatDate, formatNumber } from '../utils/dateFormatter';

interface GeneralConsumptionReportModalProps {
  isOpen: boolean;
  receipt: GeneralReportReceipt | null;
  departments: DepartmentWithReadings[];
  onClose: () => void;
}

export function GeneralConsumptionReportModal({
  isOpen,
  receipt,
  departments,
  onClose,
}: GeneralConsumptionReportModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [report, setReport] = useState<ReturnType<typeof calculateGeneralConsumptionReport> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !receipt) {
      setReport(null);
      setError('');
      setPdfUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return null;
      });
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    setReport(null);
    setPdfUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });

    const generateReport = async () => {
      try {
        const calculatedReport = calculateGeneralConsumptionReport(receipt, departments);
        const blob = await generateGeneralConsumptionReportPDF(calculatedReport);
        const nextUrl = URL.createObjectURL(blob);
        if (active) {
          setReport(calculatedReport);
          setPdfUrl(nextUrl);
        } else {
          URL.revokeObjectURL(nextUrl);
        }
      } catch (generationError) {
        console.error('Error generating general consumption report:', generationError);
        if (active) setError('No fue posible generar el reporte PDF.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void generateReport();

    return () => {
      active = false;
    };
  }, [isOpen, receipt, departments]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (!isOpen || !receipt) return null;

  const fileName = `reporte_consumo_${receipt.periodStart.split('T')[0]}_${receipt.periodEnd.split('T')[0]}.pdf`;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BarChart3 className="shrink-0 text-blue-600" size={24} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                Reporte general de consumo
              </h2>
              <p className="truncate text-xs text-gray-600 sm:text-sm">
                {formatDate(receipt.periodStart)} al {formatDate(receipt.periodEnd)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
            aria-label="Cerrar reporte"
          >
            <X size={21} />
          </button>
        </div>

        {report && (
          <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-gray-200 bg-white p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
            <div className="rounded-lg bg-blue-50 p-2.5 sm:p-3">
              <p className="text-[11px] font-medium text-blue-700 sm:text-xs">Cargo total</p>
              <p className="text-sm font-bold text-gray-900 sm:text-base">{formatCurrency(receipt.totalCharge)}</p>
            </div>
            <div className="rounded-lg bg-cyan-50 p-2.5 sm:p-3">
              <p className="text-[11px] font-medium text-cyan-700 sm:text-xs">Consumo total</p>
              <p className="text-sm font-bold text-gray-900 sm:text-base">{formatNumber(receipt.consumedM3)} m³</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 sm:p-3">
              <p className="text-[11px] font-medium text-amber-700 sm:text-xs">Áreas comunes</p>
              <p className="text-sm font-bold text-gray-900 sm:text-base">{formatNumber(report.commonAreasConsumption)} m³</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 sm:p-3">
              <p className="text-[11px] font-medium text-emerald-700 sm:text-xs">Departamentos</p>
              <p className="text-sm font-bold text-gray-900 sm:text-base">{report.rows.length}</p>
            </div>
          </div>
        )}

        <div className="relative min-h-0 flex-1 bg-gray-100 p-2 sm:p-4">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/90">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                Generando previsualización...
              </div>
            </div>
          )}
          {error ? (
            <div className="flex h-full items-center justify-center rounded-lg bg-white p-6 text-center text-red-600">
              {error}
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Previsualización del reporte general de consumo"
              className="h-full w-full rounded-lg border-0 bg-white shadow-sm"
            />
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 p-3 sm:flex-row sm:justify-end sm:p-4">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          >
            Cerrar
          </button>
          <a
            href={pdfUrl || undefined}
            download={fileName}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all ${
              pdfUrl
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : 'pointer-events-none bg-gray-400'
            }`}
            aria-disabled={!pdfUrl}
          >
            <Download size={18} />
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
}
