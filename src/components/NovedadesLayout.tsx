import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, Newspaper, Droplet, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NovedadesLayoutProps {
  children: React.ReactNode;
}

export function NovedadesLayout({ children }: NovedadesLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/novedades');
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          {/* Logo */}
          <Link to="/novedades" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg overflow-hidden mt-1">
              <img src="/img/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Palma Irolo</h1>
              <p className="text-xs text-gray-500">Irolo 64</p>
            </div>
          </Link>

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X size={24} className="text-gray-700" />
            ) : (
              <Menu size={24} className="text-gray-700" />
            )}
          </button>
        </div>
      </header>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div className="fixed right-4 top-20 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-40">
          {/* Menu Items */}
          <nav className="py-1">
            {/* Novedades - Siempre visible */}
            <Link
              to="/novedades"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 transition-all ${
                location.pathname === '/novedades'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Newspaper size={18} />
              <span className="font-medium">Novedades</span>
            </Link>

            {/* Agua - Solo si está logueado */}
            {isAuthenticated && (
              <Link
                to="/water"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all ${
                  location.pathname === '/water' || location.pathname.startsWith('/water')
                    ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Droplet size={18} />
                <span className="font-medium">Agua</span>
              </Link>
            )}
          </nav>

          {/* Divider - Solo si está logueado */}
          {isAuthenticated && <div className="h-px bg-gray-100 my-2"></div>}

          {/* Ingresar o Salir */}
          <div className="p-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
              >
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogin();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm"
              >
                <LogIn size={18} />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Close Menu on Click Outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="md:p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
