import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import client from '../api/client';
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
      const response = await client.get('/departments');
      const depts = response.data as Department[];
      setDepartments(depts.map(d => ({ ...d, meterReading: '' })));
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

      const updatedDepts = await Promise.all(
        departments.map(async (dept) => {
          try {
            const response = await client.get(`/departments/${dept.id}/water-readings`);
            const readings = response.data as WaterReading[];
            const reading = readings.find(
              r => r.readingDate.split('T')[0] === readingDate
            );

            return {
              ...dept,
              reading,
              meterReading: reading?.meterReading.toString() || ''
            };
          } catch {
            return { ...dept, meterReading: '' };
          }
        })
      );

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
      const meterReading = parseFloat(dept.meterReading);

      if (dept.reading) {
        await client.patch(`/water-readings/${dept.reading.id}`, {
          meterReading,
          readingDate,
          notes: ''
        });
      } else {
        await client.post(`/departments/${dept.id}/water-readings`, {
          meterReading,
          readingDate,
          notes: ''
        });
      }

      setSuccess(`Lectura guardada para ${dept.code}`);
      loadReadingsForDate();
    } catch (err) {
      console.error('Error saving reading:', err);
      setError('Error al guardar lectura');
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      setError('');

      await Promise.all(
        departments
          .filter(d => d.meterReading)
          .map(d => handleSaveReading(d))
      );

      setSuccess('Todas las lecturas guardadas');
      loadReadingsForDate();
    } catch (err) {
      console.error('Error saving all readings:', err);
      setError('Error al guardar las lecturas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Ingresar Medición</h1>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 items-end">
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
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={loadReadingsForDate}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
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
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              Guardar Todas las Lecturas
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
