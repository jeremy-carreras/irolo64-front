import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, FileText, Eye } from 'lucide-react';
import { Department, WaterReading } from '../types';
import { generateReceiptPDF, calculateReceipt } from '../utils/pdfGenerator';

interface Receipt {
  id: string;
  totalCharge: number;
  periodStart: string;
  periodEnd: string;
  pricePerM3: number;
  paymentDeadline: string;
}

interface GenerateReceiptModalProps {
  isOpen: boolean;
  department: Department | null;
  readings: WaterReading[];
  onClose: () => void;
}

const API_TARGET = import.meta.env.VITE_API_TARGET || 'http://localhost:3001';
const client = axios.create({ baseURL: API_TARGET });

export function GenerateReceiptModal({
  isOpen,
  department,
  readings,
  onClose,
}: GenerateReceiptModalProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricePerM3, setPricePerM3] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && department) {
      loadReceipts();
    }
  }, [isOpen, department]);

  const loadReceipts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_TARGET}/receipts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error loading receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Error al cargar recibos');
    }
  };

  if (!isOpen || !department) return null;

  const validateForm = () => {
    if (!startDate || !endDate || !pricePerM3) {
      setError('Por favor completa todos los campos');
      return false;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return false;
    }

    if (parseFloat(pricePerM3) <= 0) {
      setError('El precio por m3 debe ser mayor a 0');
      return false;
    }

    return true;
  };

  const handlePreview = () => {
    setError('');

    let start, end, price;

    if (selectedReceipt && !useManual) {
      start = new Date(selectedReceipt.periodStart).toISOString().split('T')[0];
      end = new Date(selectedReceipt.periodEnd).toISOString().split('T')[0];
      price = parseFloat(String(selectedReceipt.pricePerM3));
    } else {
      if (!validateForm()) return;
      start = startDate;
      end = endDate;
      price = parseFloat(pricePerM3);
    }

    try {
      const receipt = calculateReceipt(readings, start, end, price);
      setPreviewData({
        startDate: start,
        endDate: end,
        pricePerM3: price,
        receipt,
        selectedReceiptId: selectedReceipt?.id,
      });
      setShowPreview(true);
    } catch (err) {
      setError('Error al calcular el recibo');
      console.error(err);
    }
  };

  const handleGenerateReceipt = async () => {
    setLoading(true);
    try {
      await generateReceiptPDF({
        department,
        readings,
        startDate,
        endDate,
        pricePerM3: parseFloat(pricePerM3),
      });
      setShowPreview(false);
      onClose();
    } catch (err) {
      setError('Error al generar el recibo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Preview View
  if (showPreview && previewData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 max-h-96 overflow-y-auto">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
            <div className="flex items-center gap-3">
              <Eye className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Vista Previa del Recibo</h2>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              disabled={loading}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="p-8 space-y-4 text-sm">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Palma Irolo</h1>
              <p className="text-gray-600">Irolo 64 - Sistema de Administración</p>
            </div>

            <div className="border-t border-b border-gray-300 py-4">
              <h3 className="text-lg font-bold text-gray-900 text-center">RECIBO DE AGUA</h3>
            </div>

            {/* Departamento Info */}
            <div>
              <p className="font-semibold text-gray-900">Departamento: {department.code}</p>
              {department.ownerName && (
                <p className="text-gray-700">Propietario: {department.ownerName}</p>
              )}
            </div>

            {/* Período */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-gray-700">
                <span className="font-semibold">Período:</span> {previewData.receipt.period}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Días:</span> {previewData.receipt.totalDays}
              </p>
            </div>

            {/* Consumo */}
            <div>
              <p className="font-semibold text-gray-900 mb-2">Detalle de Consumo</p>
              <div className="space-y-2 bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Lectura Inicial:</span>
                  <span className="font-semibold text-gray-900">
                    {previewData.receipt.initialReading.toFixed(2)} m³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Lectura Final:</span>
                  <span className="font-semibold text-gray-900">
                    {previewData.receipt.finalReading.toFixed(2)} m³
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Consumo Total:</span>
                  <span className="font-bold text-lg text-yellow-600">
                    {previewData.receipt.consumption.toFixed(2)} m³
                  </span>
                </div>
              </div>
            </div>

            {/* Estimación */}
            {previewData.receipt.hasEstimation && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-xs">
                ⚠ Consumo estimado (lecturas no exactas)
              </div>
            )}

            {/* Tarifa */}
            <div>
              <p className="font-semibold text-gray-900 mb-2">Cálculo de Tarifa</p>
              <div className="space-y-2 bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Precio por m³:</span>
                  <span className="font-semibold text-gray-900">
                    ${parseFloat(String(previewData.pricePerM3)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    Consumo {previewData.receipt.consumption.toFixed(2)} m³:
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${previewData.receipt.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">TOTAL A PAGAR:</span>
                  <span className="font-bold text-lg text-blue-600">
                    ${previewData.receipt.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Buttons */}
          <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowPreview(false)}
              disabled={loading}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              onClick={handleGenerateReceipt}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Generar Recibo Individual</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Departamento Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Departamento:</span> {department.code}
            </p>
            {department.ownerName && (
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-semibold">Propietario:</span> {department.ownerName}
              </p>
            )}
          </div>

          {/* Recibos Disponibles */}
          {receipts.length > 0 && !useManual && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecciona un Recibo General
              </label>
              <select
                value={selectedReceipt?.id || ''}
                onChange={(e) => {
                  const receipt = receipts.find(r => r.id === e.target.value);
                  setSelectedReceipt(receipt || null);
                }}
                disabled={loading}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:bg-gray-100"
              >
                <option value="">Elige un recibo general</option>
                {receipts.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {new Date(receipt.periodStart).toLocaleDateString()} - {new Date(receipt.periodEnd).toLocaleDateString()} | Cargo: ${parseFloat(String(receipt.totalCharge)).toFixed(2)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setUseManual(true)}
                className="text-xs text-blue-600 mt-2 hover:underline"
              >
                O ingresar datos manualmente
              </button>
            </div>
          )}

          {/* Manual Entry */}
          {(useManual || receipts.length === 0) && (
            <>
              {receipts.length > 0 && (
                <button
                  onClick={() => setUseManual(false)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  ← Usar recibo existente
                </button>
              )}

              {/* Fecha Inicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Inicio del Período
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:bg-gray-100"
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Fin del Período
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:bg-gray-100"
                />
              </div>

              {/* Precio por m3 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio por m³
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={pricePerM3}
                    onChange={(e) => setPricePerM3(e.target.value)}
                    disabled={loading}
                    placeholder="0.00"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 pl-8 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 border border-gray-200">
            <p className="font-semibold mb-2 text-gray-700">Nota:</p>
            <p>Si no hay lecturas exactas para estas fechas, se estimará proporcionalmente el consumo.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Eye size={18} />
                Previsualizar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
