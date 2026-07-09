import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import '../styles/ReceiptsAdmin.css';
import client from '../api/client';
import { Plus, ChevronDown, Edit2, Trash2, Eye, X, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/dateFormatter';
import { estimateConsumptionAdvanced } from '../utils/consumptionEstimator';
import { waterReadingsAPI } from '../api/client';

interface Receipt {
  id: string;
  totalCharge: number;
  periodStart: string;
  periodEnd: string;
  pricePerM3: number;
  paymentDeadline: string;
  pdfUrl?: string;
}

interface ReceiptsAdminProps {
  onLogout: () => void;
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

export default function ReceiptsAdmin({ onLogout }: ReceiptsAdminProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [form, setForm] = useState({
    totalCharge: '',
    consumedM3: '',
    periodStart: '',
    periodEnd: '',
    paymentDeadline: '',
    pdfUrl: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [allReadings, setAllReadings] = useState<any[]>([]);
  const [estimationConfidence, setEstimationConfidence] = useState(0);

  useEffect(() => {
    loadReceipts();
    loadAllReadings();
  }, []);

  const loadAllReadings = async () => {
    try {
      const response = await waterReadingsAPI.getAll();
      setAllReadings(response.data || []);
    } catch (err) {
      console.error('Error loading readings:', err);
    }
  };

  const estimateConsumption = () => {
    if (!form.periodStart || !form.periodEnd || allReadings.length === 0) {
      return;
    }

    const result = estimateConsumptionAdvanced(
      allReadings,
      form.periodStart,
      form.periodEnd
    );

    setEstimationConfidence(result.confidence);
    if (!form.consumedM3 || form.consumedM3 === '') {
      setForm((prev) => ({
        ...prev,
        consumedM3: result.estimated.toString(),
      }));
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (showForm && form.periodStart && form.periodEnd) {
      estimateConsumption();
    }
  }, [form.periodStart, form.periodEnd, showForm]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await client.get('/receipts');
      setReceipts(response.data);
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Error al cargar recibos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.totalCharge || !form.consumedM3 || !form.periodStart || !form.periodEnd || !form.paymentDeadline) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const totalCharge = parseFloat(form.totalCharge);
      const consumedM3 = parseFloat(form.consumedM3);
      const pricePerM3 = totalCharge / consumedM3;

      const body = {
        totalCharge,
        pricePerM3,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        paymentDeadline: form.paymentDeadline,
        pdfUrl: form.pdfUrl || null,
      };

      if (editingId) {
        await client.patch(`/receipts/${editingId}`, body);
      } else {
        await client.post('/receipts', body);
      }

      setForm({
        totalCharge: '',
        consumedM3: '',
        periodStart: '',
        periodEnd: '',
        paymentDeadline: '',
        pdfUrl: '',
      });
      setEditingId(null);
      setShowForm(false);
      loadReceipts();
      setSuccess(editingId ? 'Recibo actualizado' : 'Recibo cargado exitosamente');
    } catch (err) {
      console.error('Error saving receipt:', err);
      setError('Error al guardar el recibo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (receipt: Receipt) => {
    const consumedM3 = receipt.totalCharge / receipt.pricePerM3;
    setEditingId(receipt.id);
    setShowForm(true);
    setForm({
      totalCharge: String(receipt.totalCharge),
      consumedM3: String(consumedM3),
      periodStart: receipt.periodStart.split('T')[0],
      periodEnd: receipt.periodEnd.split('T')[0],
      paymentDeadline: receipt.paymentDeadline.split('T')[0],
      pdfUrl: receipt.pdfUrl || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({
      totalCharge: '',
      consumedM3: '',
      periodStart: '',
      periodEnd: '',
      paymentDeadline: '',
      pdfUrl: '',
    });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setLoading(true);
      await client.delete(`/receipts/${deleteConfirmId}`);
      loadReceipts();
      setSuccess('Recibo eliminado');
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting receipt:', err);
      setError('Error al eliminar el recibo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="receipts-admin">
        <h1>Cargar Recibo General</h1>

      <div className={`form-accordion ${showForm ? 'open' : ''}`}>
        <button
          onClick={() => setShowForm(!showForm)}
          className="accordion-header"
          disabled={loading}
        >
          <div className="accordion-title">
            <Plus size={20} />
            <span>{editingId ? 'Editar Recibo' : 'Agregar Recibo'}</span>
          </div>
          <ChevronDown size={20} className={`chevron ${showForm ? 'rotated' : ''}`} />
        </button>

        {showForm && (
        <div className="accordion-content">
      <div className="form-section p-1">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Cargo Total ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.totalCharge}
                onChange={(e) => setForm({ ...form, totalCharge: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <div className="label-with-badge">
                <label>Total m³ Consumidos</label>
                {estimationConfidence > 0 && (
                  <span className={`confidence-badge confidence-${estimationConfidence > 75 ? 'high' : estimationConfidence > 50 ? 'medium' : 'low'}`}>
                    {estimationConfidence}% confianza
                  </span>
                )}
              </div>
              <div className="input-with-button">
                <input
                  type="number"
                  step="0.01"
                  value={form.consumedM3}
                  onChange={(e) => {
                    setForm({ ...form, consumedM3: e.target.value });
                    setEstimationConfidence(0);
                  }}
                  disabled={loading}
                  placeholder="Ingresa o estima automáticamente"
                  required
                />
                <button
                  type="button"
                  onClick={estimateConsumption}
                  className="btn-estimate"
                  title="Estimar consumo basado en lecturas"
                  disabled={loading || !form.periodStart || !form.periodEnd}
                >
                  <Zap size={16} />
                </button>
              </div>
              {estimationConfidence > 0 && estimationConfidence < 100 && (
                <small className="helper-text">
                  {estimationConfidence >= 75
                    ? '✓ Datos confiables (fechas exactas disponibles)'
                    : estimationConfidence >= 50
                    ? '⚠ Estimación moderada (algunas fechas interpoladas)'
                    : '⚠ Estimación básica (pocas lecturas disponibles)'}
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Periodo Inicio</label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label>Periodo Fin</label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Fecha Límite de Pago</label>
            <input
              type="date"
              value={form.paymentDeadline}
              onChange={(e) => setForm({ ...form, paymentDeadline: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Ruta del PDF (opcional)</label>
            <input
              type="text"
              value={form.pdfUrl}
              onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
              disabled={loading}
              placeholder="Ej: /ruta/del/archivo.pdf o URL"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : editingId ? 'Actualizar Recibo' : 'Cargar Recibo'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading} style={{ marginRight: 0 }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
        </div>
        )}
      </div>

      <div className="receipts-list p-1">
        <h2 className='pb-3 px-1'>Recibos cargados</h2>
        {receipts.length === 0 ? (
          <p>No hay recibos cargados</p>
        ) : (
          <>
            {/* Table view for larger screens */}
            <div className="table-container">
              <table className="receipts-table">
                <thead>
                  <tr>
                    <th>Cargo Total</th>
                    <th>Período Inicio</th>
                    <th>Período Fin</th>
                    <th>Precio/m³</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...receipts].sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()).map((receipt) => (
                    <tr key={receipt.id}>
                      <td>{formatCurrency(receipt.totalCharge)}</td>
                      <td>{formatDate(receipt.periodStart)}</td>
                      <td>{formatDate(receipt.periodEnd)}</td>
                      <td>{formatCurrency(receipt.pricePerM3)}</td>
                      <td>{formatDate(receipt.paymentDeadline)}</td>
                      <td className="actions">
                        {receipt.pdfUrl && (
                          <button
                            onClick={() => setPdfPreviewUrl(receipt.pdfUrl!)}
                            className="btn-icon btn-preview"
                            title="Ver PDF"
                            disabled={loading}
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(receipt)}
                          className="btn-icon btn-edit"
                          title="Editar recibo"
                          disabled={loading}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="btn-icon btn-delete"
                          title="Eliminar recibo"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card view for smaller screens */}
            <div className="receipts-cards">
              {[...receipts].sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()).map((receipt) => (
                <div key={receipt.id} className="receipt-card">
                  <div className="card-header">
                    <div>
                      <p className="card-date-range">
                        {formatDate(receipt.periodStart)} - {formatDate(receipt.periodEnd)}
                      </p>
                      <p className="card-charge">{formatCurrency(receipt.totalCharge)}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-row">
                      <span className="card-label">Precio/m³:</span>
                      <span className="card-value">{formatCurrency(receipt.pricePerM3)}</span>
                    </div>
                    <div className="card-row">
                      <span className="card-label">Vencimiento:</span>
                      <span className="card-value">{formatDate(receipt.paymentDeadline)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    {receipt.pdfUrl && (
                      <button
                        onClick={() => setPdfPreviewUrl(receipt.pdfUrl!)}
                        className="btn-icon btn-preview"
                        title="Ver PDF"
                        disabled={loading}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(receipt)}
                      className="btn-icon btn-edit"
                      title="Editar recibo"
                      disabled={loading}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(receipt.id)}
                      className="btn-icon btn-delete"
                      title="Eliminar recibo"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Eliminar Recibo</h3>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar este recibo? Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="modal-overlay">
          <div className="pdf-modal-content">
            <div className="pdf-modal-header">
              <h3 className="modal-title">Vista Previa del PDF</h3>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="btn-close"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="pdf-modal-body">
              {pdfPreviewUrl.includes('drive.google.com') ? (
                <div className="pdf-google-drive">
                  <p className="google-drive-message">
                    Este PDF está alojado en Google Drive.
                  </p>
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-pdf"
                  >
                    Abrir en Google Drive →
                  </a>
                  <p className="google-drive-note">
                    Si no tienes acceso, solicita permiso al propietario o usa un PDF alojado en un servidor público.
                  </p>
                </div>
              ) : (
                <iframe
                  src={pdfPreviewUrl}
                  title="PDF Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                  onError={() => {
                    console.error('Error loading PDF');
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
