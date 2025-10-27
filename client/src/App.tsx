import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Register } from './components';
import { LoginPage } from './components/login/LoginPage';
import { VerifyEmailPage } from './components/login/VerifyEmailPage';
import { RecoveryPage } from './components/recover';
import { DashboardOperacionesPage } from './components/dashboard/operaciones/DashboardOperacionesPage';
import { NotificationsPage } from './components/dashboard/operaciones/NotificationsPage';
import { OperationWizardStep1Page } from './components/dashboard/operaciones/wizard/OperationWizardStep1Page';
import { OperationWizardStep2Page } from './components/dashboard/operaciones/wizard/OperationWizardStep2Page';
import { OperationWizardStep3Page } from './components/dashboard/operaciones/wizard/OperationWizardStep3Page';
import {
  TreasuryMovementsPage,
  LinkedBalancesPage,
  GlobalBalancesPage,
  ContactBalanceDetailPage,
} from './components/dashboard/tesoreria';
import {
  TransferPesosFlow,
  TransferPesosBuilderPage,
  TransferPesosConfirmPage,
  TransferPesosSuccessPage,
} from './components/dashboard/operaciones/transfer';
import { LogisticaPage } from './components/dashboard/logistica/LogisticaPage';
import { LogisticsGeneralSummaryPage } from './components/dashboard/logistica/LogisticsGeneralSummaryPage';
import { MovementDetailPage } from './components/dashboard/logistica/MovementDetailPage';
import { IncidentDetailPage } from './components/dashboard/logistica/IncidentDetailPage';
import { ResolvedIncidentDetailPage } from './components/dashboard/logistica/ResolvedIncidentDetailPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recover" element={<RecoveryPage />} />
          <Route path="/dashboard" element={<DashboardOperacionesPage />} />
          <Route path="/dashboard/notificaciones" element={<NotificationsPage />} />
          <Route path="/dashboard/logistica" element={<LogisticaPage />} />
          <Route path="/dashboard/logistica/resumen-general" element={<LogisticsGeneralSummaryPage />} />
          <Route path="/dashboard/logistica/movimiento/:movementId" element={<MovementDetailPage />} />
          <Route path="/dashboard/logistica/incidencia/:incidentId" element={<IncidentDetailPage />} />
          <Route path="/dashboard/logistica/incidencia-resuelta/:incidentId" element={<ResolvedIncidentDetailPage />} />
          <Route path="/dashboard/tesoreria" element={<TreasuryMovementsPage />} />
          <Route path="/dashboard/tesoreria/saldos" element={<GlobalBalancesPage />} />
          <Route path="/dashboard/tesoreria/saldos/vinculados" element={<LinkedBalancesPage />} />
          <Route
            path="/dashboard/tesoreria/saldos/contacto/:contactId"
            element={<ContactBalanceDetailPage />}
          />
          <Route
            path="/dashboard/tesoreria/movimientos/:movementId"
            element={<TreasuryMovementsPage />}
          />
          <Route path="/dashboard/operaciones/transfer-pesos" element={<TransferPesosFlow />}>
            <Route index element={<TransferPesosBuilderPage />} />
            <Route path="confirmacion" element={<TransferPesosConfirmPage />} />
            <Route path="completada" element={<TransferPesosSuccessPage />} />
          </Route>
          <Route path="/dashboard/operaciones/nueva" element={<OperationWizardStep1Page />} />
          <Route path="/dashboard/operaciones/nueva/liquidacion" element={<OperationWizardStep2Page />} />
          <Route path="/dashboard/operaciones/nueva/resumen" element={<OperationWizardStep3Page />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
