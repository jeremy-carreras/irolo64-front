import { NovedadesLayout } from '../components/NovedadesLayout';
import { Calendar, User, Newspaper } from 'lucide-react';

interface Novedad {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

const getCategoryColor = (author: string) => {
  switch (author.toLowerCase()) {
    case 'administración':
      return { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' };
    case 'mantenimiento':
      return { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100' };
    case 'seguridad':
      return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' };
  }
};

export function NovedadesPage() {
  // Por ahora con datos mock, después será de una API
  const novedades: Novedad[] = [
    {
      id: '1',
      title: 'Bienvenido a Palma Irolo',
      content: 'Nos complace presentar la nueva sección de novedades. Aquí encontrarás las últimas actualizaciones y noticias de nuestro residencial. Estaremos compartiendo información importante sobre mantenimiento, eventos y cambios en el servicio.',
      author: 'Administración',
      date: '2026-07-10',
    },
    {
      id: '2',
      title: 'Mantenimiento de Tuberías',
      content: 'Se realizará mantenimiento preventivo en las tuberías principales del edificio. El trabajo se llevará a cabo el próximo jueves de 9:00 a 17:00. Se solicita a los residentes que conserven sus tanques llenos de agua. No habrá suministro durante este período.',
      author: 'Mantenimiento',
      date: '2026-07-08',
    },
    {
      id: '3',
      title: 'Actualización del Sistema de Agua',
      content: 'Hemos implementado un nuevo sistema de monitoreo de consumo de agua para mejorar la eficiencia y transparencia en la distribución. Esto nos permitirá detectar fugas más rápidamente y optimizar el uso de recursos.',
      author: 'Administración',
      date: '2026-07-05',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return `Hace ${Math.floor(diffDays / 7)} semanas`;
  };

  return (
    <NovedadesLayout>
      <div className="space-y-10 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-12 text-white shadow-lg">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Newspaper size={20} />
              </div>
              <span className="text-blue-100 font-semibold text-sm md:text-base">Últimas Novedades</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-3">
              Mantente Informado
            </h1>
            <p className="text-blue-100 text-sm md:text-lg">
              Conoce las últimas actualizaciones, mantenimiento y eventos de tu residencial
            </p>
          </div>
        </div>

        {/* Novedades List */}
        <div className="space-y-5">
          {novedades.map((novedad, index) => {
            const colors = getCategoryColor(novedad.author);
            return (
              <article
                key={novedad.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-200/70 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 md:gap-3 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge} ${colors.text}`}>
                            {novedad.author}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {getTimeAgo(novedad.date)}
                          </span>
                        </div>
                        <h2 className="text-lg md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {novedad.title}
                        </h2>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-gray-300 group-hover:text-gray-400 transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 leading-relaxed text-sm md:text-lg mb-6">
                    {novedad.content}
                  </p>

                  {/* Footer */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(novedad.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          <span>{novedad.author}</span>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors text-sm md:text-base">
                        <span>Leer más</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty State */}
        {novedades.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Newspaper size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">
              No hay novedades en este momento
            </p>
            <p className="text-gray-500">
              Vuelve pronto para ver las últimas actualizaciones
            </p>
          </div>
        )}
      </div>
    </NovedadesLayout>
  );
}
