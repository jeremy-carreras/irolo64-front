import { useState, useEffect } from 'react';
import { departmentsAPI } from '../api/client';
import { calculateReceipt } from '../utils/pdfGenerator';
import { formatNumber } from '../utils/dateFormatter';
import { Loader, AlertCircle } from 'lucide-react';
import { WaterReading } from '../types';

interface Receipt {
  id: string;
  totalCharge: number;
  consumedM3: number;
  pricePerM3: number;
  periodStart: string;
  periodEnd: string;
}

interface ReceiptConsumptionTableProps {
  receipts: Receipt[];
}

interface Department {
  id: string;
  code: string;
  waterReadings: WaterReading[];
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export function ReceiptConsumptionTable({ receipts }: ReceiptConsumptionTableProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await departmentsAPI.getAllWithReadings();
      const depts = response.data || [];
      setDepartments(depts);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar departamentos: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const calculateDepartmentConsumption = (dept: Department, receipt: Receipt): number => {
    const readings = dept.waterReadings || [];
    if (readings.length === 0) return 0;

    try {
      const startDate = receipt.periodStart.split('T')[0];
      const endDate = receipt.periodEnd.split('T')[0];
      const pricePerM3 = receipt.pricePerM3;

      const calculatedReceipt = calculateReceipt(readings, startDate, endDate, pricePerM3);
      return calculatedReceipt.consumption;
    } catch (err) {
      console.error(`Error calculating consumption for ${dept.code}:`, err);
      return 0;
    }
  };

  const calculateConsumptionTotal = (receipt: Receipt): number => {
    return departments.reduce((total, dept) => {
      return total + calculateDepartmentConsumption(dept, receipt);
    }, 0);
  };

  const calculateCommonAreasConsumption = (receipt: Receipt): number => {
    return receipt.consumedM3 - calculateConsumptionTotal(receipt);
  };

  if (loading) {
    return (
      <div className="receipts-table-wrapper">
        <div className="loading-container">
          <Loader size={24} className="spinner" />
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipts-table-wrapper">
        <div style={{ display: 'flex', gap: '12px', padding: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} style={{ color: '#c33', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', color: '#c33' }}>Error</div>
            <div style={{ color: '#666', fontSize: '14px' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <div className="receipts-table-wrapper">
        <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Carga primero un recibo general en la sección "Cargar Recibo"</p>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="receipts-table-wrapper">
        <div style={{ display: 'flex', gap: '12px', padding: '15px', backgroundColor: '#fef3cd', border: '1px solid #ffecb5', borderRadius: '4px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} style={{ color: '#ff9800', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', color: '#ff9800' }}>Sin departamentos</div>
            <div style={{ color: '#666', fontSize: '14px' }}>No hay departamentos registrados en el sistema</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="receipts-table-wrapper">
      <div className="table-container">
        <table className="receipts-calculation-table">
          <thead>
            <tr>
              <th>Departamento</th>
              {receipts.map((receipt) => (
                <th key={receipt.id}>
                  <div>{formatDate(receipt.periodStart.split('T')[0])}</div>
                  <div className="receipt-header-divider">al</div>
                  <div>{formatDate(receipt.periodEnd.split('T')[0])}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td className="dept-name">{dept.code}</td>
                {receipts.map((receipt) => {
                  const consumption = calculateDepartmentConsumption(dept, receipt);
                  return (
                    <td key={`${dept.id}-${receipt.id}`} className="amount">
                      {formatNumber(consumption)} m³
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="subtotal-row">
              <td className="dept-name" style={{ fontWeight: 'bold' }}>Total de departamentos</td>
              {receipts.map((receipt) => {
                const total = calculateConsumptionTotal(receipt);
                return (
                  <td key={`subtotal-${receipt.id}`} className="amount" style={{ fontWeight: 'bold' }}>
                    {formatNumber(total)} m³
                  </td>
                );
              })}
            </tr>
            <tr className="common-areas-row">
              <td className="dept-name" style={{ fontStyle: 'italic', color: '#666' }}>Áreas comunes</td>
              {receipts.map((receipt) => {
                const consumption = calculateCommonAreasConsumption(receipt);
                return (
                  <td key={`common-${receipt.id}`} className="amount" style={{ backgroundColor: '#fef3cd' }}>
                    {formatNumber(consumption)} m³
                  </td>
                );
              })}
            </tr>
            <tr className="totals-row">
              <td className="dept-name" style={{ fontWeight: 'bold' }}>Total del recibo</td>
              {receipts.map((receipt) => {
                return (
                  <td key={`final-total-${receipt.id}`} className="amount" style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                    {formatNumber(receipt.consumedM3)} m³
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
