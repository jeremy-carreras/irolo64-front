import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { WaterReadingFormModal } from '../components/WaterReadingFormModal';
import { GenerateReceiptModal } from '../components/GenerateReceiptModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageLoader } from '../components/LoadingSkeletons';
import { departmentsAPI, waterReadingsAPI } from '../api/client';
import { Department, WaterReading } from '../types';
import { ChevronLeft, Plus, Edit2, Trash2, Droplet, FileText } from 'lucide-react';
import { formatDateFromISO, formatNumber } from '../utils/dateFormatter';

interface DepartmentDetailPageProps {
  onLogout: () => void;
}

export function DepartmentDetailPage({
  onLogout,
}: DepartmentDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [readings, setReadings] = useState<WaterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<WaterReading | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; readingId: string | null }>({
    isOpen: false,
    readingId: null,
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, readingsRes] = await Promise.all([
        departmentsAPI.getById(id!),
        waterReadingsAPI.getByDepartment(id!),
      ]);
      setDepartment(deptRes.data);
      setReadings(readingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reading?: WaterReading) => {
    setSelectedReading(reading);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedReading(undefined);
    setIsModalOpen(false);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedReading) {
        await waterReadingsAPI.update(selectedReading.id, formData);
      } else {
        await waterReadingsAPI.create(id!, formData);
      }
      await fetchData();
    } catch (error) {
      console.error('Error saving reading:', error);
    }
  };

  const handleDeleteClick = (readingId: string) => {
    setConfirmDelete({ isOpen: true, readingId });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.readingId) return;
    try {
      setDeleting(confirmDelete.readingId);
      await waterReadingsAPI.delete(confirmDelete.readingId);
      await fetchData();
      setConfirmDelete({ isOpen: false, readingId: null });
    } catch (error) {
      console.error('Error deleting reading:', error);
    } finally {
      setDeleting(null);
    }
  };

  const totalConsumption =
    formatNumber(readings.reduce((sum, r) => sum + (r.consumption || 0), 0));
  const lastReading = readings[readings.length - 1];

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <PageLoader />
      </Layout>
    );
  }

  if (!department) {
    return (
      <Layout onLogout={onLogout}>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg font-semibold">
            Departamento no encontrado
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/departments')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="w-16 h-14 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-gray-900 font-bold text-2xl">
            {department.code}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Departamento {department.code}
            </h1>
            <p className="text-gray-600">Gestión e información</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Estado</p>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  department.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              ></span>
              <p className="text-lg font-semibold text-gray-800">
                {department.isActive ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Consumo Total</p>
            <div className="flex items-center gap-2">
              <Droplet className="text-blue-500" size={20} />
              <p className="text-2xl font-bold text-gray-900">{totalConsumption}</p>
              <span className="text-gray-600 text-sm">m³</span>
            </div>
          </div>
          {lastReading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Última Lectura</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(lastReading.meterReading)} m³
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateFromISO(lastReading.readingDate)}
              </p>
            </div>
          )}
        </div>

        {/* Details Card */}
        {department.ownerName && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Propietario/Inquilino</h2>
            <p className="text-gray-800">{department.ownerName}</p>
          </div>
        )}

        {/* Water Readings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col gap-4 p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Lecturas de Agua</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg justify-center"
              >
                <Plus size={18} />
                Nueva Lectura
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg justify-center"
              >
                <FileText size={18} />
                Generar Recibo
              </button>
            </div>
          </div>

          {readings.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">
                No hay lecturas registradas aún
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Comienza agregando la primera lectura de agua
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Lectura (m³)
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Consumo (m³)
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Notas
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {readings.map((reading) => (
                      <tr key={reading.id} className="hover:bg-yellow-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-800 font-medium">
                          {formatDateFromISO(reading.readingDate)}
                        </td>
                        <td className="px-6 py-4 font-bold text-yellow-600 text-lg">
                          {formatNumber(reading.meterReading)}
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-semibold">
                          {reading.consumption !== undefined
                            ? formatNumber(reading.consumption)
                            : '0.00'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {reading.notes || '—'}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => handleOpenModal(reading)}
                            className="text-gray-600 hover:text-yellow-600 transition-colors p-2 hover:bg-yellow-50 rounded-lg"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(reading.id)}
                            disabled={deleting === reading.id}
                            className="text-gray-600 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-4">
                {readings.map((reading) => (
                  <div
                    key={reading.id}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {formatNumber(reading.meterReading)} m³
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDateFromISO(reading.readingDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">
                          {reading.consumption !== undefined
                            ? formatNumber(reading.consumption)
                            : '0.00'} m³
                        </p>
                        <p className="text-xs text-gray-600">consumo</p>
                      </div>
                    </div>
                    {reading.notes && (
                      <p className="text-sm text-gray-700 mb-3 pb-3 border-b border-gray-300">
                        {reading.notes}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenModal(reading)}
                        className="text-sm text-yellow-600 hover:bg-yellow-50 py-2.5 px-3 rounded transition-colors font-medium border border-yellow-200 hover:border-yellow-400"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(reading.id)}
                        disabled={deleting === reading.id}
                        className="text-sm text-red-600 hover:bg-red-50 py-2.5 px-3 rounded transition-colors font-medium disabled:opacity-50 border border-red-200 hover:border-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <WaterReadingFormModal
        isOpen={isModalOpen}
        reading={selectedReading}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      <GenerateReceiptModal
        isOpen={isReceiptModalOpen}
        department={department}
        readings={readings}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Eliminar Lectura"
        message="¿Está seguro de que desea eliminar esta lectura de agua? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, readingId: null })}
        isLoading={deleting !== null}
      />
    </Layout>
  );
}
