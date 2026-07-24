import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { waterReadingsAPI, departmentsAPI, receiptsAPI } from "../api/client";
import { Department, WaterReading } from "../types";
import { formatNumber } from "../utils/dateFormatter";
import { ReceiptCalculationTable } from "../components/ReceiptCalculationTable";
import { ReceiptConsumptionTable } from "../components/ReceiptConsumptionTable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HistoryProps {
  onLogout: () => void;
  layout?: boolean;
}

interface DepartmentHistory {
  department: Department;
  readings: WaterReading[];
}

type ViewMode = "table" | "chart" | "calculation" | "consumption";

export default function WaterReadingsHistory({
  onLogout,
  layout = true,
}: HistoryProps) {
  const [history, setHistory] = useState<DepartmentHistory[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set(),
  );
  const [filterExpanded, setFilterExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const response = await receiptsAPI.getAll();
      setReceipts(response.data || []);
    } catch (err) {
      console.error("Error loading receipts:", err);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const [deptResponse, readingsResponse] = await Promise.all([
        departmentsAPI.getAll(),
        waterReadingsAPI.getAll(),
      ]);

      const departments = deptResponse.data as Department[];
      const allReadings = readingsResponse.data as (WaterReading & {
        department: Department;
      })[];

      const sorted = [...departments].sort((a, b) => {
        const aIsGH = a.code.startsWith("GH");
        const bIsGH = b.code.startsWith("GH");

        if (aIsGH && !bIsGH) return -1;
        if (!aIsGH && bIsGH) return 1;

        return a.code.localeCompare(b.code);
      });

      const readingsByDeptId = new Map<string, WaterReading[]>();
      const datesSet = new Set<string>();

      allReadings.forEach((reading) => {
        const deptId = reading.department?.id || reading.departmentId;
        if (!readingsByDeptId.has(deptId)) {
          readingsByDeptId.set(deptId, []);
        }
        readingsByDeptId.get(deptId)!.push(reading);
        datesSet.add(reading.readingDate.split("T")[0]);
      });

      const historyData: DepartmentHistory[] = sorted.map((dept) => ({
        department: dept,
        readings: (readingsByDeptId.get(dept.id) || []).sort(
          (a, b) =>
            new Date(a.readingDate).getTime() -
            new Date(b.readingDate).getTime(),
        ),
      }));

      const sortedDates = Array.from(datesSet).sort();
      setUniqueDates(sortedDates);
      setHistory(historyData);
      setSelectedDepartments(new Set(historyData.map((h) => h.department.id)));
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Error al cargar el historial de lecturas");
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId: string) => {
    const newSelected = new Set(selectedDepartments);
    if (newSelected.has(deptId)) {
      newSelected.delete(deptId);
    } else {
      newSelected.add(deptId);
    }
    setSelectedDepartments(newSelected);
  };

  const toggleAllDepartments = () => {
    if (selectedDepartments.size === history.length) {
      setSelectedDepartments(new Set());
    } else {
      setSelectedDepartments(new Set(history.map((h) => h.department.id)));
    }
  };

  const getReadingForDate = (readings: WaterReading[], date: string) => {
    const reading = readings.find((r) => r.readingDate.split("T")[0] === date);
    return reading ? reading.meterReading.toString() : "-";
  };

  if (loading) {
    const loadingContent = (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando historial...</div>
      </div>
    );
    return layout ? (
      <Layout onLogout={onLogout}>{loadingContent}</Layout>
    ) : (
      loadingContent
    );
  }

  const filteredHistory = history.filter((h) =>
    selectedDepartments.has(h.department.id),
  );

  const chartData = uniqueDates.map((date) => {
    const dataPoint: Record<string, string | number | null> = { date };
    filteredHistory.forEach((item) => {
      const reading = item.readings.find(
        (r) => r.readingDate.split("T")[0] === date,
      );
      dataPoint[item.department.code] = reading
        ? Number(reading.meterReading)
        : null;
    });
    return dataPoint;
  });

  const content = (
    <div className="max-w-full mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-1xl sm:text-2xl font-bold text-gray-900 mb-6">
        Lectura de Agua
      </h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setViewMode("table")}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
            viewMode === "table"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Lecturas
        </button>
        <button
          onClick={() => setViewMode("calculation")}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
            viewMode === "calculation"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Cálculo
        </button>
        <button
          onClick={() => setViewMode("consumption")}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
            viewMode === "consumption"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Consumo
        </button>
        <button
          onClick={() => setViewMode("chart")}
          className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
            viewMode === "chart"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Gráfico
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No hay datos de lecturas disponibles</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-2.5 text-left font-bold text-gray-900 sticky left-0 bg-gray-50 border-r text-sm">
                  Departamento
                </th>
                {uniqueDates.map((date) => (
                  <th
                    key={date}
                    className="px-6 py-2.5 text-center font-bold text-gray-900 border-r whitespace-nowrap text-sm"
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
                  className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-yellow-50 transition-colors`}
                >
                  <td className="px-6 py-2 font-semibold text-gray-900 sticky left-0 bg-inherit border-r">
                    <div>
                      <p className="text-sm">{item.department.code}</p>
                      {item.department.ownerName && (
                        <p className="text-xs text-gray-600">
                          {item.department.ownerName}
                        </p>
                      )}
                    </div>
                  </td>
                  {uniqueDates.map((date) => (
                    <td
                      key={`${item.department.id}-${date}`}
                      className="px-6 py-2 text-center text-gray-700 border-r text-sm"
                    >
                      {getReadingForDate(item.readings, date)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === "chart" ? (
        <div className="space-y-6">
          {/* Department Filter - Solo en Gráfico */}
          {history.length > 0 && (
            <div>
              <button
                onClick={() => setFilterExpanded(!filterExpanded)}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className={`w-5 h-5 transition-transform ${filterExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  Filtrar Departamentos
                </span>
                <span className="text-xs bg-gray-900/10 px-2.5 py-1 rounded-full">
                  {selectedDepartments.size} de {history.length}
                </span>
              </button>

              {filterExpanded && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-b-lg p-4 border-x border-b border-yellow-200 border-t-0 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Selecciona departamentos:
                    </label>
                    <button
                      onClick={toggleAllDepartments}
                      className="text-xs px-3 py-1 bg-white border border-yellow-300 text-yellow-700 rounded hover:bg-yellow-50 transition-colors font-medium"
                    >
                      {selectedDepartments.size === history.length
                        ? "Deseleccionar Todo"
                        : "Seleccionar Todo"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-2">
                    {history.map((item) => (
                      <label
                        key={item.department.id}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepartments.has(item.department.id)}
                          onChange={() => toggleDepartment(item.department.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {item.department.code}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gráfico */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{
                    value: "Lectura (m³)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any) =>
                    value ? formatNumber(Number(value)) : "-"
                  }
                  labelFormatter={(label: any) => `Fecha: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {filteredHistory.map((item, idx) => {
                  const colors = [
                    "#3b82f6",
                    "#ef4444",
                    "#10b981",
                    "#f59e0b",
                    "#8b5cf6",
                    "#ec4899",
                    "#14b8a6",
                    "#f97316",
                    "#06b6d4",
                    "#84cc16",
                    "#eab308",
                  ];
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
        </div>
      ) : null}

      {viewMode === "calculation" && (
        <div>
          <h2 className="pb-3 px-1">Tabla de Cálculo por Departamento</h2>
          <ReceiptCalculationTable receipts={receipts} />
        </div>
      )}

      {viewMode === "consumption" && (
        <div>
          <h2 className="pb-3 px-1">Tabla de Consumo por Departamento</h2>
          <ReceiptConsumptionTable receipts={receipts} />
        </div>
      )}
    </div>
  );

  return layout ? <Layout onLogout={onLogout}>{content}</Layout> : content;
}
