import jsPDF from 'jspdf';
import { Department, WaterReading } from '../types';
import { calculateReceipt } from './pdfGenerator';
import { formatCurrency, formatDate, formatNumber } from './dateFormatter';

export interface GeneralReportReceipt {
  id: string;
  totalCharge: number;
  consumedM3: number;
  pricePerM3: number;
  periodStart: string;
  periodEnd: string;
  paymentDeadline: string;
}

export interface DepartmentWithReadings extends Department {
  waterReadings: WaterReading[];
}

export interface GeneralConsumptionRow {
  department: DepartmentWithReadings;
  initialReading: number;
  finalReading: number;
  consumption: number;
  amount: number;
  hasEstimation: boolean;
}

export interface GeneralConsumptionReport {
  receipt: GeneralReportReceipt;
  rows: GeneralConsumptionRow[];
  commonAreasConsumption: number;
  commonAreasAmount: number;
  departmentConsumption: number;
  departmentAmount: number;
}

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function calculateGeneralConsumptionReport(
  receipt: GeneralReportReceipt,
  departments: DepartmentWithReadings[],
): GeneralConsumptionReport {
  const startDate = receipt.periodStart.split('T')[0];
  const endDate = receipt.periodEnd.split('T')[0];
  const pricePerM3 = toNumber(receipt.pricePerM3);

  const rows = departments.map((department) => {
    const readings = [...(department.waterReadings || [])].sort(
      (a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime(),
    );
    const calculation = calculateReceipt(readings, startDate, endDate, pricePerM3);

    return {
      department,
      initialReading: calculation.initialReading,
      finalReading: calculation.finalReading,
      consumption: calculation.consumption,
      amount: calculation.totalPrice,
      hasEstimation: calculation.hasEstimation,
    };
  });

  const departmentConsumption = rows.reduce((sum, row) => sum + row.consumption, 0);
  const departmentAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  return {
    receipt,
    rows,
    departmentConsumption,
    departmentAmount,
    commonAreasConsumption: toNumber(receipt.consumedM3) - departmentConsumption,
    commonAreasAmount: toNumber(receipt.totalCharge) - departmentAmount,
  };
}

const textValue = (value: number): string => formatNumber(value);
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDepartmentLabel = (department: DepartmentWithReadings): string => {
  const code = department.code.trim();
  const name = (department.name || '').trim();
  const nameWithoutCode = name
    .replace(new RegExp(`\\b${escapeRegExp(code)}\\b`, 'gi'), '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–—:]\s*/g, ' ')
    .trim();

  if (!nameWithoutCode || /^(departamento|depto\.?)$/i.test(nameWithoutCode)) {
    return code;
  }

  return `${code} - ${nameWithoutCode}`;
};

const loadLogoDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch('/img/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('No se pudo cargar el logo'));
        element.src = objectUrl;
      });
      const size = Math.max(image.naturalWidth, image.naturalHeight, 1);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return null;

      const radius = size * 0.15;
      context.beginPath();
      context.moveTo(radius, 0);
      context.lineTo(size - radius, 0);
      context.quadraticCurveTo(size, 0, size, radius);
      context.lineTo(size, size - radius);
      context.quadraticCurveTo(size, size, size - radius, size);
      context.lineTo(radius, size);
      context.quadraticCurveTo(0, size, 0, size - radius);
      context.lineTo(0, radius);
      context.quadraticCurveTo(0, 0, radius, 0);
      context.closePath();
      context.clip();
      context.drawImage(image, 0, 0, size, size);

      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
};

export async function generateGeneralConsumptionReportPDF(
  report: GeneralConsumptionReport,
): Promise<Blob> {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF();
  const { receipt, rows } = report;
  const totalCharge = toNumber(receipt.totalCharge);
  const consumedM3 = toNumber(receipt.consumedM3);
  const pricePerM3 = toNumber(receipt.pricePerM3);
  const pageWidth = 210;
  const left = 20;
  const right = 190;

  doc.setProperties({
    title: `Reporte general de consumo ${formatDate(receipt.periodStart)} - ${formatDate(receipt.periodEnd)}`,
    subject: 'Consumo de agua por departamento',
    author: 'Palma Irolo - Irolo 64',
  });

  // Cabecera editorial: marca, tipo de reporte y periodo claramente separados.
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 20, 12, 18, 18);
  } else {
    doc.setFillColor(31, 41, 55);
    doc.roundedRect(20, 12, 18, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(250, 204, 21);
    doc.text('64', 29, 23, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text('Palma Irolo', 43, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('ADMINISTRACIÓN · IROLO 64', 43, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('REPORTE DE AGUA', right, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('INFORME GENERAL', right, 24, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('INFORME DEL PERÍODO', pageWidth / 2, 42, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(31, 41, 55);
  doc.text('REPORTE GENERAL DE CONSUMO', pageWidth / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(left, 58, 170, 29, 2, 2, 'FD');
  doc.setFillColor(250, 204, 21);
  doc.rect(left, 58, 3, 29, 'F');
  doc.text(`Período: ${formatDate(receipt.periodStart)} al ${formatDate(receipt.periodEnd)}`, 25, 64);
  doc.text(`Fecha límite de pago: ${formatDate(receipt.paymentDeadline)}`, 25, 72);
  doc.text(`Cargo total: ${formatCurrency(totalCharge)}`, 115, 64);
  doc.text(`Consumo total: ${textValue(consumedM3)} m³`, 115, 72);
  doc.text(`Precio por m³: ${formatCurrency(pricePerM3)}`, 115, 80);

  let y = 99;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.setFillColor(250, 204, 21);
  doc.roundedRect(left, y - 5, 2.5, 8, 1, 1, 'F');
  doc.setFontSize(10.5);
  doc.text('Detalle por departamento', left + 7, y);
  y += 7;

  const columns = { department: 20, initial: 96, final: 124, consumption: 156, amount: 181 };
  const centered = { align: 'center' as const };
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.rect(left, y - 5, 170, 8, 'FD');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.8);
  doc.line(left, y + 3, right, y + 3);
  doc.setFontSize(7.2);
  doc.setTextColor(55, 65, 81);
  doc.text('Departamento', columns.department + 3, y);
  doc.text('Lectura inicial (m³)', columns.initial, y, centered);
  doc.text('Lectura final (m³)', columns.final, y, centered);
  doc.text('Consumo (m³)', columns.consumption, y, centered);
  doc.text('Monto', columns.amount, y, centered);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  rows.forEach((row, index) => {
    const person = row.department.ownerName
      ? ` / ${row.department.ownerName}`
      : '';
    const departmentText = `${getDepartmentLabel(row.department)}${person}`;
    const departmentLines = doc.splitTextToSize(departmentText, 58);
    const rowHeight = Math.max(10, departmentLines.length * 4.3 + 3);

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(left, y - 5, 170, rowHeight, 'F');
    }
    doc.setTextColor(31, 41, 55);
    doc.text(departmentLines, columns.department + 3, y);
    const valueY = y + (departmentLines.length > 1 ? 2 : 0);
    doc.text(textValue(row.initialReading), columns.initial, valueY, centered);
    doc.text(textValue(row.finalReading), columns.final, valueY, centered);
    doc.text(textValue(row.consumption), columns.consumption, valueY, centered);
    doc.text(formatCurrency(row.amount), columns.amount, valueY, centered);
    y += rowHeight;
  });

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(left, y - 5, 170, 10, 2, 2, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.line(left, y - 4, right, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Total departamentos', columns.department + 3, y + 3);
  doc.text(textValue(report.departmentConsumption), columns.consumption, y + 3, centered);
  doc.text(formatCurrency(report.departmentAmount), columns.amount, y + 3, centered);
  y += 13;
  doc.setFillColor(249, 250, 251);
  doc.rect(left, y - 5, 170, 10, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(1.2);
  doc.line(left, y - 5, left, y + 5);
  doc.setTextColor(75, 85, 99);
  doc.text('Áreas comunes', columns.department + 3, y + 1);
  doc.text(textValue(report.commonAreasConsumption), columns.consumption, y + 1, centered);
  doc.text(formatCurrency(report.commonAreasAmount), columns.amount, y + 1, centered);
  y += 13;
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(left, y - 5, 170, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('Total del recibo', columns.department + 3, y + 1);
  doc.text(textValue(consumedM3), columns.consumption, y + 1, centered);
  doc.setTextColor(250, 204, 21);
  doc.text(formatCurrency(totalCharge), columns.amount, y + 1, centered);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'El consumo corresponde a la diferencia entre la lectura inicial y la lectura final del período.',
    pageWidth / 2,
    278,
    { align: 'center' },
  );

  doc.addPage();
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 20, 10, 12, 12);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('IROLO 64', 36, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('ANÁLISIS DEL PERÍODO', 36, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('REPORTE DE AGUA', right, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(`${formatDate(receipt.periodStart)} al ${formatDate(receipt.periodEnd)}`, right, 22, {
    align: 'right',
  });
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.6);
  doc.line(left, 29, right, 29);

  const graphRows = rows.map((row) => ({
    code: row.department.code,
    initial: row.initialReading,
    final: row.finalReading,
    consumption: row.consumption,
  }));
  const readingValues = graphRows.flatMap((row) => [row.initial, row.final]);
  const maxReading = Math.max(...readingValues, 1);
  const graphLeft = 56;
  const graphRight = 151;
  const graphWidth = graphRight - graphLeft;
  const labelX = 21;
  const valueX = 157;
  const lineColor: [number, number, number] = [146, 100, 15];

  const drawGraphGrid = (top: number, bottom: number) => {
    doc.setDrawColor(107, 114, 128);
    doc.setLineWidth(0.45);
    doc.line(graphLeft, top, graphLeft, bottom);
    doc.line(graphLeft, bottom, graphRight, bottom);
    for (let index = 0; index <= 4; index += 1) {
      const value = (maxReading * index) / 4;
      const x = graphLeft + (graphWidth * index) / 4;
      doc.setDrawColor(229, 231, 235);
      doc.line(x, top, x, bottom);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(107, 114, 128);
      doc.text(formatNumber(value), x, bottom + 5, { align: 'center' });
    }
  };

  // Tarjetas visuales para separar las dos lecturas del reporte.
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.45);
  doc.roundedRect(18, 31, 174, 100, 3, 3, 'FD');
  doc.roundedRect(18, 136, 174, 101, 3, 3, 'FD');

  // Gráfica 1: dos barras por departamento, con los valores explícitos.
  const groupedTop = 44;
  const groupedRowHeight = 7.3;
  const groupedBottom = groupedTop + graphRows.length * groupedRowHeight;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  doc.text('01 - Lectura inicial y lectura final (m3)', left, 34);
  doc.setFillColor(156, 163, 175);
  doc.circle(left + 3, 38, 1.3, 'F');
  doc.setFillColor(161, 98, 7);
  doc.circle(left + 45, 38, 1.3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(55, 65, 81);
  doc.text('Inicial', left + 8, 39);
  doc.text('Final', left + 50, 39);
  drawGraphGrid(groupedTop - 2, groupedBottom);

  graphRows.forEach((row, index) => {
    const rowY = groupedTop + index * groupedRowHeight;
    const initialWidth = (row.initial / maxReading) * graphWidth;
    const finalWidth = (row.final / maxReading) * graphWidth;
    doc.setFontSize(6.8);
    doc.setTextColor(31, 41, 55);
    doc.text(row.code, labelX, rowY + 4);
    doc.setFillColor(156, 163, 175);
    doc.rect(graphLeft, rowY, initialWidth, 2.4, 'F');
    doc.setFillColor(161, 98, 7);
    doc.rect(graphLeft, rowY + 3, finalWidth, 2.4, 'F');
    doc.setFontSize(6.2);
    doc.setTextColor(55, 65, 81);
    doc.text(`${formatNumber(row.initial)} | ${formatNumber(row.final)}`, valueX, rowY + 4.2);
  });

  // Gráfica 2: dumbbell; la distancia entre los puntos representa el gasto.
  const dumbbellTop = 153;
  const dumbbellRowHeight = 7.3;
  const dumbbellBottom = dumbbellTop + graphRows.length * dumbbellRowHeight;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  doc.text('02 - Diferencia visual entre inicio y fin (m3)', left, 143);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(55, 65, 81);
  doc.text('La distancia entre los puntos muestra lo consumido.', left, 148);
  doc.setFontSize(6.4);
  doc.setFillColor(156, 163, 175);
  doc.circle(127, 146, 1.5, 'F');
  doc.setTextColor(55, 65, 81);
  doc.text('Inicial', 131, 148);
  doc.setFillColor(161, 98, 7);
  doc.circle(162, 146, 1.5, 'F');
  doc.text('Final', 166, 148);
  drawGraphGrid(dumbbellTop - 2, dumbbellBottom);

  graphRows.forEach((row, index) => {
    const rowY = dumbbellTop + index * dumbbellRowHeight + 3.5;
    const initialX = graphLeft + (row.initial / maxReading) * graphWidth;
    const finalX = graphLeft + (row.final / maxReading) * graphWidth;
    const color = lineColor;
    doc.setFontSize(6.8);
    doc.setTextColor(31, 41, 55);
    doc.text(row.code, labelX, rowY + 2);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(1.2);
    doc.line(initialX, rowY, finalX, rowY);
    doc.setFillColor(156, 163, 175);
    doc.circle(initialX, rowY, 1.9, 'F');
    doc.setFillColor(161, 98, 7);
    doc.circle(finalX, rowY, 1.9, 'F');
    doc.setFontSize(6.2);
    doc.setTextColor(55, 65, 81);
    doc.text(`${formatNumber(row.consumption)} m3`, valueX, rowY + 2);
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Los códigos corresponden a los nombres completos mostrados en la tabla del reporte.', pageWidth / 2, 291, {
    align: 'center',
  });
  doc.text(`Generado el ${formatDate(new Date())}`, pageWidth / 2, 296, { align: 'center' });

  return doc.output('blob');
}
