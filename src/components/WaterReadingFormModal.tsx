import { useState, useEffect } from 'react';
import { WaterReading } from '../types';
import { X, Loader2, Droplet } from 'lucide-react';

interface WaterReadingFormModalProps {
  isOpen: boolean;
  reading?: WaterReading;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function WaterReadingFormModal({
  isOpen,
  reading,
  onClose,
  onSubmit,
}: WaterReadingFormModalProps) {
  const [formData, setFormData] = useState({
    readingDate: '',
    meterReading: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reading) {
      setFormData({
        readingDate: reading.readingDate.split('T')[0],
        meterReading: String(reading.meterReading),
        notes: reading.notes || '',
      });
    } else {
      setFormData({
        readingDate: new Date().toISOString().split('T')[0],
        meterReading: '',
        notes: '',
      });
    }
    setError('');
  }, [reading, isOpen]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la lectura');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <Droplet className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">
              {reading ? 'Editar Lectura' : 'Nueva Lectura'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Lectura *
            </label>
            <input
              type="date"
              name="readingDate"
              value={formData.readingDate}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-base"
              style={{ WebkitAppearance: 'none' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lectura del Medidor (m³) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                name="meterReading"
                value={formData.meterReading}
                onChange={handleChange}
                placeholder="Ej: 150.50"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-12 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                m³
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ej: Lectura inicial, verificada..."
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Lectura'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
