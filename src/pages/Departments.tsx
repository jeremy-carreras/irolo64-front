import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DepartmentFormModal } from '../components/DepartmentFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/LoadingSkeletons';
import { departmentsAPI } from '../api/client';
import { Department } from '../types';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';

interface DepartmentsPageProps {
  onLogout: () => void;
}

export function DepartmentsPage({ onLogout }: DepartmentsPageProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; deptId: string | null }>({
    isOpen: false,
    deptId: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getAll();

      // Ordenar: GH primero, luego números, luego PH
      const sorted = response.data.sort((a: Department, b: Department) => {
        const getOrder = (code: string) => {
          if (code.startsWith('GH')) return 0;
          if (code.startsWith('P')) return 2;
          return 1; // números
        };

        const orderA = getOrder(a.code);
        const orderB = getOrder(b.code);

        if (orderA !== orderB) return orderA - orderB;
        return a.code.localeCompare(b.code);
      });

      setDepartments(sorted);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dept?: Department) => {
    setSelectedDept(dept);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedDept(undefined);
    setIsModalOpen(false);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedDept) {
        await departmentsAPI.update(selectedDept.id, formData);
      } else {
        await departmentsAPI.create(formData);
      }
      await fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDelete({ isOpen: true, deptId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.deptId) return;
    try {
      setDeleting(confirmDelete.deptId);
      await departmentsAPI.delete(confirmDelete.deptId);
      await fetchDepartments();
      setConfirmDelete({ isOpen: false, deptId: null });
    } catch (error) {
      console.error('Error deleting department:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleRowClick = (dept: Department) => {
    navigate(`/departments/${dept.id}`);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Departamentos</h1>
            <p className="text-gray-600 mt-1">
              Gestiona los {departments.length} departamentos de Palma Irolo
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Nuevo Departamento
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Departamento
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Propietario
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-yellow-50/50 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(dept)}
                    >
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-gray-900 font-bold text-lg">
                          {dept.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {dept.ownerName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            dept.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {dept.isActive ? '● Activo' : '● Inactivo'}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 flex gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenModal(dept)}
                          className="text-gray-600 hover:text-yellow-600 transition-colors p-2 hover:bg-yellow-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(dept.id)}
                          disabled={deleting === dept.id}
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
            <div className="md:hidden p-4 space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => handleRowClick(dept)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-gray-900 font-bold text-lg flex-shrink-0">
                        {dept.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            dept.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {dept.isActive ? '● Activo' : '● Inactivo'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-yellow-600 transition-colors flex-shrink-0" />
                  </div>

                  {/* Propietario */}
                  {dept.ownerName && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Propietario:</span> {dept.ownerName}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="flex flex-col gap-2 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenModal(dept)}
                      className="text-sm text-yellow-600 hover:bg-yellow-50 py-2.5 px-3 rounded font-medium transition-colors border border-yellow-200 hover:border-yellow-400"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(dept.id)}
                      disabled={deleting === dept.id}
                      className="text-sm text-red-600 hover:bg-red-50 py-2.5 px-3 rounded font-medium transition-colors disabled:opacity-50 border border-red-200 hover:border-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DepartmentFormModal
        isOpen={isModalOpen}
        department={selectedDept}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Eliminar Departamento"
        message="¿Está seguro de que desea eliminar este departamento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, deptId: null })}
        isLoading={deleting !== null}
      />
    </Layout>
  );
}
