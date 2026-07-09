import { WaterReading } from '../types';

export interface ReadingsData {
  readings: WaterReading[];
}

/**
 * Estima el consumo total de m³ para un período basándose en las lecturas disponibles
 * Algoritmo:
 * 1. Busca lecturas exactas en las fechas de inicio y fin
 * 2. Si no hay exactas, busca las más cercanas y estima proporcionalmente
 * 3. Suma el consumo de todos los departamentos
 */
export function estimateConsumption(
  readings: WaterReading[],
  startDate: string,
  endDate: string
): number {
  if (readings.length === 0) return 0;

  // Convertir fechas a objetos Date (como fecha local, no UTC)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  // Agrupar lecturas por departamento
  const readingsByDept = new Map<string, WaterReading[]>();
  readings.forEach((reading) => {
    const deptId = reading.departmentId;
    if (!readingsByDept.has(deptId)) {
      readingsByDept.set(deptId, []);
    }
    readingsByDept.get(deptId)!.push(reading);
  });

  let totalConsumption = 0;

  // Calcular consumo por departamento
  readingsByDept.forEach((deptReadings) => {
    const sortedReadings = [...deptReadings].sort(
      (a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime()
    );

    // Encontrar lecturas relevantes
    const readingsBeforeStart = sortedReadings.filter(
      (r) => new Date(r.readingDate) <= start
    );
    const readingsBeforeEnd = sortedReadings.filter(
      (r) => new Date(r.readingDate) <= end
    );
    const readingsAfterEnd = sortedReadings.filter(
      (r) => new Date(r.readingDate) > end
    );

    let initialReading = 0;
    let finalReading = 0;

    // Buscar lectura inicial
    if (readingsBeforeStart.length > 0) {
      const lastBefore = readingsBeforeStart[readingsBeforeStart.length - 1];
      const lastBeforeDate = new Date(lastBefore.readingDate);

      if (lastBeforeDate.getTime() === start.getTime()) {
        // Fecha exacta
        initialReading = Number(lastBefore.meterReading);
      } else {
        // Interpolar: si hay una lectura después del inicio, interpolar entre antes y después
        const firstAfterStart = sortedReadings.find(
          (r) => new Date(r.readingDate) > start
        );

        if (firstAfterStart) {
          const before = lastBefore;
          const after = firstAfterStart;
          const beforeDate = new Date(before.readingDate);
          const afterDate = new Date(after.readingDate);

          const daysDiff = Math.max(
            1,
            (afterDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysToStart = (start.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24);

          const readingDiff = Number(after.meterReading) - Number(before.meterReading);
          const estimatedDailyConsumption = readingDiff / daysDiff;

          initialReading = Number(before.meterReading) + estimatedDailyConsumption * daysToStart;
        } else {
          initialReading = Number(lastBefore.meterReading);
        }
      }
    }

    // Buscar lectura final
    if (readingsBeforeEnd.length > 0) {
      const lastBeforeEnd = readingsBeforeEnd[readingsBeforeEnd.length - 1];
      const lastBeforeEndDate = new Date(lastBeforeEnd.readingDate);

      if (lastBeforeEndDate.getTime() === end.getTime()) {
        // Fecha exacta
        finalReading = Number(lastBeforeEnd.meterReading);
      } else if (readingsAfterEnd.length > 0) {
        // Interpolar: entre la última lectura antes del fin y la primera después
        const firstAfter = readingsAfterEnd[0];
        const beforeDate = new Date(lastBeforeEnd.readingDate);
        const afterDate = new Date(firstAfter.readingDate);

        const daysDiff = Math.max(
          1,
          (afterDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysToEnd = (end.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24);

        const readingDiff = Number(firstAfter.meterReading) - Number(lastBeforeEnd.meterReading);
        const estimatedDailyConsumption = readingDiff / daysDiff;

        finalReading = Number(lastBeforeEnd.meterReading) + estimatedDailyConsumption * daysToEnd;
      } else {
        finalReading = Number(lastBeforeEnd.meterReading);
      }
    }

    const consumption = Math.max(0, finalReading - initialReading);
    totalConsumption += consumption;
  });

  return Math.round(totalConsumption * 100) / 100;
}

/**
 * Estima el consumo para un período específico con mejor precisión
 * Usa proporcionalidad si no hay datos exactos
 */
export function estimateConsumptionAdvanced(
  readings: WaterReading[],
  startDate: string,
  endDate: string
): { estimated: number; confidence: number; hasExactData: boolean } {
  if (readings.length === 0) {
    return { estimated: 0, confidence: 0, hasExactData: false };
  }

  const estimated = estimateConsumption(readings, startDate, endDate);

  // Convertir fechas
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  // Verificar si hay datos exactos
  const hasExactStart = readings.some(
    (r) => new Date(r.readingDate).getTime() === start.getTime()
  );
  const hasExactEnd = readings.some(
    (r) => new Date(r.readingDate).getTime() === end.getTime()
  );
  const hasExactData = hasExactStart && hasExactEnd;

  // Calcular confianza (0-100%)
  let confidence = 50;
  if (hasExactStart) confidence += 25;
  if (hasExactEnd) confidence += 25;

  return { estimated, confidence, hasExactData };
}
