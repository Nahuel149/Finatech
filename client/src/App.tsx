import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Register } from './components';
import { LoginPage } from './components/login/LoginPage';
import { RecoveryPage } from './components/recover';
import { DashboardOperacionesPage } from './components/dashboard/operaciones/DashboardOperacionesPage';
import { OperationWizardStep1Page } from './components/dashboard/operaciones/wizard/OperationWizardStep1Page';
import { OperationWizardStep2Page } from './components/dashboard/operaciones/wizard/OperationWizardStep2Page';
import { OperationWizardStep3Page } from './components/dashboard/operaciones/wizard/OperationWizardStep3Page';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recover" element={<RecoveryPage />} />
          <Route path="/dashboard" element={<DashboardOperacionesPage />} />
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
