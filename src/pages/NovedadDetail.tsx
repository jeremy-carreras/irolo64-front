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

  const getCategoryColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'administración':
        return { text: 'text-blue-700', badge: 'bg-blue-100', bgLight: 'bg-blue-50' };
      case 'mantenimiento':
        return { text: 'text-orange-700', badge: 'bg-orange-100', bgLight: 'bg-orange-50' };
      case 'seguridad':
        return { text: 'text-red-700', badge: 'bg-red-100', bgLight: 'bg-red-50' };
      case 'aviso':
        return { text: 'text-purple-700', badge: 'bg-purple-100', bgLight: 'bg-purple-50' };
      default:
        return { text: 'text-gray-700', badge: 'bg-gray-100', bgLight: 'bg-gray-50' };
    }
  };

  const colors = getCategoryColor(novedad.tipo);

  return (
    <NovedadesLayout>
      <div className="py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/novedades')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver a novedades
        </button>

        {/* Hero Section with Image */}
        {novedad.urlImage && (
          <div
            className="w-full h-[300px] md:h-[400px] rounded-lg mb-8 bg-gradient-to-br from-blue-50 to-yellow-50"
            style={{
              backgroundImage: `url(${novedad.urlImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}

        {/* Title & Meta Section */}
        <div className={`p-6 md:p-8 mb-8 bg-gradient-to-r ${colors.bgLight} rounded-lg border-l-4 ${novedad.tipo === 'Administración' ? 'border-l-blue-500' : novedad.tipo === 'Mantenimiento' ? 'border-l-orange-500' : novedad.tipo === 'Seguridad' ? 'border-l-red-500' : 'border-l-purple-500'}`}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center flex-wrap">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${colors.badge} ${colors.text}`}>
                {novedad.tipo}
              </span>
              {novedad.prioridad && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  novedad.prioridad === 'alta'
                    ? 'bg-red-100 text-red-700'
                    : novedad.prioridad === 'media'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {novedad.prioridad.charAt(0).toUpperCase() + novedad.prioridad.slice(1)}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {novedad.titulo}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
              <span className="font-medium">{formatDate(novedad.fecha)}</span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="text-gray-500">{getRelativeTime(novedad.fecha)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-8">
          <div className="max-w-3xl mx-auto">
            {novedad.contenidoCompleto.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/novedades')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Volver a novedades
            </button>
          </div>
        </div>
      </div>
    </NovedadesLayout>
  );
}
