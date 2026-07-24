import { useParams, useNavigate } from 'react-router-dom';
import { NovedadesLayout } from '../components/NovedadesLayout';
import { ArrowLeft, Loader } from 'lucide-react';
import { useNovedades } from '../hooks/useNovedades';

export function NovedadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { novedades, loading, getRelativeTime } = useNovedades();

  if (loading) {
    return (
      <NovedadesLayout>
        <div className="flex items-center justify-center h-96">
          <Loader size={48} className="animate-spin text-blue-600" />
        </div>
      </NovedadesLayout>
    );
  }

  const novedad = novedades.find((n) => n.id === id);

  if (!novedad) {
    return (
      <NovedadesLayout>
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg font-medium mb-4">Novedad no encontrada</p>
          <button
            onClick={() => navigate('/novedades')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Volver a novedades
          </button>
        </div>
      </NovedadesLayout>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBorderColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'administración': return 'border-l-blue-500';
      case 'mantenimiento': return 'border-l-orange-500';
      case 'seguridad': return 'border-l-red-500';
      case 'aviso': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'administración': return 'bg-blue-100 text-blue-700';
      case 'mantenimiento': return 'bg-orange-100 text-orange-700';
      case 'seguridad': return 'bg-red-100 text-red-700';
      case 'aviso': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const relatedNovedades = novedades
    .filter((n) => n.tipo === novedad.tipo && n.id !== novedad.id)
    .slice(0, 3);

  return (
    <NovedadesLayout>
      <div className="pb-12">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-3 mb-6 md:mb-8 border-b border-gray-200 z-40">
          <div className="flex items-center gap-3 px-4 md:px-0">
            <button
              onClick={() => navigate('/novedades')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-all text-sm"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <span className="text-gray-500 text-sm hidden sm:inline">/ {novedad.tipo}</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="w-full h-[200px] md:h-[380px] -mx-4 md:mx-0 md:rounded-lg mb-6 md:mb-8 bg-gradient-to-br from-blue-50 to-yellow-50 overflow-hidden md:shadow-lg">
          {novedad.urlImage ? (
            <img
              src={novedad.urlImage}
              alt={novedad.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">📰</div>
          )}
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-wrap gap-3 md:gap-4 items-center mb-6 md:mb-8 pb-6 border-b border-gray-200 px-4 md:px-0">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getBadgeColor(novedad.tipo)}`}>
            {novedad.tipo}
          </span>
          {novedad.prioridad && (
            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
              novedad.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
              novedad.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {novedad.prioridad === 'alta' ? 'Alta' : novedad.prioridad === 'media' ? 'Media' : 'Baja'}
            </span>
          )}
          <div className="h-5 w-px bg-gray-300"></div>
          <span className="text-xs md:text-sm text-gray-600 font-medium">{formatDate(novedad.fecha)}</span>
          <span className="text-xs md:text-sm text-gray-500">{getRelativeTime(novedad.fecha)}</span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-8 md:mb-10 px-4 md:px-0">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
            {novedad.titulo}
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            {novedad.descripcion}
          </p>
        </div>

        {/* Content & Sidebar Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 md:gap-8 mb-12 md:mb-16 px-4 md:px-0">
          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-5 md:p-8">
            <div className="max-w-none">
              {novedad.contenidoCompleto.split('\n').map((paragraph: string, index: number) => (
                paragraph.trim() && (
                  <p key={index} className="text-gray-700 leading-relaxed mb-4 md:mb-5 text-sm md:text-base text-justify">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4 md:gap-5">
            {/* Info Card */}
            <div className={`bg-white rounded-lg shadow-sm p-4 md:p-5 border-l-4 ${getBorderColor(novedad.tipo)}`}>
              <h3 className="font-bold text-gray-900 mb-3 text-sm md:text-base">Información</h3>
              <div className="text-xs md:text-sm text-gray-600 space-y-2">
                <div>
                  <span className="font-semibold block text-gray-700 mb-1">Categoría</span>
                  <span>{novedad.tipo}</span>
                </div>
                <div>
                  <span className="font-semibold block text-gray-700 mt-3 mb-1">Publicado</span>
                  <span>{formatDate(novedad.fecha)}</span>
                </div>
                {novedad.prioridad && (
                  <div>
                    <span className="font-semibold block text-gray-700 mt-3 mb-1">Prioridad</span>
                    <span className="capitalize">{novedad.prioridad}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/novedades')}
              className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold text-sm md:text-base rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Volver a Novedades
            </button>
          </div>
        </div>

        {/* Related News Section */}
        {relatedNovedades.length > 0 && (
          <div className="border-t-2 border-gray-200 pt-8 md:pt-12 px-4 md:px-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 flex items-center gap-2">
              <span className="w-1 h-6 md:h-7 bg-yellow-400 rounded-sm"></span>
              Novedades Relacionadas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {relatedNovedades.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/novedades/${related.id}`)}
                  className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border-t-4 ${getBorderColor(related.tipo)} text-left group`}
                >
                  {/* Image */}
                  <div className="w-full h-[140px] bg-gradient-to-br from-blue-50 to-yellow-50 flex items-center justify-center text-3xl overflow-hidden">
                    {related.urlImage ? (
                      <img
                        src={related.urlImage}
                        alt={related.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span>📰</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-2 ${getBadgeColor(related.tipo)}`}>
                      {related.tipo}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {related.titulo}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getRelativeTime(related.fecha)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </NovedadesLayout>
  );
}
