import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { DepartmentDetailPage } from './pages/DepartmentDetail';
import { WaterPage } from './pages/Water';
import { NovedadesPage } from './pages/Novedades';
import { NovedadDetailPage } from './pages/NovedadDetail';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-800">Cargando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/novedades" element={<NovedadesPage />} />
        <Route path="/novedades/:id" element={<NovedadDetailPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/water" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/water"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <WaterPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DepartmentDetailPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/departments" element={<Navigate to="/water" replace />} />
        <Route path="/receipts" element={<Navigate to="/water" replace />} />
        <Route path="/water-readings/bulk" element={<Navigate to="/water" replace />} />
        <Route path="/water-readings/history" element={<Navigate to="/water" replace />} />
        <Route path="/" element={<Navigate to="/novedades" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
