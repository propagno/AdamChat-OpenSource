import React, { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Componentes comuns
import { Loading } from '../components/common';

// Componente para proteger rotas
import ProtectedRoute from './ProtectedRoute';

// Lazy loading de componentes
const Login = lazy(() => import('../features/authentication/Login'));
const Register = lazy(() => import('../features/authentication/Register'));
const ResetPassword = lazy(() => import('../features/authentication/ResetPassword'));
const EmergencyReset = lazy(() => import('../features/authentication/EmergencyReset'));
const SystemStatus = lazy(() => import('../features/system/SystemStatus'));
const AuthDiagnostic = lazy(() => import('../features/system/AuthDiagnostic'));

const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const Chat = lazy(() => import('../features/chat/Chat'));
const EbookGenerator = lazy(() => import('../features/ebook/EbookGenerator'));
const EbookLibrary = lazy(() => import('../features/ebook/EbookLibrary'));
const VideoGenerator = lazy(() => import('../features/video/VideoGenerator'));
const AvatarCreator = lazy(() => import('../features/avatar/AvatarCreator'));
const FashionPhoto = lazy(() => import('../features/fashion/FashionPhoto'));
const PlansPage = lazy(() => import('../features/payment/PlansPage'));
const TokensPage = lazy(() => import('../features/payment/TokensPage'));
const UserSettings = lazy(() => import('../features/user/UserSettings'));
const TokenPurchase = lazy(() => import('../features/payment/TokenPurchase'));
const SubscriptionPlans = lazy(() => import('../features/payment/SubscriptionPlans'));
const NotFound = lazy(() => import('../features/system/NotFound'));

/**
 * Componente de fallback para carregamento de páginas
 */
const PageLoading = () => <Loading message="Carregando página..." fullPage />;

/**
 * Configuração de rotas da aplicação
 * 
 * @returns {JSX.Element} Elemento com as rotas configuradas
 */
const Router = () => {
  return useRoutes([
    // Rotas públicas (não requerem autenticação)
    {
      path: '/',
      element: <AuthLayout />,
      children: [
        { path: '/', element: <Navigate to="/login" replace /> },
        {
          path: 'login',
          element: (
            <Suspense fallback={<PageLoading />}>
              <Login />
            </Suspense>
          ),
        },
        {
          path: 'register',
          element: (
            <Suspense fallback={<PageLoading />}>
              <Register />
            </Suspense>
          ),
        },
        {
          path: 'reset-password',
          element: (
            <Suspense fallback={<PageLoading />}>
              <ResetPassword />
            </Suspense>
          ),
        },
        {
          path: 'emergency-reset',
          element: (
            <Suspense fallback={<PageLoading />}>
              <EmergencyReset />
            </Suspense>
          ),
        },
      ],
    },
    
    // Rotas protegidas (requerem autenticação)
    {
      path: '/app',
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: '', element: <Navigate to="/app/dashboard" replace /> },
        {
          path: 'dashboard',
          element: (
            <Suspense fallback={<PageLoading />}>
              <Dashboard />
            </Suspense>
          ),
        },
        {
          path: 'chat',
          element: (
            <Suspense fallback={<PageLoading />}>
              <Chat />
            </Suspense>
          ),
        },
        {
          path: 'ebook',
          element: (
            <Suspense fallback={<PageLoading />}>
              <EbookGenerator />
            </Suspense>
          ),
        },
        {
          path: 'library',
          element: (
            <Suspense fallback={<PageLoading />}>
              <EbookLibrary />
            </Suspense>
          ),
        },
        {
          path: 'video',
          element: (
            <Suspense fallback={<PageLoading />}>
              <VideoGenerator />
            </Suspense>
          ),
        },
        {
          path: 'avatar',
          element: (
            <Suspense fallback={<PageLoading />}>
              <AvatarCreator />
            </Suspense>
          ),
        },
        {
          path: 'fashion',
          element: (
            <Suspense fallback={<PageLoading />}>
              <FashionPhoto />
            </Suspense>
          ),
        },
        {
          path: 'plans',
          element: (
            <Suspense fallback={<PageLoading />}>
              <PlansPage />
            </Suspense>
          ),
        },
        {
          path: 'tokens',
          element: (
            <Suspense fallback={<PageLoading />}>
              <TokensPage />
            </Suspense>
          ),
        },
        {
          path: 'settings',
          element: (
            <Suspense fallback={<PageLoading />}>
              <UserSettings />
            </Suspense>
          ),
        },
        {
          path: 'purchase',
          element: (
            <Suspense fallback={<PageLoading />}>
              <TokenPurchase />
            </Suspense>
          ),
        },
        {
          path: 'subscription',
          element: (
            <Suspense fallback={<PageLoading />}>
              <SubscriptionPlans />
            </Suspense>
          ),
        },
      ],
    },
    
    // Rotas de sistema (acessíveis sem autenticação)
    {
      path: '/',
      element: <MainLayout />,
      children: [
        {
          path: 'system-status',
          element: (
            <Suspense fallback={<PageLoading />}>
              <SystemStatus />
            </Suspense>
          ),
        },
        {
          path: 'auth-diagnostic',
          element: (
            <Suspense fallback={<PageLoading />}>
              <AuthDiagnostic />
            </Suspense>
          ),
        },
      ],
    },
    
    // Rota de página não encontrada
    {
      path: '*',
      element: (
        <Suspense fallback={<PageLoading />}>
          <NotFound />
        </Suspense>
      ),
    },
  ]);
};

export default Router; 