import { useState } from 'react';
import { Building2, FileText, Droplet } from 'lucide-react';
import { DepartmentsPage } from '../pages/Departments';
import ReceiptsAdmin from '../pages/ReceiptsAdmin';
import WaterReadingsBulk from '../pages/WaterReadingsBulk';
import WaterReadingsHistory from '../pages/WaterReadingsHistory';

interface WaterModuleProps {
  onLogout: () => void;
}

export function WaterModule({ onLogout }: WaterModuleProps) {
  const [activeTab, setActiveTab] = useState<'departments' | 'receipts' | 'water-input' | 'water-history'>('departments');

  const tabs = [
    {
      id: 'departments',
      label: 'Departamentos',
      icon: Building2,
    },
    {
      id: 'receipts',
      label: 'Recibos',
      icon: FileText,
    },
    {
      id: 'water-history',
      label: 'Registros',
      icon: Droplet,
    },
    {
      id: 'water-input',
      label: 'Medición',
      icon: Droplet,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentsPage onLogout={onLogout} layout={false} />;
      case 'receipts':
        return <ReceiptsAdmin onLogout={onLogout} layout={false} />;
      case 'water-input':
        return <WaterReadingsBulk onLogout={onLogout} layout={false} />;
      case 'water-history':
        return <WaterReadingsHistory onLogout={onLogout} layout={false} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white overflow-x-auto">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-2 md:p-8 max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
