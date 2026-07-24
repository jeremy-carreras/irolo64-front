import { useNovedades } from "../hooks/useNovedades";
import { NovedadesLayout } from "../components/NovedadesLayout";
import { Loader, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NovedadesPage() {
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

  return (
    <NovedadesLayout>
      {/* Banner Image with Header Overlay */}
      <div className="relative rounded overflow-hidden h-[300px] md:h-[400px] mb-8 flex items-center justify-center">
        <img
          src="https://assets.easybroker.com/property_images/3888632/63936629/EB-NX8632.JPG?version=1689724045"
          alt="Novedades banner"
          className="absolute inset-0 w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative text-center text-white z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Novedades</h1>
          <p className="text-base md:text-lg font-medium">
            Mantente informado de los últimos eventos y actualizaciones
          </p>
        </div>
      </div>

      <div className="pb-12">
        {/* Novedades List */}
        <div className="space-y-6 md:space-y-4">
          {[...novedades].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((novedad) => {
            const borderColor =
              novedad.tipo === "Administración"
                ? "border-l-blue-500"
                : novedad.tipo === "Mantenimiento"
                  ? "border-l-orange-500"
                  : novedad.tipo === "Seguridad"
                    ? "border-l-red-500"
                    : "border-l-purple-500";

            const badgeColor =
              novedad.tipo === "Administración"
                ? "bg-blue-100 text-blue-700"
                : novedad.tipo === "Mantenimiento"
                  ? "bg-orange-100 text-orange-700"
                  : novedad.tipo === "Seguridad"
                    ? "bg-red-100 text-red-700"
                    : "bg-purple-100 text-purple-700";

            const priorityBadgeColor =
              novedad.prioridad === "alta"
                ? "bg-red-100 text-red-700"
                : novedad.prioridad === "media"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";

            return (
              <article
                key={novedad.id}
                onClick={() => navigate(`/novedades/${novedad.id}`)}
                className={`group bg-white rounded-lg border-l-4 ${borderColor} cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col md:grid md:grid-cols-[1fr_220px_auto] gap-0 md:gap-6 p-4 md:p-6 min-h-[120px]`}
              >
                {/* Image (Mobile first) */}
                {novedad.urlImage && (
                  <div
                    className="w-full h-[140px] rounded-md bg-gradient-to-br from-blue-50 to-yellow-50 flex-shrink-0 mb-3 md:mb-0 md:order-2"
                    style={{
                      backgroundImage: `url(${novedad.urlImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}

                {/* Content */}
                <div className="flex flex-col justify-center gap-3 md:gap-2 md:order-1">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}
                    >
                      {novedad.tipo}
                    </span>
                    {novedad.prioridad && (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${priorityBadgeColor}`}
                      >
                        {novedad.prioridad === "alta"
                          ? "Alta"
                          : novedad.prioridad === "media"
                            ? "Media"
                            : "Baja"}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-medium">
                      {getRelativeTime(novedad.fecha)}
                    </span>
                  </div>

                  <h2 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {novedad.titulo}
                  </h2>

                  <p className="text-sm md:text-base text-gray-600 line-clamp-2 md:line-clamp-2 leading-relaxed">
                    {novedad.descripcion}
                  </p>
                </div>

                {/* Arrow (Desktop only) */}
                <div className="hidden md:flex items-center justify-center text-2xl text-blue-500 group-hover:translate-x-1 transition-transform md:order-3">
                  →
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
