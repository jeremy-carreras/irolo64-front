import jsPDF from 'jspdf';
import { Department, WaterReading } from '../types';
import { formatDate } from './dateFormatter';

export interface ReceiptData {
  department: Department;
  readings: WaterReading[];
  startDate: string;
  endDate: string;
  pricePerM3: number;
}

export interface ReceiptCalculation {
  initialReading: number;
  finalReading: number;
  consumption: number;
  totalPrice: number;
  hasEstimation: boolean;
  totalDays: number;
  period: string;
}

export function calculateReceipt(
  department: Department,
  readings: WaterReading[],
  startDate: string,
  endDate: string,
  pricePerM3: number
): ReceiptCalculation {
  // Parsear fechas (como fecha local, no UTC)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Encontrar lecturas más cercanas
  const readingsBefore = readings.filter(
    (r) => new Date(r.readingDate) <= start
  );
  const readingsWithin = readings.filter(
    (r) => new Date(r.readingDate) > start && new Date(r.readingDate) <= end
  );
  const readingsAfter = readings.filter(
    (r) => new Date(r.readingDate) > end
  );

  const lastReadingBefore = readingsBefore.length > 0
    ? readingsBefore[readingsBefore.length - 1]
    : null;

  const lastReadingWithin = readingsWithin.length > 0
    ? readingsWithin[readingsWithin.length - 1]
    : null;

  const firstReadingAfter = readingsAfter.length > 0
    ? readingsAfter[0]
    : null;

  // Calcular consumo con estimación
  let initialReading = 0;
  let finalReading = 0;
  let hasEstimation = false;

  // Lectura inicial
  if (lastReadingBefore) {
    const daysSinceLast = Math.ceil(
      (start.getTime() - new Date(lastReadingBefore.readingDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    // Buscar una lectura después de la inicial para calcular tasa
    const nextReading = lastReadingWithin || firstReadingAfter;

    if (daysSinceLast > 0 && nextReading) {
      const daysBetweenReadings = Math.ceil(
        (new Date(nextReading.readingDate).getTime() -
        new Date(lastReadingBefore.readingDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const dailyConsumption =
        (parseFloat(String(nextReading.meterReading)) -
        parseFloat(String(lastReadingBefore.meterReading))) /
        daysBetweenReadings;

      initialReading = parseFloat(String(lastReadingBefore.meterReading)) +
        (dailyConsumption * daysSinceLast);
      hasEstimation = true;
    } else {
      initialReading = parseFloat(String(lastReadingBefore.meterReading));
    }
  }

  // Lectura final
  if (lastReadingWithin) {
    finalReading = parseFloat(String(lastReadingWithin.meterReading));
  } else if (firstReadingAfter) {
    const daysUntilEnd = Math.ceil(
      (end.getTime() - new Date(firstReadingAfter.readingDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    if (daysUntilEnd > 0 && lastReadingBefore) {
      const daysBetweenReadings = Math.ceil(
        (new Date(firstReadingAfter.readingDate).getTime() -
        new Date(lastReadingBefore.readingDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const dailyConsumption =
        (parseFloat(String(firstReadingAfter.meterReading)) -
        parseFloat(String(lastReadingBefore.meterReading))) /
        daysBetweenReadings;

      finalReading = parseFloat(String(firstReadingAfter.meterReading)) -
        (dailyConsumption * daysUntilEnd);
      hasEstimation = true;
    }
  }

  const consumption = Math.max(0, finalReading - initialReading);
  const totalPrice = consumption * pricePerM3;

  return {
    initialReading,
    finalReading,
    consumption,
    totalPrice,
    hasEstimation,
    totalDays,
    period: `${formatDate(start)} al ${formatDate(end)}`
  };
}

export async function generateReceiptPDF(data: ReceiptData) {
  const { department, readings, startDate, endDate, pricePerM3 } = data;
  const receipt = calculateReceipt(department, readings, startDate, endDate, pricePerM3);

  // Parsear fechas para el PDF (como fecha local, no UTC)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  // Crear PDF
  const doc = new jsPDF();
  let yPos = 20;

  // Membrete
  doc.setFontSize(24);
  doc.setTextColor(31, 41, 55); // gray-900
  doc.text('Palma Irolo', 105, yPos, { align: 'center' });

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('Irolo 64 - Sistema de Administración', 105, yPos, { align: 'center' });

  // Línea separadora
  yPos += 12;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);

  // Título
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text('RECIBO DE AGUA', 105, yPos, { align: 'center' });

  // Info del departamento
  yPos += 15;
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text(`Departamento: ${department.code}`, 20, yPos);
  yPos += 6;
  if (department.ownerName) {
    doc.text(`Propietario: ${department.ownerName}`, 20, yPos);
    yPos += 6;
  }

  // Período
  yPos += 2;
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Período: ${receipt.period}`, 20, yPos);
  yPos += 6;
  doc.text(`Días en período: ${receipt.totalDays}`, 20, yPos);

  // Tabla de consumo
  yPos += 12;
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Detalle de Consumo', 20, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(20, yPos - 5, 170, 6, 'F');

  doc.setTextColor(75, 85, 99);
  doc.text('Concepto', 25, yPos);
  doc.text('Valor (m³)', 140, yPos);

  yPos += 7;
  doc.setTextColor(31, 41, 55);
  doc.text('Lectura Inicial', 25, yPos);
  doc.text(receipt.initialReading.toFixed(2), 140, yPos);

  yPos += 6;
  doc.text('Lectura Final', 25, yPos);
  doc.text(receipt.finalReading.toFixed(2), 140, yPos);

  yPos += 6;
  doc.setTextColor(75, 85, 99);
  doc.line(20, yPos - 2, 190, yPos - 2);

  yPos += 4;
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.setFont(undefined, 'bold');
  doc.text('Consumo Total', 25, yPos);
  doc.text(receipt.consumption.toFixed(2), 140, yPos);
  doc.setFont(undefined, 'normal');

  // Estimación
  if (receipt.hasEstimation) {
    yPos += 8;
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38); // red-600
    doc.setFont(undefined, 'bold');
    doc.text('⚠ Consumo estimado (lecturas no exactas)', 20, yPos);
    doc.setFont(undefined, 'normal');
  }

  // Cálculo de precio
  yPos += 12;
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Cálculo de Tarifa', 20, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFillColor(243, 244, 246);
  doc.rect(20, yPos - 5, 170, 6, 'F');

  doc.setTextColor(75, 85, 99);
  doc.text('Concepto', 25, yPos);
  doc.text('Valor', 140, yPos);

  yPos += 7;
  doc.setTextColor(31, 41, 55);
  doc.text(`Precio por m³`, 25, yPos);
  doc.text(`$${pricePerM3.toFixed(2)}`, 140, yPos);

  yPos += 6;
  doc.text(`Consumo ${receipt.consumption.toFixed(2)} m³`, 25, yPos);
  doc.text(`$${receipt.totalPrice.toFixed(2)}`, 140, yPos);

  // Total
  yPos += 8;
  doc.setTextColor(75, 85, 99);
  doc.line(20, yPos - 2, 190, yPos - 2);

  yPos += 4;
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL A PAGAR', 25, yPos);
  doc.text(`$${receipt.totalPrice.toFixed(2)}`, 140, yPos);
  doc.setFont(undefined, 'normal');

  // Pie de página
  yPos = 260;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // gray-500
  const now = new Date();
  doc.text(`Generado el ${formatDate(now)} a las ${now.toLocaleTimeString('es-ES')}`, 105, yPos, { align: 'center' });

  // Descargar
  const fileName = `recibo_${department.code}_${startDate}_${endDate}.pdf`;
  doc.save(fileName);
}
