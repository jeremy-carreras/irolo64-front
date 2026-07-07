import { Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDangerous
            ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
            : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            {isDangerous && <Trash2 className="text-red-600" size={24} />}
            <h2 className={`text-xl font-bold ${isDangerous ? 'text-red-900' : 'text-gray-900'}`}>
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-700 text-center">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 ${
              isDangerous
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600'
            } text-${isDangerous ? 'white' : 'gray-900'} font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
