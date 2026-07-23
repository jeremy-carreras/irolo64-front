import { useNovedades } from '../hooks/useNovedades';
import { NovedadesLayout } from '../components/NovedadesLayout';
import { Calendar, Newspaper, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NovedadesPage() {
  const navigate = useNavigate();
  const { novedades, loading, getRelativeTime } = useNovedades();

  const getCategoryColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'administración':
        return { text: 'text-blue-700', badge: 'bg-blue-100' };
      case 'mantenimiento':
        return { text: 'text-orange-700', badge: 'bg-orange-100' };
      case 'seguridad':
        return { text: 'text-red-700', badge: 'bg-red-100' };
      case 'aviso':
        return { text: 'text-purple-700', badge: 'bg-purple-100' };
      default:
        return { text: 'text-gray-700', badge: 'bg-gray-100' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <NovedadesLayout>
        <div className="flex items-center justify-center h-96">
          <Loader size={48} className="animate-spin text-blue-600" />
        </div>
      </NovedadesLayout>
    );
  }

  return (
    <NovedadesLayout>
      <div className="space-y-10 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded p-6 md:p-12 text-gray-900 shadow-sm border border-gray-200">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Newspaper size={20} className="text-gray-600" />
              </div>
              <span className="text-gray-600 font-semibold text-sm md:text-base">Centro de Novedades</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-3">
              Bienvenido al portal de novedades
            </h1>
            <p className="text-gray-600 text-sm md:text-lg">
              Para que te mantengas informado de las últimas actualizaciones, mantenimiento y eventos de tu residencial
            </p>
          </div>
        </div>

        {/* Novedades List */}
        <div className="space-y-6">
          {novedades.map((novedad, index) => {
            const colors = getCategoryColor(novedad.tipo);
            return (
              <article
                key={novedad.id}
                className={`group bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 ${novedad.tipo === 'Administración' ? 'border-l-blue-500' : novedad.tipo === 'Mantenimiento' ? 'border-l-orange-500' : novedad.tipo === 'Seguridad' ? 'border-l-red-500' : 'border-l-purple-500'}`}
              >
                <div className="p-5 md:p-7">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-3 md:gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {novedad.icono && <span className="text-3xl">{novedad.icono}</span>}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge} ${colors.text} flex-shrink-0`}>
                            {novedad.tipo}
                          </span>
                          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                            {getRelativeTime(novedad.fecha)}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                          {novedad.titulo}
                        </h2>
                      </div>
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <div className="text-2xl font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium sm:hidden inline-block">
                      {getRelativeTime(novedad.fecha)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-5 line-clamp-2">
                    {novedad.descripcion}
                  </p>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="font-medium text-xs">{formatDate(novedad.fecha)}</span>
                        </div>
                        {novedad.prioridad && (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${novedad.prioridad === 'alta' ? 'bg-red-100 text-red-700' : novedad.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {novedad.prioridad === 'alta' ? '⚡ Alta' : novedad.prioridad === 'media' ? '⚠️ Media' : '✓ Baja'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/novedades/${novedad.id}`)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold transition-all text-sm hover:gap-3 self-start md:self-auto"
                      >
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
