import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Building2, FileText, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          {/* Logo */}
          <Link to="/departments" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
              <Building2 size={22} className="text-gray-900" />
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
        <div className="fixed right-4 top-20 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
          {/* Menu Items */}
          <nav className="py-2">
            <Link
              to="/departments"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                location.pathname === '/departments' || location.pathname.startsWith('/departments/')
                  ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Building2 size={18} />
              <span className="font-medium">Departamentos</span>
            </Link>
            <Link
              to="/receipts"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                location.pathname === '/receipts'
                  ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              <span className="font-medium">Recibos</span>
            </Link>
          </nav>

          {/* Divider */}
          <div className="h-px bg-gray-200"></div>

          {/* Logout */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
            >
              <LogOut size={18} />
              <span>Salir</span>
            </button>
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
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
