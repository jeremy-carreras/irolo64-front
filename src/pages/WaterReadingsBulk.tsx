import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { waterReadingsAPI, departmentsAPI } from '../api/client';
import { Department, WaterReading } from '../types';

interface DepartmentWithReading extends Department {
  reading?: WaterReading;
  meterReading: string;
}

interface WaterReadingsBulkProps {
  onLogout: () => void;
}

export default function WaterReadingsBulk({ onLogout }: WaterReadingsBulkProps) {
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [departments, setDepartments] = useState<DepartmentWithReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getAll();
      const depts = response.data as Department[];

      const sorted = [...depts].sort((a, b) => {
        const aIsGH = a.code.startsWith('GH');
        const bIsGH = b.code.startsWith('GH');

        if (aIsGH && !bIsGH) return -1;
        if (!aIsGH && bIsGH) return 1;

        return a.code.localeCompare(b.code);
      });

      setDepartments(sorted.map(d => ({ ...d, meterReading: '' })));
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Error al cargar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const loadReadingsForDate = async () => {
    if (!readingDate) return;

    try {
      setLoading(true);
      setError('');

      const response = await waterReadingsAPI.getByDate(readingDate);
      const readings = response.data as (WaterReading & { department: Department })[];

      const readingsByDeptId = new Map(
        readings.map(r => [r.department?.id || r.departmentId, r])
      );

      const updatedDepts = departments.map(dept => ({
        ...dept,
        reading: readingsByDeptId.get(dept.id),
        meterReading: readingsByDeptId.get(dept.id)?.meterReading.toString() || dept.meterReading
      }));

      setDepartments(updatedDepts);
    } catch (err) {
      console.error('Error loading readings:', err);
      setError('Error al cargar lecturas');
    } finally {
      setLoading(false);
    }
  };

  const handleMeterReadingChange = (deptId: string, value: string) => {
    setDepartments(departments.map(d =>
      d.id === deptId ? { ...d, meterReading: value } : d
    ));
  };

  const handleSaveReading = async (dept: DepartmentWithReading) => {
    if (!dept.meterReading) {
      setError('Por favor ingresa una lectura');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const payload = {
        meterReading: dept.meterReading,
        readingDate: readingDate,
        notes: ''
      };

      let savedReading;
      if (dept.reading) {
        await waterReadingsAPI.update(dept.reading.id, payload);
        savedReading = { ...dept.reading, ...payload };
      } else {
        const response = await waterReadingsAPI.create(dept.id, payload);
        savedReading = response.data;
      }

      setSuccess(`Lectura guardada para ${dept.code}`);

      setDepartments(departments.map(d =>
        d.id === dept.id
          ? { ...d, reading: savedReading, meterReading: dept.meterReading }
          : d
      ));
    } catch (err) {
      console.error('Error saving reading:', err);
      setError('Error al guardar lectura');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      setError('');

      const deptWithReadings = departments.filter(d => d.meterReading);
      const updatedDepts: DepartmentWithReading[] = [];

      for (const dept of deptWithReadings) {
        const payload = {
          meterReading: dept.meterReading,
          readingDate: readingDate,
          notes: ''
        };

        let savedReading;
        if (dept.reading) {
          await waterReadingsAPI.update(dept.reading.id, payload);
          savedReading = { ...dept.reading, ...payload };
        } else {
          const response = await waterReadingsAPI.create(dept.id, payload);
          savedReading = response.data;
        }

        updatedDepts.push({
          ...dept,
          reading: savedReading,
          meterReading: dept.meterReading
        });
      }

      setDepartments(departments.map(d => {
        const updated = updatedDepts.find(u => u.id === d.id);
        return updated || d;
      }));

      setSuccess('Todas las lecturas guardadas');
    } catch (err) {
      console.error('Error saving all readings:', err);
      setError('Error al guardar las lecturas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Ingresar Medición</h1>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Medición
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => {
                  setReadingDate(e.target.value);
                  setDepartments(departments.map(d => ({ ...d, meterReading: '' })));
                }}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={loadReadingsForDate}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
            >
              Cargar Lecturas
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {departments.map(dept => (
            <div
              key={dept.id}
              className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">{dept.code}</h3>
              {dept.ownerName && (
                <p className="text-sm text-gray-600 mb-4">{dept.ownerName}</p>
              )}

              {dept.reading && (
                <p className="text-xs text-green-600 mb-2">✓ Lectura registrada</p>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lectura (m³)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dept.meterReading}
                  onChange={(e) => handleMeterReadingChange(dept.id, e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                onClick={() => handleSaveReading(dept)}
                disabled={loading || !dept.meterReading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-semibold"
              >
                {dept.reading ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          ))}
        </div>

        {/* Save All Button */}
        {departments.some(d => d.meterReading) && (
          <div className="flex gap-4">
            <button
              onClick={handleSaveAll}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              Guardar Todas las Lecturas
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
