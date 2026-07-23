import jsPDF from 'jspdf';
import { Department, WaterReading } from '../types';
import { formatDate, formatNumber, formatCurrency } from './dateFormatter';

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

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const extractDate = (dateTimeString: string): string => {
  return dateTimeString.split('T')[0];
};

export function calculateReceipt(
  readings: WaterReading[],
  startDate: string,
  endDate: string,
  pricePerM3: number
): ReceiptCalculation {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let initialReading = 0;
  let finalReading = 0;
  let hasEstimation = false;

  // Buscar mediciones exactas en las fechas
  const exactStartReading = readings.find(
    (r) => extractDate(r.readingDate) === startDate
  );
  const exactEndReading = readings.find(
    (r) => extractDate(r.readingDate) === endDate
  );

  // Si hay medición exacta en la fecha de inicio
  if (exactStartReading) {
    initialReading = parseFloat(String(exactStartReading.meterReading));
  } else {
    // Buscar última lectura anterior a la fecha de inicio
    const readingsBefore = readings.filter(
      (r) => extractDate(r.readingDate) < startDate
    );

    if (readingsBefore.length > 0) {
      const lastReadingBefore = readingsBefore[readingsBefore.length - 1];

      // Buscar una lectura posterior para calcular la tasa diaria
      const readingsAfter = readings.filter(
        (r) => extractDate(r.readingDate) > extractDate(lastReadingBefore.readingDate)
      );

      if (readingsAfter.length > 0) {
        const nextReading = readingsAfter[0];
        const daysInPeriod = Math.ceil(
          (parseDate(extractDate(nextReading.readingDate)).getTime() -
            parseDate(extractDate(lastReadingBefore.readingDate)).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        if (daysInPeriod > 0) {
          const dailyConsumption =
            (parseFloat(String(nextReading.meterReading)) -
              parseFloat(String(lastReadingBefore.meterReading))) /
            daysInPeriod;

          const daysSinceLastReading = Math.ceil(
            (start.getTime() -
              parseDate(extractDate(lastReadingBefore.readingDate)).getTime()) /
            (1000 * 60 * 60 * 24)
          );

          initialReading =
            parseFloat(String(lastReadingBefore.meterReading)) +
            dailyConsumption * daysSinceLastReading;
          hasEstimation = true;
        }
      } else {
        initialReading = parseFloat(String(lastReadingBefore.meterReading));
      }
    }
  }

  // Si hay medición exacta en la fecha de fin
  if (exactEndReading) {
    finalReading = parseFloat(String(exactEndReading.meterReading));
  } else {
    // Buscar primera lectura posterior a la fecha de fin
    const readingsAfter = readings.filter(
      (r) => extractDate(r.readingDate) > endDate
    );

    if (readingsAfter.length > 0) {
      const firstReadingAfter = readingsAfter[0];

      // Buscar última lectura anterior para calcular la tasa
      const readingsBefore = readings.filter(
        (r) => extractDate(r.readingDate) < extractDate(firstReadingAfter.readingDate)
      );

      if (readingsBefore.length > 0) {
        const lastReadingBefore = readingsBefore[readingsBefore.length - 1];
        const daysInPeriod = Math.ceil(
          (parseDate(extractDate(firstReadingAfter.readingDate)).getTime() -
            parseDate(extractDate(lastReadingBefore.readingDate)).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        if (daysInPeriod > 0) {
          const dailyConsumption =
            (parseFloat(String(firstReadingAfter.meterReading)) -
              parseFloat(String(lastReadingBefore.meterReading))) /
            daysInPeriod;

          const daysUntilEnd = Math.ceil(
            (end.getTime() -
              parseDate(extractDate(firstReadingAfter.readingDate)).getTime()) /
            (1000 * 60 * 60 * 24)
          );

          finalReading =
            parseFloat(String(firstReadingAfter.meterReading)) -
            dailyConsumption * daysUntilEnd;
          hasEstimation = true;
        }
      }
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
  const receipt = calculateReceipt(readings, startDate, endDate, pricePerM3);

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
  doc.text(formatNumber(receipt.initialReading), 140, yPos);

  yPos += 6;
  doc.text('Lectura Final', 25, yPos);
  doc.text(formatNumber(receipt.finalReading), 140, yPos);

  yPos += 6;
  doc.setTextColor(75, 85, 99);
  doc.line(20, yPos - 2, 190, yPos - 2);

  yPos += 4;
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  (doc as any).setFont(undefined, 'bold');
  doc.text('Consumo Total', 25, yPos);
  doc.text(formatNumber(receipt.consumption), 140, yPos);
  (doc as any).setFont(undefined, 'normal');

  // Estimación
  if (receipt.hasEstimation) {
    yPos += 8;
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38); // red-600
    (doc as any).setFont(undefined, 'bold');
    doc.text('⚠ Consumo estimado (lecturas no exactas)', 20, yPos);
    (doc as any).setFont(undefined, 'normal');
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
  doc.text(formatCurrency(pricePerM3), 140, yPos);

  yPos += 6;
  doc.text(`Consumo ${formatNumber(receipt.consumption)} m³`, 25, yPos);
  doc.text(formatCurrency(receipt.totalPrice), 140, yPos);

  // Total
  yPos += 8;
  doc.setTextColor(75, 85, 99);
  doc.line(20, yPos - 2, 190, yPos - 2);

  yPos += 4;
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  (doc as any).setFont(undefined, 'bold');
  doc.text('TOTAL A PAGAR', 25, yPos);
  doc.text(formatCurrency(receipt.totalPrice), 140, yPos);
  (doc as any).setFont(undefined, 'normal');

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
