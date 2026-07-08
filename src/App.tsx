import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { DepartmentsPage } from './pages/Departments';
import { DepartmentDetailPage } from './pages/DepartmentDetail';
import ReceiptsAdmin from './pages/ReceiptsAdmin';
import WaterReadingsBulk from './pages/WaterReadingsBulk';
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
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/departments" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DepartmentsPage onLogout={handleLogout} />
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
        <Route
          path="/receipts"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ReceiptsAdmin onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/water-readings/bulk"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <WaterReadingsBulk onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/departments" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
