import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { waterReadingsAPI, departmentsAPI } from '../api/client';
import { Department, WaterReading } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HistoryProps {
  onLogout: () => void;
}

interface DepartmentHistory {
  department: Department;
  readings: WaterReading[];
}

type ViewMode = 'table' | 'chart';

export default function WaterReadingsHistory({ onLogout }: HistoryProps) {
  const [history, setHistory] = useState<DepartmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const [deptResponse, readingsResponse] = await Promise.all([
        departmentsAPI.getAll(),
        waterReadingsAPI.getAll()
      ]);

      const departments = deptResponse.data as Department[];
      const allReadings = readingsResponse.data as (WaterReading & { department: Department })[];

      const sorted = [...departments].sort((a, b) => {
        const aIsGH = a.code.startsWith('GH');
        const bIsGH = b.code.startsWith('GH');

        if (aIsGH && !bIsGH) return -1;
        if (!aIsGH && bIsGH) return 1;

        return a.code.localeCompare(b.code);
      });

      const readingsByDeptId = new Map<string, WaterReading[]>();
      const datesSet = new Set<string>();

      allReadings.forEach(reading => {
        const deptId = reading.department?.id || reading.departmentId;
        if (!readingsByDeptId.has(deptId)) {
          readingsByDeptId.set(deptId, []);
        }
        readingsByDeptId.get(deptId)!.push(reading);
        datesSet.add(reading.readingDate.split('T')[0]);
      });

      const historyData: DepartmentHistory[] = sorted.map(dept => ({
        department: dept,
        readings: (readingsByDeptId.get(dept.id) || []).sort(
          (a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime()
        )
      }));

      const sortedDates = Array.from(datesSet).sort();
      setUniqueDates(sortedDates);
      setHistory(historyData);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Error al cargar el historial de lecturas');
    } finally {
      setLoading(false);
    }
  };

  const getReadingForDate = (readings: WaterReading[], date: string) => {
    const reading = readings.find(r => r.readingDate.split('T')[0] === date);
    return reading ? reading.meterReading.toString() : '-';
  };

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Cargando historial...</div>
        </div>
      </Layout>
    );
  }

  const chartData = uniqueDates.map(date => {
    const dataPoint: Record<string, string | number | null> = { date };
    history.forEach(item => {
      const reading = item.readings.find(r => r.readingDate.split('T')[0] === date);
      dataPoint[item.department.code] = reading ? Number(reading.meterReading) : null;
    });
    return dataPoint;
  });

  return (
    <Layout onLogout={onLogout}>
      <div className="max-w-full mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Lectura de Agua</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setViewMode('table')}
            className={`px-6 py-3 font-semibold transition-colors ${
              viewMode === 'table'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-6 py-3 font-semibold transition-colors ${
              viewMode === 'chart'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gráfico
          </button>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No hay datos de lecturas disponibles</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left font-bold text-gray-900 sticky left-0 bg-gray-50 border-r">
                    Departamento
                  </th>
                  {uniqueDates.map(date => (
                    <th
                      key={date}
                      className="px-6 py-4 text-center font-bold text-gray-900 border-r whitespace-nowrap"
                    >
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr
                    key={item.department.id}
                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 transition-colors`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 sticky left-0 bg-inherit border-r">
                      <div>
                        <p>{item.department.code}</p>
                        {item.department.ownerName && (
                          <p className="text-xs text-gray-600">{item.department.ownerName}</p>
                        )}
                      </div>
                    </td>
                    {uniqueDates.map(date => (
                      <td
                        key={`${item.department.id}-${date}`}
                        className="px-6 py-4 text-center text-gray-700 border-r"
                      >
                        {getReadingForDate(item.readings, date)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis label={{ value: 'Lectura (m³)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number | null) => value ? value.toFixed(2) : '-'}
                  labelFormatter={(label: string) => `Fecha: ${label}`}
                />
                <Legend />
                {history.map((item, idx) => {
                  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#eab308'];
                  return (
                    <Line
                      key={item.department.id}
                      type="monotone"
                      dataKey={item.department.code}
                      stroke={colors[idx % colors.length]}
                      connectNulls
                      dot={false}
                      strokeWidth={2}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
}
