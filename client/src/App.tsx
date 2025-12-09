import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Register } from './components';
import { LoginPage } from './components/login/LoginPage';
import { VerifyEmailPage } from './components/login/VerifyEmailPage';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminPage } from './components/admin/AdminPage';
import { RecoveryPage } from './components/recover';
import { DashboardOperacionesPage } from './components/dashboard/operaciones/DashboardOperacionesPage';
import { NotificationsPage } from './components/dashboard/operaciones/NotificationsPage';
import { OperationWizardStep1Page } from './components/dashboard/operaciones/wizard/OperationWizardStep1Page';
import { OperationWizardStep2Page } from './components/dashboard/operaciones/wizard/OperationWizardStep2Page';
import { OperationWizardStep3Page } from './components/dashboard/operaciones/wizard/OperationWizardStep3Page';
import { OperationDetailPage } from './components/dashboard/operaciones/OperationDetailPage';
import {
  TreasuryMovementsPage,
  LinkedBalancesPage,
  GlobalBalancesPage,
  ContactBalanceDetailPage,
  PendingReceptionsPage,
} from './components/dashboard/tesoreria';
import {
  TransferPesosFlow,
  TransferPesosBuilderPage,
  TransferPesosConfirmPage,
  TransferPesosSuccessPage,
  TransferPesosDetailPage,
} from './components/dashboard/operaciones/transfer';
import { LogisticaPage } from './components/dashboard/logistica/LogisticaPage';
import { LogisticsGeneralSummaryPage } from './components/dashboard/logistica/LogisticsGeneralSummaryPage';
import { MovementDetailPage } from './components/dashboard/logistica/MovementDetailPage';
import { IncidentDetailPage } from './components/dashboard/logistica/IncidentDetailPage';
import { ResolvedIncidentDetailPage } from './components/dashboard/logistica/ResolvedIncidentDetailPage';
import { LogisticsOrderDetailPage } from './components/dashboard/logistica/LogisticsOrderDetailPage';
import { LocationSearchPage } from './components/location/LocationSearchPage';
import ErrorBoundary from './components/ErrorBoundary';
import SessionTimeoutManager from './components/SessionTimeoutManager';
import { prefetchCsrfToken } from './utils/api';
import { devPerformanceUtils } from './utils/performanceMonitor';
import { AccountSettingsPage, ProfilePage } from './components/dashboard/settings';

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
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
