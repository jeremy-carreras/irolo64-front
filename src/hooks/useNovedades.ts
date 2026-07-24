import { useState, useEffect } from 'react';

export interface Novedad {
  id: string;
  tipo: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  contenidoCompleto: string;
  prioridad?: 'alta' | 'media' | 'baja';
  icono?: string;
  urlImage?: string;
}

// Cache global que persiste mientras la app esté en memoria
// Se reinicia automáticamente al recargar la página
let cachedNovedades: Novedad[] | null = null;

export function useNovedades() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovedades = async () => {
      try {
        // Si ya tenemos datos en cache, usarlos
        if (cachedNovedades) {
          setNovedades(cachedNovedades);
          setLoading(false);
          return;
        }

        // Si no hay cache, hacer la petición
        const response = await fetch('https://6a6380fbb30b52361e1a60e8.mockapi.io/news/news', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();

        // Guardar en cache global
        cachedNovedades = data;
        setNovedades(data);
      } catch (error) {
        console.error('Error fetching novedades:', error);
        setNovedades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNovedades();
  }, []);

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Hace unos momentos';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES');
  };

  const getColorByPriority = (priority: string): string => {
    switch (priority) {
      case 'alta':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'media':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'baja':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  return {
    novedades,
    loading,
    getRelativeTime,
    getColorByPriority,
  };
}
