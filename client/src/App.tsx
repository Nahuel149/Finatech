import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SessionTimeoutManager from './components/SessionTimeoutManager';
import { prefetchCsrfToken } from './utils/api';
import { devPerformanceUtils } from './utils/performanceMonitor';

const Register = React.lazy(() => import('./components/Register').then((module) => ({ default: module.Register })));
const LoginPage = React.lazy(() => import('./components/login/LoginPage').then((module) => ({ default: module.LoginPage })));
const VerifyEmailPage = React.lazy(() =>
  import('./components/login/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage }))
);
const AdminLoginPage = React.lazy(() =>
  import('./components/admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage }))
);
const AdminPage = React.lazy(() => import('./components/admin/AdminPage').then((module) => ({ default: module.AdminPage })));
const RecoveryPage = React.lazy(() => import('./components/recover/RecoveryPage').then((module) => ({ default: module.RecoveryPage })));
const DashboardOperacionesPage = React.lazy(() =>
  import('./components/dashboard/operaciones/DashboardOperacionesPage').then((module) => ({
    default: module.DashboardOperacionesPage,
  }))
);
const NotificationsPage = React.lazy(() =>
  import('./components/dashboard/operaciones/NotificationsPage').then((module) => ({ default: module.NotificationsPage }))
);
const OperationWizardStep1Page = React.lazy(() =>
  import('./components/dashboard/operaciones/wizard/OperationWizardStep1Page').then((module) => ({
    default: module.OperationWizardStep1Page,
  }))
);
const OperationWizardStep2Page = React.lazy(() =>
  import('./components/dashboard/operaciones/wizard/OperationWizardStep2Page').then((module) => ({
    default: module.OperationWizardStep2Page,
  }))
);
const OperationWizardStep3Page = React.lazy(() =>
  import('./components/dashboard/operaciones/wizard/OperationWizardStep3Page').then((module) => ({
    default: module.OperationWizardStep3Page,
  }))
);
const OperationDetailPage = React.lazy(() =>
  import('./components/dashboard/operaciones/OperationDetailPage').then((module) => ({ default: module.OperationDetailPage }))
);
const TreasuryMovementsPage = React.lazy(() =>
  import('./components/dashboard/tesoreria/TreasuryMovementsPage').then((module) => ({ default: module.TreasuryMovementsPage }))
);
const LinkedBalancesPage = React.lazy(() =>
  import('./components/dashboard/tesoreria/linked/LinkedBalancesPage').then((module) => ({ default: module.LinkedBalancesPage }))
);
const GlobalBalancesPage = React.lazy(() =>
  import('./components/dashboard/tesoreria/global/GlobalBalancesPage').then((module) => ({ default: module.GlobalBalancesPage }))
);
const ContactBalanceDetailPage = React.lazy(() =>
  import('./components/dashboard/tesoreria/contact/ContactBalanceDetailPage').then((module) => ({
    default: module.ContactBalanceDetailPage,
  }))
);
const PendingReceptionsPage = React.lazy(() =>
  import('./components/dashboard/tesoreria/receptions/PendingReceptionsPage').then((module) => ({
    default: module.PendingReceptionsPage,
  }))
);
const TransferPesosFlow = React.lazy(() =>
  import('./components/dashboard/operaciones/transfer/TransferPesosFlow').then((module) => ({
    default: module.TransferPesosFlow,
  }))
);
const TransferPesosBuilderPage = React.lazy(() =>
  import('./components/dashboard/operaciones/transfer/TransferPesosBuilderPage').then((module) => ({
    default: module.TransferPesosBuilderPage,
  }))
);
const TransferPesosConfirmPage = React.lazy(() =>
  import('./components/dashboard/operaciones/transfer/TransferPesosConfirmPage').then((module) => ({
    default: module.TransferPesosConfirmPage,
  }))
);
const TransferPesosSuccessPage = React.lazy(() =>
  import('./components/dashboard/operaciones/transfer/TransferPesosSuccessPage').then((module) => ({
    default: module.TransferPesosSuccessPage,
  }))
);
const TransferPesosDetailPage = React.lazy(() =>
  import('./components/dashboard/operaciones/transfer/TransferPesosDetailPage')
);
const LogisticaPage = React.lazy(() =>
  import('./components/dashboard/logistica/LogisticaPage').then((module) => ({ default: module.LogisticaPage }))
);
const LogisticsGeneralSummaryPage = React.lazy(() =>
  import('./components/dashboard/logistica/LogisticsGeneralSummaryPage').then((module) => ({
    default: module.LogisticsGeneralSummaryPage,
  }))
);
const MovementDetailPage = React.lazy(() =>
  import('./components/dashboard/logistica/MovementDetailPage').then((module) => ({ default: module.MovementDetailPage }))
);
const IncidentDetailPage = React.lazy(() =>
  import('./components/dashboard/logistica/IncidentDetailPage').then((module) => ({ default: module.IncidentDetailPage }))
);
const ResolvedIncidentDetailPage = React.lazy(() =>
  import('./components/dashboard/logistica/ResolvedIncidentDetailPage').then((module) => ({
    default: module.ResolvedIncidentDetailPage,
  }))
);
const LogisticsOrderDetailPage = React.lazy(() =>
  import('./components/dashboard/logistica/LogisticsOrderDetailPage').then((module) => ({
    default: module.LogisticsOrderDetailPage,
  }))
);
const LocationSearchPage = React.lazy(() =>
  import('./components/location/LocationSearchPage').then((module) => ({ default: module.LocationSearchPage }))
);
const AccountSettingsPage = React.lazy(() =>
  import('./components/dashboard/settings/AccountSettingsPage').then((module) => ({ default: module.AccountSettingsPage }))
);
const ProfilePage = React.lazy(() =>
  import('./components/dashboard/settings/ProfilePage').then((module) => ({ default: module.ProfilePage }))
);

const AppLoading: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
    Cargando...
  </div>
);

const App: React.FC = () => {
  // Initialize performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      devPerformanceUtils.startGlobalMonitoring();
      
      // Add keyboard shortcut to export performance metrics (Ctrl+Shift+P)
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          devPerformanceUtils.exportMetrics();
        }
        // Add keyboard shortcut to log performance report (Ctrl+Shift+R)
        if (event.ctrlKey && event.shiftKey && event.key === 'R') {
          devPerformanceUtils.logReport();
        }
      };
      
      document.addEventListener('keydown', handleKeyPress);
      
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, []);

  // Ensure CSRF cookie is available before any API POST/PUT/DELETE
  useEffect(() => {
    prefetchCsrfToken();
  }, []);

  return (
    <ErrorBoundary>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SessionTimeoutManager />
        <div className="App">
          <Suspense fallback={<AppLoading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
              <Route path="/login/admin" element={<ErrorBoundary><AdminLoginPage /></ErrorBoundary>} />
              <Route path="/verify-email" element={<ErrorBoundary><VerifyEmailPage /></ErrorBoundary>} />
              <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
              <Route path="/recover" element={<ErrorBoundary><RecoveryPage /></ErrorBoundary>} />
              <Route path="/admin" element={<ErrorBoundary><AdminPage /></ErrorBoundary>} />
              <Route path="/dashboard" element={<ErrorBoundary><DashboardOperacionesPage /></ErrorBoundary>} />
              <Route path="/dashboard/notificaciones" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
              <Route path="/dashboard/logistica" element={<ErrorBoundary><LogisticaPage /></ErrorBoundary>} />
              <Route path="/dashboard/logistica/resumen-general" element={<ErrorBoundary><LogisticsGeneralSummaryPage /></ErrorBoundary>} />
              <Route path="/dashboard/logistica/movimiento/:movementId" element={<ErrorBoundary><MovementDetailPage /></ErrorBoundary>} />
              <Route path="/dashboard/logistica/incidencia/:incidentId" element={<ErrorBoundary><IncidentDetailPage /></ErrorBoundary>} />
              <Route path="/dashboard/logistica/incidencia-resuelta/:incidentId" element={<ErrorBoundary><ResolvedIncidentDetailPage /></ErrorBoundary>} />
              <Route path="/dashboard/logistica/orden/:orderId" element={<ErrorBoundary><LogisticsOrderDetailPage /></ErrorBoundary>} />
              <Route path="/dashboard/ubicaciones" element={<ErrorBoundary><LocationSearchPage /></ErrorBoundary>} />
              <Route path="/dashboard/tesoreria" element={<ErrorBoundary><TreasuryMovementsPage /></ErrorBoundary>} />
              <Route path="/dashboard/tesoreria/saldos" element={<ErrorBoundary><GlobalBalancesPage /></ErrorBoundary>} />
              <Route path="/dashboard/tesoreria/saldos/vinculados" element={<ErrorBoundary><LinkedBalancesPage /></ErrorBoundary>} />
              <Route path="/dashboard/tesoreria/recepciones" element={<ErrorBoundary><PendingReceptionsPage /></ErrorBoundary>} />
              <Route
                path="/dashboard/tesoreria/saldos/contacto/:contactId"
                element={<ErrorBoundary><ContactBalanceDetailPage /></ErrorBoundary>}
              />
              <Route
                path="/dashboard/tesoreria/movimientos/:movementId"
                element={<ErrorBoundary><TreasuryMovementsPage /></ErrorBoundary>}
              />
              <Route path="/dashboard/perfil" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
              <Route path="/dashboard/configuracion" element={<ErrorBoundary><AccountSettingsPage /></ErrorBoundary>} />
              <Route path="/dashboard/operaciones/transfer-pesos" element={<ErrorBoundary><TransferPesosFlow /></ErrorBoundary>}>
                <Route index element={<ErrorBoundary><TransferPesosBuilderPage /></ErrorBoundary>} />
                <Route path="confirmacion" element={<ErrorBoundary><TransferPesosConfirmPage /></ErrorBoundary>} />
                <Route path="completada" element={<ErrorBoundary><TransferPesosSuccessPage /></ErrorBoundary>} />
                <Route path="detalle/:operationId" element={<ErrorBoundary><TransferPesosDetailPage /></ErrorBoundary>} />
              </Route>
              <Route
                path="/dashboard/operaciones/detalle/:operationId"
                element={<ErrorBoundary><OperationDetailPage /></ErrorBoundary>}
              />
              <Route path="/dashboard/operaciones/nueva" element={<ErrorBoundary><OperationWizardStep1Page /></ErrorBoundary>} />
              <Route path="/dashboard/operaciones/nueva/liquidacion" element={<ErrorBoundary><OperationWizardStep2Page /></ErrorBoundary>} />
              <Route path="/dashboard/operaciones/nueva/resumen" element={<ErrorBoundary><OperationWizardStep3Page /></ErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
