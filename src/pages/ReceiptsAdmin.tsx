import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import '../styles/ReceiptsAdmin.css';
import client from '../api/client';

interface Receipt {
  id: string;
  totalCharge: number;
  periodStart: string;
  periodEnd: string;
  pricePerM3: number;
  paymentDeadline: string;
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
    periodStart: '',
    periodEnd: '',
    pricePerM3: '',
    paymentDeadline: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

    if (!form.totalCharge || !form.periodStart || !form.periodEnd || !form.pricePerM3 || !form.paymentDeadline) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const body = {
        totalCharge: parseFloat(form.totalCharge),
        pricePerM3: parseFloat(form.pricePerM3),
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        paymentDeadline: form.paymentDeadline,
      };

      if (editingId) {
        await client.patch(`/receipts/${editingId}`, body);
      } else {
        await client.post('/receipts', body);
      }

      setForm({
        totalCharge: '',
        periodStart: '',
        periodEnd: '',
        pricePerM3: '',
        paymentDeadline: '',
      });
      setEditingId(null);
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
    setEditingId(receipt.id);
    setForm({
      totalCharge: String(receipt.totalCharge),
      periodStart: receipt.periodStart.split('T')[0],
      periodEnd: receipt.periodEnd.split('T')[0],
      pricePerM3: String(receipt.pricePerM3),
      paymentDeadline: receipt.paymentDeadline.split('T')[0],
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      totalCharge: '',
      periodStart: '',
      periodEnd: '',
      pricePerM3: '',
      paymentDeadline: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este recibo?')) {
      try {
        setLoading(true);
        await client.delete(`/receipts/${id}`);
        loadReceipts();
        setSuccess('Recibo eliminado');
      } catch (err) {
        console.error('Error deleting receipt:', err);
        setError('Error al eliminar el recibo');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="receipts-admin">
        <h1>Cargar Recibo General</h1>

      <div className="form-section">
        <h2>{editingId ? 'Editar Recibo' : 'Datos del Recibo Físico'}</h2>
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
              <label>Precio por m³ ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.pricePerM3}
                onChange={(e) => setForm({ ...form, pricePerM3: e.target.value })}
                disabled={loading}
                required
              />
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
              <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="receipts-list">
        <h2>Recibos Cargados</h2>
        {receipts.length === 0 ? (
          <p>No hay recibos cargados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cargo Total</th>
                <th>Periodo</th>
                <th>Precio/m³</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>${parseFloat(String(receipt.totalCharge)).toFixed(2)}</td>
                  <td>
                    {formatDate(receipt.periodStart)} -{' '}
                    {formatDate(receipt.periodEnd)}
                  </td>
                  <td>${parseFloat(String(receipt.pricePerM3)).toFixed(2)}</td>
                  <td>{formatDate(receipt.paymentDeadline)}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleEdit(receipt)}
                      className="btn-edit"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(receipt.id)}
                      className="btn-danger"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </Layout>
  );
}
