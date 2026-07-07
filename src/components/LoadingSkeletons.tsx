export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
          ))}
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-b border-gray-200 px-6 py-4 flex gap-4 items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="h-6 bg-gray-300 rounded w-2/3 animate-pulse"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
      </div>
    </div>
  );
}

export function DepartmentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-300 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-spin"></div>
        <div className="absolute inset-1 bg-white rounded-full"></div>
      </div>
      <p className="text-gray-600 font-medium">Cargando...</p>
    </div>
  );
}

export function InlineLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
