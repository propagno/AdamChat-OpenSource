// src/App.js
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { AnimatePresence } from 'framer-motion';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ColorModeProvider } from './contexts/ColorModeContext';
import ErrorFallback from './components/common/ErrorFallback';
import OAuthCallback from './components/OAuthCallback';
import OAuthStandaloneCallback from './components/OAuthStandaloneCallback';
import Chat from './pages/Chat';

// Importar componentes das páginas principais
import Dashboard from './pages/dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import SystemStatus from './pages/SystemStatus';
import AuthDiagnostic from './pages/AuthDiagnostic';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthDebug from './debug/AuthDebug';
import TestApi from './pages/TestApi';
import OAuthTestPage from './pages/OAuthTestPage';
import ApiDiagnostic from './pages/ApiDiagnostic';
import VideoGenerator from './pages/VideoGenerator';
import UserSettings from './pages/UserSettings';

// Importar componentes da pasta components
import EbookLibrary from './components/EbookLibrary';
import EbookGenerator from './components/EbookGenerator';
import EbookPreview from './components/EbookPreview';
import CadastroPaciente from './components/CadastroPaciente';
import FichaPaciente from './components/FichaPaciente';
import ProtectedRoute from './routes/ProtectedRoute';

/**
 * Componente de fallback para mostrar loading
 */
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <p>Carregando aplicação...</p>
  </div>
);

/**
 * Componente para redirecionar com base na autenticação
 */
const AuthRedirect = ({ authPath, nonAuthPath }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setChecking(false);
    };
    
    verifyAuth();
  }, [checkAuth]);
  
  if (isLoading || checking) {
    return <LoadingFallback />;
  }
  
  return isAuthenticated 
    ? <Navigate to={authPath} replace /> 
    : <Navigate to={nonAuthPath} replace />;
};

/**
 * Wrapper para transições animadas
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Rota raiz - redireciona para dashboard ou login */}
        <Route 
          path="/" 
          element={
            <AuthRedirect 
              authPath="/dashboard" 
              nonAuthPath="/login" 
            />
          } 
        />

        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/system-status" element={<SystemStatus />} />
        <Route path="/auth-diagnostic" element={<AuthDiagnostic />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/callback" element={<OAuthCallback />} />
        <Route path="/auth-debug" element={<AuthDebug />} />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/oauth-test" element={<OAuthTestPage />} />
        <Route path="/oauth-callback" element={<OAuthStandaloneCallback />} />
        <Route path="/api-diagnostic" element={<ApiDiagnostic />} />
        
        {/* Rotas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas para funcionalidades da biblioteca */}
        <Route 
          path="/library" 
          element={
            <ProtectedRoute>
              <EbookLibrary />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/library/create" 
          element={
            <ProtectedRoute>
              <EbookGenerator />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/library/preview/:id" 
          element={
            <ProtectedRoute>
              <EbookPreview />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas para Chat */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chat/new" 
          element={
            <ProtectedRoute>
              <Chat isNew={true} />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas para Pacientes */}
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="patients" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/patients/add" 
          element={
            <ProtectedRoute>
              <CadastroPaciente />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/patients/:id" 
          element={
            <ProtectedRoute>
              <FichaPaciente />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota para Analytics */}
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Dashboard activeTab="analytics" />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas para mídia */}
        <Route 
          path="/video" 
          element={
            <ProtectedRoute>
              <VideoGenerator />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota para Configurações */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <UserSettings />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota 404 - página não encontrada */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

/**
 * Aplicação principal
 */
function App() {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // Para diagnóstico: detectar se estamos rodando localmente
  useEffect(() => {
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';
    
    console.log('Running on localhost:', isLocalhost);
    console.log('App version:', process.env.REACT_APP_VERSION || 'development');
    
    // Verificar a URL atual
    console.log('Current pathname:', window.location.pathname);
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("Erro capturado pelo ErrorBoundary:", error, info);
        setHasError(true);
        setErrorInfo(info);
      }}
    >
      <AuthProvider>
        <ColorModeProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <AnimatedRoutes />
            </Suspense>
          </BrowserRouter>
        </ColorModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
