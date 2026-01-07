This file is a merged representation of a subset of the codebase, containing specifically included files and files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed, content has been compressed (code blocks are separated by ⋮---- delimiter).

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: client/src/**/*.ts, client/src/**/*.tsx, client/src/**/*.js, client/src/**/*.jsx, src/**/*.js, src/**/*.ts, package*.json, tsconfig*.json
- Files matching these patterns are excluded: client/node_modules, client/build, node_modules, dist, .next, .cache, **/*.map, **/*.snap
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Content has been compressed - code blocks are separated by ⋮---- delimiter

# Directory Structure
```
client/
client/public/
client/src/
client/src/components/
client/src/components/clients/
client/src/components/dashboard/
client/src/components/dashboard/logistica/
client/src/components/dashboard/operaciones/
client/src/components/dashboard/operaciones/transfer/
client/src/components/dashboard/operaciones/wizard/
client/src/components/dashboard/tesoreria/
client/src/components/dashboard/tesoreria/contact/
client/src/components/dashboard/tesoreria/detail/
client/src/components/dashboard/tesoreria/global/
client/src/components/dashboard/tesoreria/linked/
client/src/components/dashboard/tesoreria/reconciliation/
client/src/components/dashboard/tesoreria/register/
client/src/components/icons/
client/src/components/login/
client/src/components/recover/
client/src/components/shared/
client/src/components/shared/design-system/
client/src/components/ui/
client/src/hooks/
client/src/hooks/dashboard/
client/src/types/
client/src/utils/
docs/
html-examples-dont-touch/
scripts/
src/
src/config/
src/controllers/
src/middleware/
src/models/
src/routes/
src/services/
src/utils/
tests/
tests/unit/
tests/unit/services/
.env.example
.eslintrc.cjs
.gitignore
AGENTS.md
client/package.json
client/postcss.config.js
client/public/index.html
client/src/App.tsx
client/src/components/clients/NewClientModal.tsx
client/src/components/dashboard/logistica/AssociationsDocumentsForm.tsx
client/src/components/dashboard/logistica/AttachmentsForm.tsx
client/src/components/dashboard/logistica/CompletionConfirmationModal.tsx
client/src/components/dashboard/logistica/FilterPanel.tsx
client/src/components/dashboard/logistica/GeneralSummarySection.tsx
client/src/components/dashboard/logistica/IncidentAssociationsForm.tsx
client/src/components/dashboard/logistica/IncidentDetailPage.tsx
client/src/components/dashboard/logistica/IncidentDetailSidePanel.tsx
client/src/components/dashboard/logistica/IncidentDocumentsSection.tsx
client/src/components/dashboard/logistica/IncidentFileUpload.tsx
client/src/components/dashboard/logistica/incidentFormTypes.ts
client/src/components/dashboard/logistica/IncidentGeneralInfoForm.tsx
client/src/components/dashboard/logistica/IncidentItemsSection.tsx
client/src/components/dashboard/logistica/IncidentItemsTable.tsx
client/src/components/dashboard/logistica/IncidentRegistrationModal.tsx
client/src/components/dashboard/logistica/IncidentSeveritySelector.tsx
client/src/components/dashboard/logistica/IncidentSummarySection.tsx
client/src/components/dashboard/logistica/IncidentTimelineSection.tsx
client/src/components/dashboard/logistica/index.ts
client/src/components/dashboard/logistica/ItemsBulkForm.tsx
client/src/components/dashboard/logistica/LogisticaPage.tsx
client/src/components/dashboard/logistica/LogisticaPanel.tsx
client/src/components/dashboard/logistica/LogisticaPanelHeader.tsx
client/src/components/dashboard/logistica/LogisticsActiveIncidentsSection.tsx
client/src/components/dashboard/logistica/LogisticsGeneralSummaryHeader.tsx
client/src/components/dashboard/logistica/LogisticsGeneralSummaryPage.tsx
client/src/components/dashboard/logistica/LogisticsOperationsSection.tsx
client/src/components/dashboard/logistica/LogisticsQuickActionsSection.tsx
client/src/components/dashboard/logistica/LogisticsRecentMovementsSection.tsx
client/src/components/dashboard/logistica/LogisticsSummaryStatsSection.tsx
client/src/components/dashboard/logistica/MovementDataForm.tsx
client/src/components/dashboard/logistica/MovementDetailPage.tsx
client/src/components/dashboard/logistica/MovementDetailSidePanel.tsx
client/src/components/dashboard/logistica/NewMovementModal.tsx
client/src/components/dashboard/logistica/OperationDetailPanel.tsx
client/src/components/dashboard/logistica/ResolvedIncidentDetailPage.tsx
client/src/components/dashboard/logistica/ResolvedIncidentDetailSidePanel.tsx
client/src/components/dashboard/logistica/ResolvedIncidentResolutionSection.tsx
client/src/components/dashboard/logistica/ResolvedIncidentSummarySection.tsx
client/src/components/dashboard/logistica/ResolvedIncidentTimelineSection.tsx
client/src/components/dashboard/logistica/TreasuryIntegrationSection.tsx
client/src/components/dashboard/operaciones/BalanceStripe.tsx
client/src/components/dashboard/operaciones/DashboardBalanceWidget.tsx
client/src/components/dashboard/operaciones/DashboardOperacionesPage.tsx
client/src/components/dashboard/operaciones/FlowShortcuts.tsx
client/src/components/dashboard/operaciones/Footer.tsx
client/src/components/dashboard/operaciones/index.ts
client/src/components/dashboard/operaciones/Navbar.tsx
client/src/components/dashboard/operaciones/NotificationsPage.tsx
client/src/components/dashboard/operaciones/OperationDetailPage.tsx
client/src/components/dashboard/operaciones/OperationsHeader.tsx
client/src/components/dashboard/operaciones/RecentOperationsTable.tsx
client/src/components/dashboard/operaciones/RecentValidations.tsx
client/src/components/dashboard/operaciones/transfer/index.ts
client/src/components/dashboard/operaciones/transfer/TransferAccountingPanel.tsx
client/src/components/dashboard/operaciones/transfer/TransferPesosBuilderPage.tsx
client/src/components/dashboard/operaciones/transfer/TransferPesosConfirmPage.tsx
client/src/components/dashboard/operaciones/transfer/TransferPesosContext.tsx
client/src/components/dashboard/operaciones/transfer/TransferPesosDetailPage.tsx
client/src/components/dashboard/operaciones/transfer/TransferPesosFlow.tsx
client/src/components/dashboard/operaciones/transfer/TransferPesosSuccessPage.tsx
client/src/components/dashboard/operaciones/transfer/utils.ts
client/src/components/dashboard/operaciones/TransferPesosModal.tsx
client/src/components/dashboard/operaciones/wizard/AmountSection.tsx
client/src/components/dashboard/operaciones/wizard/AssetSelection.tsx
client/src/components/dashboard/operaciones/wizard/CancelOperationModal.tsx
client/src/components/dashboard/operaciones/wizard/ClientSelection.tsx
client/src/components/dashboard/operaciones/wizard/CompletionSuccessState.tsx
client/src/components/dashboard/operaciones/wizard/CompoundSettlementForm.tsx
client/src/components/dashboard/operaciones/wizard/ExchangeRatesSection.tsx
client/src/components/dashboard/operaciones/wizard/FinalValidationChecklist.tsx
client/src/components/dashboard/operaciones/wizard/index.ts
client/src/components/dashboard/operaciones/wizard/MarginIndicator.tsx
client/src/components/dashboard/operaciones/wizard/OperationSummary.tsx
client/src/components/dashboard/operaciones/wizard/OperationTypeSelector.tsx
client/src/components/dashboard/operaciones/wizard/OperationWizardStep1Page.tsx
client/src/components/dashboard/operaciones/wizard/OperationWizardStep2Page.tsx
client/src/components/dashboard/operaciones/wizard/OperationWizardStep3Page.tsx
client/src/components/dashboard/operaciones/wizard/SettlementModeSelector.tsx
client/src/components/dashboard/operaciones/wizard/SettlementProgress.tsx
client/src/components/dashboard/operaciones/wizard/SimpleSettlementForm.tsx
client/src/components/dashboard/operaciones/wizard/ValidationChecklist.tsx
client/src/components/dashboard/operaciones/wizard/VoidOperationModal.tsx
client/src/components/dashboard/operaciones/wizard/WizardActions.tsx
client/src/components/dashboard/operaciones/wizard/WizardCompleteSummary.tsx
client/src/components/dashboard/operaciones/wizard/WizardHeader.tsx
client/src/components/dashboard/tesoreria/contact/ContactBalanceDetailPage.tsx
client/src/components/dashboard/tesoreria/contact/ContactFilters.tsx
client/src/components/dashboard/tesoreria/contact/ContactOperationsTable.tsx
client/src/components/dashboard/tesoreria/contact/ContactSummaryCard.tsx
client/src/components/dashboard/tesoreria/contact/index.ts
client/src/components/dashboard/tesoreria/detail/AccountingImpactCard.tsx
client/src/components/dashboard/tesoreria/detail/ContactInfoCard.tsx
client/src/components/dashboard/tesoreria/detail/index.ts
client/src/components/dashboard/tesoreria/detail/LinkedOperationCard.tsx
client/src/components/dashboard/tesoreria/detail/MovementDetailPanel.tsx
client/src/components/dashboard/tesoreria/detail/MovementDetailSkeleton.tsx
client/src/components/dashboard/tesoreria/detail/MovementSummaryCard.tsx
client/src/components/dashboard/tesoreria/global/GlobalBalancesFilters.tsx
client/src/components/dashboard/tesoreria/global/GlobalBalancesPage.tsx
client/src/components/dashboard/tesoreria/global/GlobalBalancesSummaryCards.tsx
client/src/components/dashboard/tesoreria/global/GlobalBalancesTable.tsx
client/src/components/dashboard/tesoreria/global/index.ts
client/src/components/dashboard/tesoreria/index.ts
client/src/components/dashboard/tesoreria/linked/index.ts
client/src/components/dashboard/tesoreria/linked/LinkedBalanceDetailPanel.tsx
client/src/components/dashboard/tesoreria/linked/LinkedBalancesAccountingSection.tsx
client/src/components/dashboard/tesoreria/linked/LinkedBalancesMovementsSection.tsx
client/src/components/dashboard/tesoreria/linked/LinkedBalancesPage.tsx
client/src/components/dashboard/tesoreria/linked/LinkedBalancesSummarySection.tsx
client/src/components/dashboard/tesoreria/reconciliation/index.ts
client/src/components/dashboard/tesoreria/reconciliation/ReconciliationFilters.tsx
client/src/components/dashboard/tesoreria/reconciliation/ReconciliationModal.tsx
client/src/components/dashboard/tesoreria/reconciliation/ReconciliationMovementsPanel.tsx
client/src/components/dashboard/tesoreria/reconciliation/ReconciliationOperationsTable.tsx
client/src/components/dashboard/tesoreria/reconciliation/ReconciliationSummary.tsx
client/src/components/dashboard/tesoreria/register/AttachmentList.tsx
client/src/components/dashboard/tesoreria/register/index.ts
client/src/components/dashboard/tesoreria/register/MovementTypeSelector.tsx
client/src/components/dashboard/tesoreria/register/RegisterMovementModal.tsx
client/src/components/dashboard/tesoreria/TreasuryBalanceStripe.tsx
client/src/components/dashboard/tesoreria/TreasuryFilters.tsx
client/src/components/dashboard/tesoreria/TreasuryHeader.tsx
client/src/components/dashboard/tesoreria/TreasuryMovementsPage.tsx
client/src/components/dashboard/tesoreria/TreasuryMovementsTable.tsx
client/src/components/dashboard/tesoreria/TreasuryNavbar.tsx
client/src/components/ErrorBoundary.tsx
client/src/components/Header.tsx
client/src/components/icons/HeroiconsOutline.tsx
client/src/components/index.ts
client/src/components/login/GoogleLoginButton.tsx
client/src/components/login/index.ts
client/src/components/login/LoginForm.tsx
client/src/components/login/LoginPage.tsx
client/src/components/login/MinimalHeader.tsx
client/src/components/login/TwoFactorModal.tsx
client/src/components/login/VerifyEmailPage.tsx
client/src/components/recover/index.ts
client/src/components/recover/MinimalHeader.tsx
client/src/components/recover/PasswordResetForm.tsx
client/src/components/recover/RecoveryPage.tsx
client/src/components/recover/RecoveryRequestForm.tsx
client/src/components/Register.tsx
client/src/components/shared/design-system/BalanceCard.tsx
client/src/components/shared/design-system/Button.tsx
client/src/components/shared/design-system/index.ts
client/src/components/shared/design-system/LoadingSkeleton.tsx
client/src/components/shared/design-system/StatusIndicator.tsx
client/src/components/ui/Alert.tsx
client/src/components/ui/Button.tsx
client/src/components/ui/index.ts
client/src/components/ui/Input.tsx
client/src/components/ui/LoadingSpinner.tsx
client/src/components/ui/Modal.tsx
client/src/components/ui/PasswordRequirements.tsx
client/src/hooks/dashboard/index.ts
client/src/hooks/dashboard/useCancelTreasuryMovement.ts
client/src/hooks/dashboard/useClientSearch.ts
client/src/hooks/dashboard/useClientsList.ts
client/src/hooks/dashboard/useCompensateTreasuryMovement.ts
client/src/hooks/dashboard/useContactBalanceDetail.ts
client/src/hooks/dashboard/useCreateTransfer.ts
client/src/hooks/dashboard/useCreateTreasuryMovement.ts
client/src/hooks/dashboard/useDashboardBalances.ts
client/src/hooks/dashboard/useDashboardNotifications.ts
client/src/hooks/dashboard/useGlobalBalancesOverview.ts
client/src/hooks/dashboard/useLatestMarketRate.ts
client/src/hooks/dashboard/useLinkedBalanceDetail.ts
client/src/hooks/dashboard/useLinkedTreasuryBalances.ts
client/src/hooks/dashboard/useLogisticsOperations.ts
client/src/hooks/dashboard/useOperationSearch.ts
client/src/hooks/dashboard/useReconciliationSuggestions.ts
client/src/hooks/dashboard/useTransactionDraft.ts
client/src/hooks/dashboard/useTransferOperations.ts
client/src/hooks/dashboard/useTreasuryBalances.ts
client/src/hooks/dashboard/useTreasuryMovement.ts
client/src/hooks/dashboard/useTreasuryMovements.ts
client/src/hooks/index.ts
client/src/hooks/useApi.ts
client/src/hooks/useAuth.ts
client/src/hooks/useClientDetail.ts
client/src/hooks/useConfig.ts
client/src/hooks/useCreateClient.ts
client/src/hooks/useCurrentUser.ts
client/src/hooks/useForm.ts
client/src/hooks/useNotifications.ts
client/src/hooks/useUserPermissions.ts
client/src/index.css
client/src/index.tsx
client/src/types/api.ts
client/src/types/auth.ts
client/src/types/client.ts
client/src/types/dashboard.ts
client/src/types/global.d.ts
client/src/types/index.ts
client/src/types/logistics.ts
client/src/types/transaction.ts
client/src/types/transfer.ts
client/src/types/treasury.ts
client/src/utils/api.ts
client/src/utils/balanceEvents.ts
client/src/utils/index.ts
client/src/utils/infiniteLoopTester.ts
client/src/utils/performanceMonitor.ts
client/src/utils/renderLogger.ts
client/src/utils/useEffectGuard.ts
client/src/utils/validation.ts
client/tailwind.config.js
client/tsconfig.json
docs/MOBILE_RESPONSIVENESS_IMPLEMENTATION.md
docs/MOBILE_TESTING_CHECKLIST.md
docs/navigation-standardization.md
docs/TESTING_PERMISSIONS_CONFIG.md
html-examples-dont-touch/dashboard-operaciones-responsive.html
html-examples-dont-touch/dashboard-operaciones.html
html-examples-dont-touch/login.html
html-examples-dont-touch/logisitica-detallemovimiento.html
html-examples-dont-touch/logistica-detalleincidencia.html
html-examples-dont-touch/logistica-detalleincidenciaresuelta.html
html-examples-dont-touch/logistica-panel.html
html-examples-dont-touch/logistica-panelprincipal.html
html-examples-dont-touch/logistica-registrarnuevomovimiento.html
html-examples-dont-touch/logistica-registroincidencia.html
html-examples-dont-touch/logistica-resumengeneral.html
html-examples-dont-touch/operacion-confirmar.html
html-examples-dont-touch/operacion-distribucionmontos.html
html-examples-dont-touch/operacion-montototal.html
html-examples-dont-touch/PRD.md
html-examples-dont-touch/recover.html
html-examples-dont-touch/saldos-detallecontactos.html
html-examples-dont-touch/saldos-vistageneral.html
html-examples-dont-touch/tesoreria-conciliacion.html
html-examples-dont-touch/tesoreria-detallemovimientos.html
html-examples-dont-touch/tesoreria-listadomovimientos.html
html-examples-dont-touch/tesoreria-registromanual.html
html-examples-dont-touch/tesoreria-saldos-cuentasvinculadas.html
html-examples-dont-touch/transferencia-confirmacion-panellateral.html
html-examples-dont-touch/transferencia-pesos-confirmaciondeoperacion.html
html-examples-dont-touch/transferencia-pesos-registradacorrectamente.html
html-examples-dont-touch/transferencia-pesos.html
html-examples-dont-touch/wizardstep1.html
html-examples-dont-touch/wizardstep2.html
html-examples-dont-touch/wizardstep3.html
nodemon.json
package.json
playwright.config.ts
problems.md
scripts/generate-import-graph.js
src/app.js
src/config/database.js
src/controllers/auth.controller.js
src/controllers/client.controller.js
src/controllers/currentAccount.controller.js
src/controllers/geocoding.controller.js
src/controllers/logistics.controller.js
src/controllers/transaction.controller.js
src/controllers/transfer.controller.js
src/controllers/treasury.controller.js
src/middleware/csrf.js
src/middleware/errorHandler.js
src/middleware/rateLimiter.js
src/middleware/requestLogger.js
src/middleware/requireAuth.js
src/middleware/requirePermission.js
src/middleware/validateRequest.js
src/models/Client.js
src/models/ContactBalance.js
src/models/CurrentAccountBalance.js
src/models/CurrentAccountMovement.js
src/models/LogisticsOperation.js
src/models/MarketRateOverride.js
src/models/Notification.js
src/models/NotificationState.js
src/models/SecurityLog.js
src/models/Session.js
src/models/Transaction.js
src/models/TransferOperation.js
src/models/TreasuryBalance.js
src/models/TreasuryEvent.js
src/models/TreasuryMovement.js
src/models/TwoFactorChallenge.js
src/models/User.js
src/routes/auth.routes.js
src/routes/client.routes.js
src/routes/currentAccount.routes.js
src/routes/dashboard.routes.js
src/routes/geocoding.routes.js
src/routes/logistics.routes.js
src/routes/rates.routes.js
src/routes/transaction.routes.js
src/routes/transfer.routes.js
src/routes/treasury.routes.js
src/server.js
src/services/auth.service.js
src/services/client.service.js
src/services/currentAccount.service.js
src/services/geocoding.service.js
src/services/logistics.service.js
src/services/marketRate.service.js
src/services/securityLog.service.js
src/services/session.service.js
src/services/transaction.service.js
src/services/transactionLifecycle.service.js
src/services/transfer.service.js
src/services/treasury.service.js
src/services/treasuryEvent.service.js
src/utils/AppError.js
src/utils/authCookie.js
src/utils/email.js
src/utils/eventBus.js
src/utils/responseCache.js
src/utils/seedLogisticsOperations.js
src/utils/token.js
tests/unit/services/transaction.service.test.js
tests/unit/services/transactionLifecycle.service.test.js
tsconfig.json
```

# Files

## File: client/src/App.tsx
```typescript
import React, { useEffect } from 'react';
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
import { OperationDetailPage } from './components/dashboard/operaciones/OperationDetailPage';
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
  TransferPesosDetailPage,
} from './components/dashboard/operaciones/transfer';
import { LogisticaPage } from './components/dashboard/logistica/LogisticaPage';
import { LogisticsGeneralSummaryPage } from './components/dashboard/logistica/LogisticsGeneralSummaryPage';
import { MovementDetailPage } from './components/dashboard/logistica/MovementDetailPage';
import { IncidentDetailPage } from './components/dashboard/logistica/IncidentDetailPage';
import { ResolvedIncidentDetailPage } from './components/dashboard/logistica/ResolvedIncidentDetailPage';
import ErrorBoundary from './components/ErrorBoundary';
import { devPerformanceUtils } from './utils/performanceMonitor';
const App: React.FC = () =>
⋮----
const handleKeyPress = (event: KeyboardEvent) =>
```

## File: client/src/components/clients/NewClientModal.tsx
```typescript
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ClientSummary } from '../../types';
import { apiRequest, handleApiError } from '../../utils';
import { Alert } from '../ui/Alert';
export type ClientType = 'client' | 'provider';
export interface AddressSuggestion {
  description: string;
  placeId?: string;
}
export interface AddressDetails {
  formatted: string;
  description?: string;
  placeId?: string;
  street?: string;
  number?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}
export interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (client: ClientSummary) => void;
  defaultType?: ClientType;
  ownerOptions?: string[];
  defaultOwner?: string;
  addressSuggestions?: AddressSuggestion[];
  onSearchAddress?: (term: string) => void;
  onSelectAddress?: (suggestion: AddressSuggestion) => Promise<AddressDetails>;
}
interface FieldErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
  secondaryAddress?: string;
  internalOwner?: string;
  contactType?: string;
}
⋮----
const handleChange = (field: keyof typeof form)
const handleSelectAddress = async (suggestion: AddressSuggestion, target?: 'primary' | 'secondary') =>
const mapFieldErrors = (details?: Array<
const handleSubmit = async (event: FormEvent) =>
⋮----
onChange=
```

## File: client/src/components/dashboard/logistica/AssociationsDocumentsForm.tsx
```typescript
import React, { useMemo, useState } from 'react';
const AssociationsDocumentsForm: React.FC = () =>
⋮----
onChange=
⋮----
// Placeholder action until modal is implemented
```

## File: client/src/components/dashboard/logistica/AttachmentsForm.tsx
```typescript
import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '../../icons/HeroiconsOutline';
interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}
⋮----
const formatFileSize = (bytes: number): string =>
const handleFileSelect = (files: FileList | null) =>
const handleDragOver = (e: React.DragEvent) =>
const handleDragLeave = (e: React.DragEvent) =>
const handleDrop = (e: React.DragEvent) =>
const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
const removeFile = (id: string) =>
const openFileDialog = () =>
```

## File: client/src/components/dashboard/logistica/CompletionConfirmationModal.tsx
```typescript
import React from 'react';
import { CheckCircleIcon, XMarkIcon } from '../../icons/HeroiconsOutline';
interface CompletionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  movementId: string;
  movementType?: string;
  reference?: string;
}
```

## File: client/src/components/dashboard/logistica/FilterPanel.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '../../icons/HeroiconsOutline';
import { DEFAULT_LOGISTICS_FILTERS, LogisticsFilters } from '../../../types';
interface FilterPanelProps {
  isOpen: boolean;
  filters: LogisticsFilters;
  onClose: () => void;
  onApplyFilters?: (filters: LogisticsFilters) => void;
  onClearFilters?: () => void;
  contactOptions?: string[];
  responsibleOptions?: string[];
}
⋮----
const handleInputChange = (field: keyof LogisticsFilters, value: string) =>
const handleApply = () =>
const handleClear = () =>
```

## File: client/src/components/dashboard/logistica/GeneralSummarySection.tsx
```typescript
import React from 'react';
import { LogisticsMetrics } from '../../../types';
interface GeneralSummarySectionProps {
  metrics: LogisticsMetrics | null;
  loading: boolean;
}
⋮----
const resolveTrend = (metrics: LogisticsMetrics | null, key: keyof LogisticsMetrics['trends']) =>
```

## File: client/src/components/dashboard/logistica/IncidentAssociationsForm.tsx
```typescript
import React from 'react';
import { IncidentFormData } from './incidentFormTypes';
import { IncidentItemsTable } from './IncidentItemsTable';
import { IncidentFileUpload } from './IncidentFileUpload';
interface IncidentAssociationsFormProps {
  formData: IncidentFormData;
  onFormDataChange: (updates: Partial<IncidentFormData>) => void;
  movementId: string;
}
export const IncidentAssociationsForm: React.FC<IncidentAssociationsFormProps> = ({
  formData,
  onFormDataChange,
  movementId
}) =>
⋮----
const handleItemsChange = (items: IncidentFormData['involvedItems']) =>
const handleAttachmentsChange = (attachments: File[]) =>
```

## File: client/src/components/dashboard/logistica/IncidentDetailPage.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { IncidentDetailSidePanel } from './IncidentDetailSidePanel';
interface IncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';
  reportDate: string;
  resolutionDate?: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  involvedItems: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    status: 'affected' | 'damaged' | 'lost' | 'recovered';
    location: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    uploadedBy: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'resolved' | 'cancelled';
  }>;
}
export const IncidentDetailPage: React.FC = () =>
⋮----
const fetchIncidentData = async () =>
⋮----
// Simulate API call - replace with actual API call
⋮----
// Mock data based on the HTML structure
⋮----
const handleBackToLogistics = () =>
const handleEditIncident = () =>
const handleMarkAsResolved = () =>
const handleCancelIncident = () =>
```

## File: client/src/components/dashboard/logistica/IncidentDetailSidePanel.tsx
```typescript
import React from 'react';
import { XMarkIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '../../icons/HeroiconsOutline';
import { IncidentSummarySection } from './IncidentSummarySection';
import { IncidentTimelineSection } from './IncidentTimelineSection';
import { IncidentItemsSection } from './IncidentItemsSection';
import { IncidentDocumentsSection } from './IncidentDocumentsSection';
interface IncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';
  reportDate: string;
  resolutionDate?: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  involvedItems: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    status: 'affected' | 'damaged' | 'lost' | 'recovered';
    location: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    uploadedBy: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'resolved' | 'cancelled';
  }>;
}
interface IncidentDetailSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentData;
  onEditIncident: () => void;
  onMarkAsResolved: () => void;
  onCancelIncident: () => void;
}
```

## File: client/src/components/dashboard/logistica/IncidentDocumentsSection.tsx
```typescript
import React from 'react';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '../../icons/HeroiconsOutline';
interface IncidentDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  url?: string;
}
interface IncidentDocumentsSectionProps {
  documents: IncidentDocument[];
  onDownload?: (document: IncidentDocument) => void;
  onView?: (document: IncidentDocument) => void;
}
⋮----
const formatDate = (dateString: string) =>
const getFileIcon = (type: string) =>
const handleDownload = (document: IncidentDocument) =>
const handleView = (document: IncidentDocument) =>
⋮----

⋮----
<div className="font-medium text-gray-900">
```

## File: client/src/components/dashboard/logistica/IncidentFileUpload.tsx
```typescript
import React, { useRef, useState } from 'react';
interface IncidentFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}
⋮----
const validateFile = (file: File): string | null =>
const handleFiles = (newFiles: FileList | null) =>
const handleDrop = (e: React.DragEvent) =>
const handleDragOver = (e: React.DragEvent) =>
const handleDragLeave = (e: React.DragEvent) =>
const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) =>
const removeFile = (index: number) =>
const formatFileSize = (bytes: number): string =>
const getFileIcon = (file: File): string =>
⋮----
onClick=
⋮----
e.stopPropagation();
removeFile(index);
```

## File: client/src/components/dashboard/logistica/incidentFormTypes.ts
```typescript
export type IncidentSeverity = 'low' | 'medium' | 'high';
export type IncidentSeverityValue = IncidentSeverity | '';
export interface IncidentOperationalImpact {
  delayedDelivery: boolean;
  requiresManualReview: boolean;
  affectsDocumentation: boolean;
  other: boolean;
  otherDescription: string;
}
export interface IncidentInvolvedItem {
  id: string;
  description: string;
  quantity: number;
  observation: string;
}
export interface IncidentFormData {
  type: string;
  severity: IncidentSeverityValue;
  dateTime: string;
  responsible: string;
  description: string;
  operationalImpact: IncidentOperationalImpact;
  involvedItems: IncidentInvolvedItem[];
  attachments: File[];
}
```

## File: client/src/components/dashboard/logistica/IncidentGeneralInfoForm.tsx
```typescript
import React from 'react';
import { IncidentFormData, IncidentSeverity } from './incidentFormTypes';
import { IncidentSeveritySelector } from './IncidentSeveritySelector';
interface IncidentGeneralInfoFormProps {
  formData: IncidentFormData;
  onFormDataChange: (updates: Partial<IncidentFormData>) => void;
}
⋮----
const handleInputChange = (field: keyof IncidentFormData, value: any) =>
const handleOperationalImpactChange = (field: keyof IncidentFormData['operationalImpact'], value: any) =>
⋮----
onChange=
```

## File: client/src/components/dashboard/logistica/IncidentItemsSection.tsx
```typescript
import React from 'react';
interface IncidentItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unit: string;
  status: 'affected' | 'damaged' | 'lost' | 'recovered';
  location: string;
}
interface IncidentItemsSectionProps {
  items: IncidentItem[];
}
⋮----
const getStatusBadge = (status: string) =>
const getStatusText = (status: string) =>
⋮----
<span className=
```

## File: client/src/components/dashboard/logistica/IncidentItemsTable.tsx
```typescript
import React, { useState } from 'react';
import { IncidentFormData } from './incidentFormTypes';
interface IncidentItemsTableProps {
  items: IncidentFormData['involvedItems'];
  onItemsChange: (items: IncidentFormData['involvedItems']) => void;
}
⋮----
const addItem = () =>
const removeItem = (itemId: string) =>
const updateItem = (itemId: string, field: keyof typeof newItem, value: string | number) =>
⋮----
{/* Add Item Button */}
⋮----
{/* Add Item Form */}
⋮----
{/* Items Table */}
⋮----
onChange=
```

## File: client/src/components/dashboard/logistica/IncidentRegistrationModal.tsx
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentGeneralInfoForm } from './IncidentGeneralInfoForm';
import { IncidentAssociationsForm } from './IncidentAssociationsForm';
import type { IncidentFormData } from './incidentFormTypes';
interface IncidentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementId: string;
}
export const IncidentRegistrationModal: React.FC<IncidentRegistrationModalProps> = ({
  isOpen,
  onClose,
  movementId
}) =>
⋮----
const handleFormDataChange = (updates: Partial<IncidentFormData>) =>
const handleClose = () =>
const handleSaveDraft = async () =>
⋮----
// TODO: Implement save draft functionality
⋮----
const handleRegisterIncident = async () =>
⋮----
// TODO: Implement incident registration API call
⋮----
// Simulate API call
⋮----
// Close modal and navigate back
⋮----
const isFormValid = () =>
⋮----
{/* Modal Header */}
⋮----
{/* Breadcrumbs */}
```

## File: client/src/components/dashboard/logistica/IncidentSeveritySelector.tsx
```typescript
import React from 'react';
import type { IncidentSeverity, IncidentSeverityValue } from './incidentFormTypes';
interface IncidentSeveritySelectorProps {
  value: IncidentSeverityValue;
  onChange: (severity: IncidentSeverity) => void;
}
```

## File: client/src/components/dashboard/logistica/IncidentSummarySection.tsx
```typescript
import React from 'react';
interface IncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';
  reportDate: string;
  resolutionDate?: string;
  responsible: string;
  associatedMovement: string;
}
interface IncidentSummarySectionProps {
  incident: IncidentData;
}
export const IncidentSummarySection: React.FC<IncidentSummarySectionProps> = (
⋮----
const formatDate = (dateString: string) =>
const getSeverityStyles = (severity: string) =>
const getStatusStyles = (status: string) =>
const getSeverityLabel = (severity: string) =>
const getStatusLabel = (status: string) =>
```

## File: client/src/components/dashboard/logistica/IncidentTimelineSection.tsx
```typescript
import React from 'react';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '../../icons/HeroiconsOutline';
interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  date: string;
  user: string;
  type: 'created' | 'updated' | 'resolved' | 'cancelled';
}
interface IncidentTimelineSectionProps {
  history: TimelineEvent[];
}
export const IncidentTimelineSection: React.FC<IncidentTimelineSectionProps> = (
⋮----
const formatDate = (dateString: string) =>
const getTimelineIcon = (type: string) =>
⋮----
const getTimelineColor = (type: string) =>
```

## File: client/src/components/dashboard/logistica/index.ts
```typescript

```

## File: client/src/components/dashboard/logistica/ItemsBulkForm.tsx
```typescript
import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '../../icons/HeroiconsOutline';
interface Item {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
}
⋮----
const addItem = () =>
const removeItem = (id: string) =>
const updateItem = (id: string, field: keyof Item, value: any) =>
⋮----
onChange=
⋮----
updateItem(item.id, 'quantity', Number.parseInt(e.target.value, 10) || 1)
⋮----
updateItem(item.id, 'weight', Number.parseFloat(e.target.value) || undefined)
```

## File: client/src/components/dashboard/logistica/LogisticaPage.tsx
```typescript
import React from 'react';
import { LogisticaPanel } from './LogisticaPanel';
export const LogisticaPage: React.FC = () =>
```

## File: client/src/components/dashboard/logistica/LogisticaPanel.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui';
import { FilterPanel } from './FilterPanel';
import { OperationDetailPanel } from './OperationDetailPanel';
import { LogisticsOperationsSection } from './LogisticsOperationsSection';
import { TreasuryIntegrationSection } from './TreasuryIntegrationSection';
import { GeneralSummarySection } from './GeneralSummarySection';
import NewMovementModal from './NewMovementModal';
import { LogisticsOperation, DEFAULT_LOGISTICS_FILTERS } from '../../../types/logistics';
import { useDashboardBalances } from '../../../hooks';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType, Button } from '../../shared/design-system';
import { TreasuryBalance, ApiError } from '../../../types';
type ToastState = {
  type: 'success' | 'info';
  message: string;
};
⋮----
interface LogisticsBalanceStripeProps {
  onBalanceClick?: () => void;
  balances: TreasuryBalance[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
  mapBalanceToCardData: (balance: TreasuryBalance) => BalanceCardData;
}
⋮----
const handleShowTooltip = () =>
const handleHideTooltip = () =>
⋮----
data=
⋮----
const navigate = useNavigate();
⋮----
const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
⋮----
const [toast, setToast] = useState<ToastState | null>(null);
// Add dashboard balances hook for mobile layout
⋮----
navigate('/dashboard/tesoreria/saldos');
⋮----
const handleFilterToggle = () =>
const handleBulkAction = () =>
const handleSelectionChange = (ids: string[]) =>
const handleViewOperation = (operation: LogisticsOperation) =>
const handleCloseDetail = () =>
const handleApplyFilters = (_filters: unknown) =>
const handleClearFilters = () =>
const handleRegisterNewMovement = () =>
const handleCloseNewMovementModal = () =>
```

## File: client/src/components/dashboard/logistica/LogisticaPanelHeader.tsx
```typescript
import React from 'react';
import { ChevronRightIcon, PlusIcon } from '../../icons/HeroiconsOutline';
interface LogisticaPanelHeaderProps {
  onRegisterClick?: () => void;
}
export const LogisticaPanelHeader: React.FC<LogisticaPanelHeaderProps> = (
⋮----
const handleRegisterNewMovement = () =>
```

## File: client/src/components/dashboard/logistica/LogisticsActiveIncidentsSection.tsx
```typescript
import React from 'react';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  ChevronRightIcon,
  FireIcon,
  ShieldExclamationIcon
} from '../../icons/HeroiconsOutline';
interface ActiveIncident {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
  reportedDate: string;
  reportedBy: string;
  assignedTo: string;
  movementId?: string;
  estimatedResolution?: string;
}
interface LogisticsActiveIncidentsSectionProps {
  onIncidentClick: (incidentId: string) => void;
}
⋮----
const getSeverityColor = (severity: string) =>
const getSeverityIcon = (severity: string) =>
const formatDate = (dateString: string) =>
const getTimeAgo = (dateString: string) =>
⋮----
<span className="ml-1">
```

## File: client/src/components/dashboard/logistica/LogisticsGeneralSummaryHeader.tsx
```typescript
import React from 'react';
import { ChevronRightIcon, DocumentChartBarIcon } from '../../icons/HeroiconsOutline';
export const LogisticsGeneralSummaryHeader: React.FC = () =>
```

## File: client/src/components/dashboard/logistica/LogisticsGeneralSummaryPage.tsx
```typescript
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { LogisticsGeneralSummaryHeader } from './LogisticsGeneralSummaryHeader';
import { LogisticsSummaryStatsSection } from './LogisticsSummaryStatsSection';
import { LogisticsRecentMovementsSection } from './LogisticsRecentMovementsSection';
import { LogisticsActiveIncidentsSection } from './LogisticsActiveIncidentsSection';
import { LogisticsQuickActionsSection } from './LogisticsQuickActionsSection';
import { Footer } from '../operaciones/Footer';
interface MovementData {
  id: string;
  date: string;
  type: 'Entrega' | 'Recogida' | 'Transferencia' | 'Devolución';
  origin: string;
  destination: string;
  client: string;
  driver: string;
  status: 'Completado' | 'En tránsito' | 'Pendiente' | 'Cancelado' | 'Con incidencia';
  value: number;
  estimatedTime: string;
  actualTime?: string;
  hasIncident: boolean;
  incidentId?: string;
  notes?: string;
}
interface SummaryStats {
  totalMovements: number;
  pendingMovements: number;
  completedMovements: number;
  totalValue: number;
  activeIncidents: number;
  resolvedIncidents: number;
}
⋮----
// Mock data for summary statistics
⋮----
const handleMovementClick = (movementId: string) =>
const handleCloseDetailPanel = () =>
const handleNavigateToMovementDetail = (movementId: string) =>
const handleNavigateToIncidentDetail = (incidentId: string) =>
const formatCurrency = (amount: number) =>
const formatDateTime = (isoString: string) =>
```

## File: client/src/components/dashboard/logistica/LogisticsOperationsSection.tsx
```typescript
import React from 'react';
import { ApiError, LogisticsOperation } from '../../../types';
interface LogisticsOperationsSectionProps {
  operations: LogisticsOperation[];
  selectedOperations: string[];
  onSelectionChange: (operationIds: string[]) => void;
  onFilterClick: () => void;
  onBulkAction: () => void;
  onViewOperation: (operation: LogisticsOperation) => void;
  totalOperations: number;
  loading: boolean;
  error: ApiError | null;
  onRetry?: () => void;
}
⋮----
const formatDateTime = (iso?: string) =>
const formatAmount = (amount: number | null, currency: string) =>
⋮----
const handleSelectAll = () =>
const handleToggleSelection = (operationId: string) =>
⋮----
checked=
⋮----
event.stopPropagation();
handleToggleSelection(operation.id);
⋮----
onViewOperation(operation);
```

## File: client/src/components/dashboard/logistica/LogisticsQuickActionsSection.tsx
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TruckIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon
} from '../../icons/HeroiconsOutline';
interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  href: string;
  badge?: string;
}
⋮----
const handleActionClick = (href: string) =>
```

## File: client/src/components/dashboard/logistica/LogisticsRecentMovementsSection.tsx
```typescript
import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '../../icons/HeroiconsOutline';
interface MovementData {
  id: string;
  date: string;
  type: 'Entrega' | 'Recogida' | 'Transferencia' | 'Devolución';
  origin: string;
  destination: string;
  client: string;
  driver: string;
  status: 'Completado' | 'En tránsito' | 'Pendiente' | 'Cancelado' | 'Con incidencia';
  value: number;
  estimatedTime: string;
  actualTime?: string;
  hasIncident: boolean;
  incidentId?: string;
}
interface FilterState {
  dateFrom: string;
  dateTo: string;
  movementType: string;
  status: string;
  searchTerm: string;
}
interface LogisticsRecentMovementsSectionProps {
  movements: MovementData[];
  onMovementClick: (movementId: string) => void;
  onIncidentClick?: (incidentId: string) => void;
}
⋮----
const handleSort = (field: keyof MovementData) =>
const handleFilterChange = (key: keyof FilterState, value: string) =>
const clearFilters = () =>
const getStatusIcon = (status: string) =>
const getStatusColor = (status: string) =>
const formatCurrency = (amount: number) =>
const formatDate = (dateString: string) =>
const formatTime = (timeString: string) =>
⋮----
{/* Table */}
⋮----

⋮----
<div className="text-xs text-gray-500">Est:
⋮----
<div className="text-xs text-gray-900">Real:
```

## File: client/src/components/dashboard/logistica/LogisticsSummaryStatsSection.tsx
```typescript
import React from 'react';
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '../../icons/HeroiconsOutline';
interface SummaryStats {
  totalMovements: number;
  pendingMovements: number;
  completedMovements: number;
  totalValue: number;
  activeIncidents: number;
  resolvedIncidents: number;
}
interface LogisticsSummaryStatsSectionProps {
  stats: SummaryStats;
}
interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}
⋮----
const formatCurrency = (amount: number): string =>
const formatNumber = (num: number): string =>
```

## File: client/src/components/dashboard/logistica/MovementDataForm.tsx
```typescript
import React, { useMemo, useState } from 'react';
import { ChevronDownIcon } from '../../icons/HeroiconsOutline';
type MovementTypeValue = 'entrega' | 'transferencia' | 'retiro' | 'custodia';
```

## File: client/src/components/dashboard/logistica/MovementDetailPage.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { MovementDetailSidePanel } from './MovementDetailSidePanel';
import CompletionConfirmationModal from './CompletionConfirmationModal';
import { IncidentRegistrationModal } from './IncidentRegistrationModal';
import { Footer } from '../operaciones/Footer';
interface MovementDetailPageProps {
  movementId?: string;
}
⋮----
// Simulate API call to fetch movement details
⋮----
const handleMarkAsCompleted = () =>
const handleConfirmCompletion = () =>
const handleBackToLogistics = () =>
const handleEditMovement = () =>
const handleCancelMovement = () =>
const handleRegisterIncident = () =>
```

## File: client/src/components/dashboard/logistica/MovementDetailSidePanel.tsx
```typescript
import React, { useMemo } from 'react';
import {
  XMarkIcon,
  DocumentIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
} from '../../icons/HeroiconsOutline';
interface MovementDetailSidePanelProps {
  isOpen: boolean;
  movement: any;
  isLoading: boolean;
  onClose: () => void;
  onMarkAsCompleted: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onRegisterIncident: () => void;
}
⋮----
const getStatusDisplay = (status?: string) =>
const movementTypeIcon = (type?: string) =>
const timelineIconClass = (eventType?: string) =>
const timelineColor = (eventType?: string, isCompleted?: boolean) =>
const formatDate = (iso?: string) =>
const formatCurrency = (amount?: number, currency?: string) =>
```

## File: client/src/components/dashboard/logistica/NewMovementModal.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '../../icons/HeroiconsOutline';
import MovementDataForm from './MovementDataForm';
import AssociationsDocumentsForm from './AssociationsDocumentsForm';
import ItemsBulkForm from './ItemsBulkForm';
import AttachmentsForm from './AttachmentsForm';
import CompletionConfirmationModal from './CompletionConfirmationModal';
interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}
⋮----
// Mantener el orden de Hooks y evitar llamadas condicionales
⋮----
// Habilitar animación de entrada solo cuando el modal está abierto
⋮----
const handleClose = () =>
⋮----
// play exit animation briefly before unmount
⋮----
const handleSaveDraft = () =>
⋮----
// TODO: Implement save draft functionality
⋮----
const handleRegisterMovement = () =>
const handleConfirmRegistration = () =>
⋮----
// TODO: Implement movement registration
⋮----
const handleCloseConfirmation = () =>
⋮----
onClick=
```

## File: client/src/components/dashboard/logistica/OperationDetailPanel.tsx
```typescript
import React from 'react';
import { LogisticsOperation } from '../../../types/logistics';
interface OperationDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  operation: LogisticsOperation | null;
}
const formatAmount = (amount: number | null, currency: string) =>
const formatDateTime = (iso: string)
⋮----
<div className="text-xs text-gray-400 mt-1">
```

## File: client/src/components/dashboard/logistica/ResolvedIncidentDetailPage.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { ResolvedIncidentDetailSidePanel } from './ResolvedIncidentDetailSidePanel';
interface ResolvedIncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'resuelta';
  reportDate: string;
  resolutionDate: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  resolutionDetails: {
    resolutionType: string;
    resolutionDescription: string;
    resolvedBy: string;
    resolutionDate: string;
    followUpActions: string[];
  };
  involvedItems: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    status: 'affected' | 'damaged' | 'lost' | 'recovered';
    location: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    uploadedBy: string;
    status: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'in_review' | 'comment' | 'resolved';
  }>;
}
export const ResolvedIncidentDetailPage: React.FC = () =>
⋮----
const fetchIncidentData = async () =>
⋮----
// Mock data for resolved incident - replace with actual API call
⋮----
const handleSearchChange = (term: string) =>
const handleGoBack = () =>
```

## File: client/src/components/dashboard/logistica/ResolvedIncidentDetailSidePanel.tsx
```typescript
import React from 'react';
import { ResolvedIncidentSummarySection } from './ResolvedIncidentSummarySection';
import { ResolvedIncidentResolutionSection } from './ResolvedIncidentResolutionSection';
import { IncidentItemsSection } from './IncidentItemsSection';
import { IncidentDocumentsSection } from './IncidentDocumentsSection';
import { ResolvedIncidentTimelineSection } from './ResolvedIncidentTimelineSection';
interface ResolvedIncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'resuelta';
  reportDate: string;
  resolutionDate: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  resolutionDetails: {
    resolutionType: string;
    resolutionDescription: string;
    resolvedBy: string;
    resolutionDate: string;
    followUpActions: string[];
  };
  involvedItems: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    status: 'affected' | 'damaged' | 'lost' | 'recovered';
    location: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    uploadedBy: string;
    status: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'in_review' | 'comment' | 'resolved';
  }>;
}
interface ResolvedIncidentDetailSidePanelProps {
  incident: ResolvedIncidentData;
  onGoBack: () => void;
}
```

## File: client/src/components/dashboard/logistica/ResolvedIncidentResolutionSection.tsx
```typescript
import React from 'react';
interface ResolutionDetails {
  resolutionType: string;
  resolutionDescription: string;
  resolvedBy: string;
  resolutionDate: string;
  followUpActions: string[];
}
interface ResolvedIncidentResolutionSectionProps {
  resolutionDetails: ResolutionDetails;
}
⋮----
const formatDate = (dateString: string) =>
```

## File: client/src/components/dashboard/logistica/ResolvedIncidentSummarySection.tsx
```typescript
import React from 'react';
interface ResolvedIncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'resuelta';
  reportDate: string;
  resolutionDate: string;
  responsible: string;
  associatedMovement: string;
}
interface ResolvedIncidentSummarySectionProps {
  incident: ResolvedIncidentData;
}
export const ResolvedIncidentSummarySection: React.FC<ResolvedIncidentSummarySectionProps> = ({
  incident
}) =>
⋮----
const getSeverityColor = (severity: string) =>
const formatDate = (dateString: string) =>
const calculateResolutionTime = (reportDate: string, resolutionDate: string) =>
```

## File: client/src/components/dashboard/logistica/ResolvedIncidentTimelineSection.tsx
```typescript
import React from 'react';
interface ChangeHistoryItem {
  id: string;
  action: string;
  description: string;
  date: string;
  user: string;
  type: 'created' | 'updated' | 'in_review' | 'comment' | 'resolved';
}
interface ResolvedIncidentTimelineSectionProps {
  changeHistory: ChangeHistoryItem[];
}
⋮----
const formatDate = (dateString: string) =>
⋮----
switch (type)
```

## File: client/src/components/dashboard/logistica/TreasuryIntegrationSection.tsx
```typescript
import React from 'react';
export const TreasuryIntegrationSection: React.FC = () => (
  <section id="treasury-integration-section" className="mb-10">
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i className="fa-solid fa-link text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Integración con Tesorería</h3>
            <p className="text-sm text-gray-600">
              Las operaciones completadas generan actualizaciones automáticas en Tesorería y Cuentas Corrientes
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
onClick=
```

## File: client/src/components/dashboard/operaciones/BalanceStripe.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType } from '../../shared/design-system';
const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => (
⋮----
const handleBalanceClick = () =>
⋮----
const handleShowTooltip = () =>
const handleHideTooltip = () =>
⋮----
data=
```

## File: client/src/components/dashboard/operaciones/DashboardBalanceWidget.tsx
```typescript
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { Button } from '../../shared/design-system';
interface Props {
  canView: boolean;
}
⋮----
const handleClick = () =>
const handleShowTooltip = () =>
const handleHideTooltip = () =>
```

## File: client/src/components/dashboard/operaciones/DashboardOperacionesPage.tsx
```typescript
import React, { useState } from 'react';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { OperationsHeader } from './OperationsHeader';
import { FlowShortcuts } from './FlowShortcuts';
import { RecentValidations } from './RecentValidations';
import { RecentOperationsTable } from './RecentOperationsTable';
import { DashboardFooter } from './Footer';
import { TransferPesosModal } from './TransferPesosModal';
export const DashboardOperacionesPage: React.FC = () =>
```

## File: client/src/components/dashboard/operaciones/FlowShortcuts.tsx
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
⋮----
const handleNavigate = (path: string) =>
```

## File: client/src/components/dashboard/operaciones/Footer.tsx
```typescript
import React from 'react';
```

## File: client/src/components/dashboard/operaciones/index.ts
```typescript

```

## File: client/src/components/dashboard/operaciones/Navbar.tsx
```typescript
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  NotificationItem,
  NotificationLevel,
  useNotifications,
  useAuth,
  useCurrentUser,
} from '../../../hooks';
import { ApiError } from '../../../types';
interface Props {
  search: string;
  onSearchChange: (q: string) => void;
}
interface NavItem {
  label: string;
  path: string | null;
  icon: string;
}
⋮----
const formatRelativeTime = (isoDate: string) =>
interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onNotificationClick: (notification: NotificationItem) => void;
  onSeeAll: () => void;
  onMarkAllRead: () => Promise<void> | void;
  className?: string;
  loading?: boolean;
  error?: ApiError | null;
}
⋮----
const location = useLocation();
const navigate = useNavigate();
⋮----
const mobileSearchInputRef = useRef<HTMLInputElement>(null);
const mobileMenuRef = useRef<HTMLDivElement>(null);
const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
⋮----
const desktopNotificationsRef = useRef<HTMLDivElement>(null);
const mobileNotificationsRef = useRef<HTMLDivElement>(null);
const accountMenuRef = useRef<HTMLDivElement>(null);
⋮----
const handleClickOutside = (event: MouseEvent) =>
⋮----
const handleKeyDown = (event: KeyboardEvent) =>
⋮----
const handleSeeAllNotifications = () =>
const handleLogout = async () =>
const openSearchOnMobile = () =>
⋮----
return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-3 py-2 transition-colors cursor-pointer ${
                          isActive
                            ? 'text-primary font-medium border-b-2 border-primary'
                            : 'text-text-primary hover:text-primary'
                        }`}
                      >
                        <i className={`fa-solid ${item.icon} mr-2`} />
                        {item.label}
                      </Link>
                    );
⋮----
src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
```

## File: client/src/components/dashboard/operaciones/NotificationsPage.tsx
```typescript
import React, { useMemo, useState } from 'react';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { DashboardFooter } from './Footer';
import { NotificationItem, useNotifications } from '../../../hooks';
const formatRelativeTime = (isoDate: string) =>
const levelBadgeClass = (level: NotificationItem['level']) =>
```

## File: client/src/components/dashboard/operaciones/OperationDetailPage.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { DashboardFooter } from './Footer';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Alert } from '../../ui/Alert';
import { useTransactionDraft } from '../../../hooks/dashboard';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { formatCurrency, formatDateTime } from './transfer/utils';
import { TransactionAccountingEntry } from '../../../types';
type StatusTone = {
  label: string;
  badgeClass: string;
};
⋮----
const formatPercentage = (value: number | null | undefined) =>
⋮----
const handleBack = () =>
const handleViewContact = () =>
const handleRefresh = () =>
⋮----
<span>Confirmada:
```

## File: client/src/components/dashboard/operaciones/OperationsHeader.tsx
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/design-system';
interface Props {
  onTransferPesos: () => void;
}
export const OperationsHeader: React.FC<Props> = (
⋮----
const handleNuevaOperacion = () =>
const handleTransferirPesos = () =>
const handleVerCuentasCorrientes = () =>
```

## File: client/src/components/dashboard/operaciones/RecentOperationsTable.tsx
```typescript
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransferOperations, useLatestMarketRate } from '../../../hooks';
import { TransferOperation } from '../../../types';
import { Button } from '../../shared/design-system';
interface Props {
  search?: string;
}
interface TableRow {
  id: string;
  dateLabel: string;
  clientName: string;
  clientIdentifier: string;
  clientInitials: string;
  typeLabel: 'Compra' | 'Venta' | 'Liquidación';
  typeClassName: string;
  receivesText: string;
  paysText: string;
  rateLabel: string;
  marginLabel: string;
  marginClassName: string;
  statusLabel: string;
  statusClassName: string;
  isEditable: boolean;
}
⋮----
const formatCurrencyLabel = (amount: number | null | undefined, currency: string) =>
const formatRateLabel = (rate: number | null) =>
const formatDateTime = (iso?: string | null) =>
const getInitials = (name: string) =>
const sumByMethod = (lines: TransferOperation['distributionLines'])
const formatPercentage = (value: number) =>
const getClientName = (operation: TransferOperation) =>
const buildClientIdentifier = (operation: TransferOperation) =>
const getTypeLabel = (operation: TransferOperation): 'Compra' | 'Venta' | 'Liquidación' =>
const computeFinancials = (
  operation: TransferOperation,
  typeLabel: 'Compra' | 'Venta' | 'Liquidación',
  marketRate: number | null
) =>
const calculateMargin = (
  effectiveRate: number | null,
  marketRate: number | null,
  typeLabel: 'Compra' | 'Venta' | 'Liquidación'
) =>
const formatTableRows = (
  operations: TransferOperation[],
  marketRate: number | null
): TableRow[]
⋮----
const handleViewDetail = (operationId: string) =>
const handleEditOperation = (row: TableRow) =>
⋮----
onChange=
```

## File: client/src/components/dashboard/operaciones/RecentValidations.tsx
```typescript
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardNotifications } from '../../../hooks';
import { DashboardNotification } from '../../../types';
const timeAgo = (iso?: string) =>
const severityStyles = (severity?: string) =>
```

## File: client/src/components/dashboard/operaciones/transfer/index.ts
```typescript

```

## File: client/src/components/dashboard/operaciones/transfer/TransferAccountingPanel.tsx
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TransferOperation } from '../../../../types';
import { useCurrentUser } from '../../../../hooks';
import {
  AccountingSummaryEntry,
  formatCurrency,
  formatDateTime,
} from './utils';
interface AccountingSummary {
  timestamp?: string | null;
  entries: AccountingSummaryEntry[];
}
interface Props {
  open: boolean;
  onClose: () => void;
  operation: TransferOperation;
  summary: AccountingSummary;
}
⋮----
```

## File: client/src/components/dashboard/operaciones/transfer/TransferPesosBuilderPage.tsx
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClientSummary,
  MovementDirection,
  MovementMethod,
  MovementType,
} from '../../../../types';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useClientSearch } from '../../../../hooks/dashboard';
import { Alert } from '../../../ui';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency } from './utils';
import { NewClientModal } from '../../../clients/NewClientModal';
import { useLatestMarketRate } from '../../../../hooks/dashboard/useLatestMarketRate';
interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
type BuilderStep = 'config' | 'amount' | 'distribution';
⋮----
const sanitizeAmountInput = (value: string) =>
⋮----
// Handle different decimal separator scenarios
⋮----
// If both comma and dot are present, assume dot is thousands separator and comma is decimal
// Example: 1.234,56 -> 1234.56
⋮----
// Comma is the decimal separator
⋮----
// Dot is the decimal separator
⋮----
// Only comma present - treat as decimal separator
⋮----
// If only dots present, treat as decimal separator (already correct)
⋮----
interface DistributionRowProps {
  lineId: string;
  contactId: string | null;
  contactName: string;
  contactType: string | null;
  cuit: string | null;
  method: MovementMethod;
  amount: number;
  onContactSelect: (client: ClientSummary) => void;
  onClearContact: () => void;
  onMethodChange: (method: MovementMethod) => void;
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
  onRequestNewClient: () => void;
}
⋮----
const handleSelect = (client: ClientSummary) =>
const handleAmountInput = (value: string) =>
⋮----
onChange=
⋮----
onChange={(event) => onMethodChange(event.target.value as MovementMethod)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.entries(METHOD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4 align-top">
        <input
          type="number"
          value={Number.isFinite(amount) ? amount : 0}
          onChange={(event) => handleAmountInput(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          step="0.01"
          min="0"
        />
      </td>
      <td className="px-4 py-4 align-top text-right">
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-danger hover:text-red-700"
        >
          <i className="fa-solid fa-trash" />
        </button>
      </td>
    </tr>
  );
⋮----
const navigate = useNavigate();
const [searchParams, setSearchParams] = useSearchParams();
const currentStepParam = searchParams.get('step');
⋮----
// Prevent multiple decimal separators
⋮----
// If user is typing and there are multiple decimal separators, keep only the last one
⋮----
// Limit decimal places to 2
⋮----
// Only treat as decimal if it's the last dot and there are 1-2 digits after it
⋮----
const validateAmountValue = () =>
const handleAmountBlur = () =>
const handleAmountContinue = () =>
const handleContinueFromConfig = () =>
const handleAddLine = () =>
const handleClientCreated = (newClient: ClientSummary) =>
const handleCloseClientModal = () =>
const handleOpenConfirm = () =>
const handleCancel = () =>
const handleSaveDraft = async () =>
⋮----
Detalle:
⋮----
<> ·
⋮----
setLineContact(line.id,
⋮----
```

## File: client/src/components/dashboard/operaciones/transfer/TransferPesosConfirmPage.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../ui';
import { useCreateTransfer } from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency } from './utils';
import { useLatestMarketRate } from '../../../../hooks/dashboard/useLatestMarketRate';
interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
⋮----
const handleBack = () =>
const handleSaveDraft = async () =>
const handleConfirm = async () =>
⋮----
<DashboardNavbar search="" onSearchChange=
```

## File: client/src/components/dashboard/operaciones/transfer/TransferPesosContext.tsx
```typescript
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  MovementDirection,
  MovementMethod,
  MovementType,
  TransferDistributionLineInput,
  TransferOperation,
} from '../../../../types';
export interface TransferDraftLine {
  id: string;
  contactId: string | null;
  contactName: string;
  contactType: string | null;
  cuit: string | null;
  method: MovementMethod;
  amount: number;
}
export interface TransferDraftState {
  movementType: MovementType | null;
  direction: MovementDirection | null;
  totalAmount: number;
  distributionLines: TransferDraftLine[];
}
interface TransferPesosContextValue {
  draft: TransferDraftState;
  lastOperation: TransferOperation | null;
  setMovementType: (movementType: MovementType) => void;
  setDirection: (direction: MovementDirection) => void;
  setTotalAmount: (amount: number) => void;
  addLine: () => void;
  updateLineAmount: (lineId: string, amount: number) => void;
  updateLineMethod: (lineId: string, method: MovementMethod) => void;
  setLineContact: (
    lineId: string,
    payload: {
      contactId: string;
      contactName: string;
      contactType: string | null;
      cuit: string | null;
    }
  ) => void;
  removeLine: (lineId: string) => void;
  reset: () => void;
  setLastOperation: (operation: TransferOperation | null) => void;
  toPayload: () => TransferDistributionLineInput[] | null;
  saveDraft: () => Promise<boolean>;
  loadDraft: () => boolean;
  hasSavedDraft: () => boolean;
  clearSavedDraft: () => void;
}
⋮----
const generateLineId = () =>
export const TransferPesosProvider: React.FC<
export const useTransferPesos = () =>
```

## File: client/src/components/dashboard/operaciones/transfer/TransferPesosDetailPage.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../../ui';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { apiRequest, handleApiError } from '../../../../utils/api';
import {
  ApiError,
  TransferOperation,
} from '../../../../types';
import {
  buildAccountingEntries,
  formatCurrency,
  formatDateTime,
} from './utils';
import { TransferAccountingPanel } from './TransferAccountingPanel';
⋮----
<DashboardNavbar search="" onSearchChange=
```

## File: client/src/components/dashboard/operaciones/transfer/TransferPesosFlow.tsx
```typescript
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TransferPesosProvider } from './TransferPesosContext';
```

## File: client/src/components/dashboard/operaciones/transfer/TransferPesosSuccessPage.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useTransferPesos } from './TransferPesosContext';
import { emitDashboardBalanceRefresh } from '../../../../utils';
import { TransferAccountingPanel } from './TransferAccountingPanel';
import { buildAccountingEntries } from './utils';
⋮----
const handleViewDetail = () =>
const handleNewTransfer = () =>
const handleBackToOperations = () =>
⋮----
<DashboardNavbar search="" onSearchChange=
```

## File: client/src/components/dashboard/operaciones/transfer/utils.ts
```typescript
import { TransferOperation } from '../../../../types';
export const formatCurrency = (amount: number, currency: string = 'ARS')
export const formatDateTime = (iso?: string | null) =>
⋮----
export type AccountingSummaryEntry = {
  label: string;
  currency: string;
  amount: number;
  sign: 1 | -1;
  contact: string | null;
  originalAmount?: number;
  originalCurrency?: string | null;
};
export const buildAccountingEntries = (operation: TransferOperation): AccountingSummaryEntry[] =>
```

## File: client/src/components/dashboard/operaciones/TransferPesosModal.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useClientSearch, useCreateTransfer } from '../../../hooks';
import { CreateTransferResponse, MovementDirection, MovementMethod } from '../../../types';
import { Button } from '../../shared/design-system';
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (resp: CreateTransferResponse) => void;
}
interface LineState {
  contactId?: string;
  contactName?: string | null;
  method: MovementMethod;
  amount: string;
  query: string;
}
⋮----
const addLine = () => setLines((prev) => [...prev,
const removeLine = (idx: number)
const pickSuggestion = (idx: number, contactId: string, contactName: string | null) =>
const handleSubmit = async (e: React.FormEvent) =>
⋮----
onChange=
⋮----
setLines((prev) => prev.map((l, i) => (i === idx ?
setQuery(q);
```

## File: client/src/components/dashboard/operaciones/wizard/AmountSection.tsx
```typescript
import React from 'react';
interface Props {
  enterAmount: number;
  onEnterAmountChange: (value: number) => void;
  exitAmount: number;
  enterLabel: string;
  exitLabel: string;
  disabled?: boolean;
}
const numberToInputValue = (value: number)
⋮----
const handleFocus = (event: React.FocusEvent<HTMLInputElement>) =>
```

## File: client/src/components/dashboard/operaciones/wizard/AssetSelection.tsx
```typescript
import React from 'react';
export interface AssetOption {
  code: string;
  label: string;
}
interface Props {
  enterValue: string;
  exitValue: string;
  enterOptions: AssetOption[];
  exitOptions: AssetOption[];
  onEnterChange: (value: string) => void;
  onExitChange: (value: string) => void;
  enterLabel?: string;
  exitLabel?: string;
  disabled?: boolean;
}
⋮----
onChange=
```

## File: client/src/components/dashboard/operaciones/wizard/CancelOperationModal.tsx
```typescript
import React from 'react';
import { Modal } from '../../../ui/Modal';
interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

## File: client/src/components/dashboard/operaciones/wizard/ClientSelection.tsx
```typescript
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClientSummary } from '../../../../types';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
interface Props {
  value: string;
  onChange: (value: string) => void;
  clients: ClientSummary[];
  onNewClient: () => void;
  marginInfo?: string;
  loading?: boolean;
  error?: string | null;
  onSearch?: (term: string) => void;
}
const renderOptionLabel = (client: ClientSummary) =>
⋮----
const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
const handleSelectClient = (client: ClientSummary) =>
const handleBlur = () =>
⋮----
Seleccionado:
```

## File: client/src/components/dashboard/operaciones/wizard/CompletionSuccessState.tsx
```typescript
import React from 'react';
const SummaryItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);
interface Props {
  operationCode: string;
  onViewDetails: () => void;
  onBackToOperations: () => void;
  onNewOperation: () => void;
  onExportPDF: () => void;
  onDuplicate: () => void;
  onVoid?: () => void;
  canVoid?: boolean;
  clientName: string;
  clientDocument?: string | null;
  operationType: 'buy' | 'sell';
  settlementMode: 'simple' | 'compound';
  incomingAmountLabel: string;
  incomingAssetLabel: string;
  outgoingAmountLabel: string;
  outgoingAssetLabel: string;
  operationRate: number;
}
```

## File: client/src/components/dashboard/operaciones/wizard/CompoundSettlementForm.tsx
```typescript
import React from 'react';
export interface CompoundLine {
  id: string;
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number;
}
export interface CompoundComputed {
  percentage: number;
  amount: number;
}
interface Props {
  lines: CompoundLine[];
  computed: Record<string, CompoundComputed>;
  methods: string[];
  onLineChange: (id: string, changes: Partial<CompoundLine>) => void;
  onRemoveLine: (id: string) => void;
  onAddLine: () => void;
  baseCurrencyLabel: string;
  disabled?: boolean;
  formatAmount: (amount: number) => string;
}
⋮----
onChange=
⋮----
value=
```

## File: client/src/components/dashboard/operaciones/wizard/ExchangeRatesSection.tsx
```typescript
import React from 'react';
interface Props {
  arsRate: number;
  onArsRateChange: (value: number) => void;
  arsMarketRate: number;
  onArsMarketRateChange: (value: number) => void;
  assetRate: number;
  onAssetRateChange: (value: number) => void;
  assetMarketRate: number;
  assetLabel: string;
  showSecondaryRates?: boolean;
  canEditMarketRate?: boolean;
  useCustomMarketRate?: boolean;
  onToggleMarketRateMode?: (enabled: boolean) => void;
  disabled?: boolean;
}
const numberToInputValue = (value: number)
```

## File: client/src/components/dashboard/operaciones/wizard/FinalValidationChecklist.tsx
```typescript
import React from 'react';
export interface ValidationItem {
  label: string;
  hint?: string;
  tooltip?: string;
  passed: boolean;
}
interface Props {
  items: ValidationItem[];
}
```

## File: client/src/components/dashboard/operaciones/wizard/index.ts
```typescript

```

## File: client/src/components/dashboard/operaciones/wizard/MarginIndicator.tsx
```typescript
import React from 'react';
interface Props {
  marginPercent: number;
  marketRate: number;
  operationType: 'buy' | 'sell';
  loading?: boolean;
}
const formatPercent = (value: number) =>
⋮----
// Colores según las reglas: verde si margen ≥ 0; rojo si < 0
```

## File: client/src/components/dashboard/operaciones/wizard/OperationSummary.tsx
```typescript
import React from 'react';
interface OperationSummaryProps {
  clientName?: string;
  operationLabel?: string;
  amountLabel?: string;
  onEdit?: () => void;
}
export const OperationSummary: React.FC<OperationSummaryProps> = ({
  clientName = '—',
  operationLabel = '—',
  amountLabel = '—',
  onEdit,
}) => (
  <div id="operation-summary" className="bg-gray-50 rounded-lg p-4 mb-8">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center text-sm sm:space-x-6 space-y-4 sm:space-y-0">
        <div>
          <div className="text-sm text-gray-600">Cliente</div>
          <div className="font-medium text-text-primary text-base">{clientName}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-gray-300" />
        <div>
          <div className="text-sm text-gray-600">Operación</div>
          <div className="font-medium text-text-primary text-base">{operationLabel}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-gray-300" />
        <div>
          <div className="text-sm text-gray-600">Monto Total</div>
          <div className="font-medium text-text-primary text-base">{amountLabel}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-primary hover:text-blue-700 text-sm transition-colors flex items-center mt-4 sm:mt-0"
      >
        <i className="fa-solid fa-edit mr-1" />
        Editar datos
      </button>
    </div>
  </div>
);
```

## File: client/src/components/dashboard/operaciones/wizard/OperationTypeSelector.tsx
```typescript
import React from 'react';
import { TransactionType } from '../../../../types';
interface Props {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
}
⋮----
export const OperationTypeSelector: React.FC<Props> = (
```

## File: client/src/components/dashboard/operaciones/wizard/OperationWizardStep1Page.tsx
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  ClientSummary,
  TransactionType,
  TransactionDraftPayload,
} from '../../../../types';
import {
  useClientsList,
  useTransactionDraft,
  useLatestMarketRate,
} from '../../../../hooks/dashboard';
import { useUserPermissions } from '../../../../hooks';
import { apiRequest, handleApiError } from '../../../../utils/api';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { ClientSelection } from './ClientSelection';
import { OperationTypeSelector } from './OperationTypeSelector';
import { AssetSelection, AssetOption } from './AssetSelection';
import { ExchangeRatesSection } from './ExchangeRatesSection';
import { AmountSection } from './AmountSection';
import { MarginIndicator } from './MarginIndicator';
import { ValidationChecklist } from './ValidationChecklist';
import { WizardActions } from './WizardActions';
import { NewClientModal } from '../../../clients/NewClientModal';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
⋮----
const formatMargin = (value?: number | null) =>
const parseNotes = (notes?: string | null) =>
⋮----
// ignore parsing errors
⋮----
const encodeNotes = (rate: number, marketRate: number, code: string)
const findClientLabel = (clients: ClientSummary[], clientId: string)
const findAssetLabel = (code: string)
const sanitizeNumber = (value: number)
⋮----
const ratesAreEqual = (first?: number | null, second?: number | null) =>
// Genera labels contextuales según las reglas de negocio
const getAmountLabels = (_operationType: TransactionType, incomingAsset: string, outgoingAsset: string) => (
⋮----
// eslint-disable-next-line react-hooks/exhaustive-deps
```

## File: client/src/components/dashboard/operaciones/wizard/OperationWizardStep2Page.tsx
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  TransactionType,
  TransactionSettlementPayload,
} from '../../../../types';
import {
  useClientsList,
  useTransactionDraft,
} from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { OperationSummary } from './OperationSummary';
import { SettlementMode, SettlementModeSelector } from './SettlementModeSelector';
import { SimpleSettlementForm } from './SimpleSettlementForm';
import {
  CompoundSettlementForm,
  CompoundLine,
  CompoundComputed,
} from './CompoundSettlementForm';
import { SettlementProgress } from './SettlementProgress';
import { WizardActions } from './WizardActions';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
⋮----
const createCompoundLine = (method: string = ''): CompoundLine => (
const formatCurrency = (value: number, currency?: string) =>
⋮----
formatAmount=
```

## File: client/src/components/dashboard/operaciones/wizard/OperationWizardStep3Page.tsx
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  ClientSummary,
  TransactionType,
} from '../../../../types';
import {
  useClientsList,
  useTransactionDraft,
} from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { WizardActions } from './WizardActions';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { CompletionSuccessState } from './CompletionSuccessState';
import { CancelOperationModal } from './CancelOperationModal';
import { VoidOperationModal } from './VoidOperationModal';
import { emitDashboardBalanceRefresh } from '../../../../utils';
import { WizardCompleteSummary } from './WizardCompleteSummary';
⋮----
const formatCurrency = (value: number, currency: string) =>
const SuccessAnimationStyles = () => (
  <style>
    {`
      @keyframes checkAnimation {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      .check-animation {
        animation: checkAnimation 0.6s ease-out;
      }
    `}
  </style>
);
```

## File: client/src/components/dashboard/operaciones/wizard/SettlementModeSelector.tsx
```typescript
import React from 'react';
export type SettlementMode = 'simple' | 'compound';
interface Props {
  mode: SettlementMode;
  onChange: (mode: SettlementMode) => void;
  disabled?: boolean;
}
export const SettlementModeSelector: React.FC<Props> = ({ mode, onChange, disabled = false }) => (
  <div id="settlement-type" className="mb-8">
    <label className="block text-lg font-semibold text-text-primary mb-4">Tipo de liquidación</label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange('simple')}
        disabled={disabled}
        className={`p-6 border-2 rounded-lg text-left transition-colors ${
          mode === 'simple'
            ? 'border-primary bg-primary bg-opacity-5 text-primary'
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center mb-2">
          <i className={`mr-3 text-lg ${mode === 'simple' ? 'fa-solid fa-circle-dot' : 'fa-regular fa-circle'}`} />
          <span className="font-semibold text-lg">Simple</span>
        </div>
        <div className="text-sm opacity-80">Un solo método de pago para el 100% de la operación</div>
      </button>
      <button
        type="button"
        onClick={() => onChange('compound')}
        disabled={disabled}
        className={`p-6 border-2 rounded-lg text-left transition-colors ${
          mode === 'compound'
            ? 'border-primary bg-primary bg-opacity-5 text-primary'
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center mb-2">
          <i className={`mr-3 text-lg ${mode === 'compound' ? 'fa-solid fa-circle-dot' : 'fa-regular fa-circle'}`} />
          <span className="font-semibold text-lg">Múltiple</span>
        </div>
        <div className="text-sm opacity-80">Múltiples métodos de pago combinados</div>
      </button>
    </div>
  </div>
);
```

## File: client/src/components/dashboard/operaciones/wizard/SettlementProgress.tsx
```typescript
import React from 'react';
interface Props {
  percentage: number;
  message: string;
  tone: 'neutral' | 'success' | 'error';
}
```

## File: client/src/components/dashboard/operaciones/wizard/SimpleSettlementForm.tsx
```typescript
import React from 'react';
interface Props {
  methods: string[];
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  totalLabel: string;
  disabled?: boolean;
}
⋮----
onChange=
```

## File: client/src/components/dashboard/operaciones/wizard/ValidationChecklist.tsx
```typescript
import React from 'react';
interface Props {
  items: string[];
  loading?: boolean;
}
```

## File: client/src/components/dashboard/operaciones/wizard/VoidOperationModal.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { Alert } from '../../../ui/Alert';
interface Props {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}
export const VoidOperationModal: React.FC<Props> = (
```

## File: client/src/components/dashboard/operaciones/wizard/WizardActions.tsx
```typescript
import React from 'react';
interface Props {
  onSaveDraft: () => void;
  onCancel: () => void;
  onContinue: () => void;
  saving?: boolean;
  disableContinue?: boolean;
  disableSave?: boolean;
  onBack?: () => void;
  backLabel?: string;
  continueLabel?: string;
}
```

## File: client/src/components/dashboard/operaciones/wizard/WizardCompleteSummary.tsx
```typescript
import React from 'react';
interface InlineItemProps {
  label: string;
  value: React.ReactNode;
}
const InlineItem: React.FC<InlineItemProps> = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-600">{label}</div>
    <div className="font-medium text-text-primary text-base">{value}</div>
  </div>
);
interface SummaryCardProps {
  title: string;
  subTitle?: string;
  children: React.ReactNode;
  onEdit?: () => void;
}
⋮----
const formatDate = (iso?: string) =>
const marginToneClasses = (value: number) =>
const SettlementSimple: React.FC<{ method?: string | null; amountLabel: string }> = ({
  method,
  amountLabel,
}) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div className="text-sm text-blue-800">
          Método de liquidación
        </div>
        <div className="text-lg font-semibold text-blue-900">
          {method || '—'}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-blue-800">Monto</div>
        <div className="text-lg font-semibold text-blue-900">{amountLabel}</div>
      </div>
    </div>
  </div>
);
const SettlementCompound: React.FC<{
  lines: OperationSummaryProps['settlementLines'];
  amountLabel: string;
}> = ({ lines, amountLabel }) => (
  <div className="space-y-4">
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 hidden md:block">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">Método</div>
          <div className="col-span-3">Asignación</div>
          <div className="col-span-3">Valor</div>
          <div className="col-span-2">Equivalente</div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {lines.map((line) => (
          <div key={`${line.method}-${line.value}-${line.computedPercentage}`} className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-sm text-gray-700">
              <div className="md:col-span-4 font-medium text-text-primary">{line.method}</div>
              <div className="md:col-span-3">
                {line.allocationType === 'percentage'
                  ? `${line.value.toFixed(1)}%`
                  : `Monto fijo (${line.value.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })})`}
              </div>
              <div className="md:col-span-3">{line.value.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</div>
              <div className="md:col-span-2 font-semibold text-text-primary">
                {line.computedPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex items-center">
        <i className="fa-solid fa-info-circle mr-2" />
        <span>La liquidación alcanza el 100% del monto acordado.</span>
      </div>
      <div className="font-semibold text-blue-900">{amountLabel}</div>
    </div>
  </div>
);
⋮----
```

## File: client/src/components/dashboard/operaciones/wizard/WizardHeader.tsx
```typescript
import React from 'react';
interface WizardStep {
  label: string;
  description: string;
}
interface Props {
  steps: WizardStep[];
  currentStep: number;
  onBack: () => void;
}
```

## File: client/src/components/dashboard/tesoreria/contact/ContactBalanceDetailPage.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useContactBalanceDetail,
  ContactBalanceDetailFilters,
} from '../../../../hooks';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { ContactSummaryCard } from './ContactSummaryCard';
import { ContactFilters, ContactFilterValues } from './ContactFilters';
import { ContactOperationsTable } from './ContactOperationsTable';
import { Alert } from '../../../ui';
import { ClientSummary, TreasuryContactBalanceOperation } from '../../../../types';
import { NewClientModal } from '../../../clients/NewClientModal';
import { Footer } from '../../operaciones/Footer';
⋮----
const toFilterState = (params: URLSearchParams):
const buildAppliedFilterChips = (values: ContactFilterValues) =>
const sortValueToApi = (sort: string): ContactBalanceDetailFilters['sort'] =>
⋮----
const handleNewContactCreated = (client: ClientSummary) =>
const handleFiltersChange = (updates: Partial<ContactFilterValues>) =>
const handleRemoveFilter = (key: keyof ContactFilterValues) =>
const handleClearFilters = () =>
const handlePageChange = (nextPage: number) =>
const handleSortChange = (value: string) =>
const handleGlobalSearchChange = (value: string) =>
const handleViewInAccounts = () =>
const handleViewOperation = (operation: TreasuryContactBalanceOperation) =>
const handleSelectBalanceStripe = (balanceId: string) =>
⋮----
<TreasuryNavbar search="" onSearchChange=
```

## File: client/src/components/dashboard/tesoreria/contact/ContactFilters.tsx
```typescript
import React from 'react';
import { TreasuryContactBalanceFilterOptions } from '../../../../types';
export interface ContactFilterValues {
  operationType: string;
  status: string;
  currency: string;
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}
interface ActiveFilterChip {
  key: keyof ContactFilterValues;
  label: string;
}
interface Props {
  values: ContactFilterValues;
  options: TreasuryContactBalanceFilterOptions;
  activeFilters: ActiveFilterChip[];
  showAdvanced: boolean;
  onChange: (updates: Partial<ContactFilterValues>) => void;
  onRemoveFilter: (key: keyof ContactFilterValues) => void;
  onClearFilters: () => void;
  onToggleAdvanced: () => void;
  onApplyAdvanced: () => void;
  onCreateContact?: () => void;
}
⋮----
const handleDateChange = (key: 'dateFrom' | 'dateTo', value: string) =>
```

## File: client/src/components/dashboard/tesoreria/contact/ContactOperationsTable.tsx
```typescript
import React from 'react';
import { ApiError, TreasuryContactBalanceOperation } from '../../../../types';
import { Alert } from '../../../ui';
interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
interface Props {
  rows: TreasuryContactBalanceOperation[];
  currency: string;
  loading: boolean;
  error: ApiError | null;
  pagination: PaginationInfo;
  sortValue: string;
  onSortChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onViewOperation: (operation: TreasuryContactBalanceOperation) => void;
}
const formatDate = (iso: string | null) =>
const formatAmount = (amount: number, currency: string, direction: 'incoming' | 'outgoing') =>
const statusClasses = (statusKey: string) =>
⋮----
const buildPageNumbers = (current: number, total: number) =>
⋮----
onChange=
⋮----
<option value="date-desc">Fecha (más reciente)</option>
⋮----
<option value="date-asc">Fecha (más antigua)</option>
⋮----
<option value="amount-desc">Monto (mayor a menor)</option>
```

## File: client/src/components/dashboard/tesoreria/contact/ContactSummaryCard.tsx
```typescript
import React from 'react';
import { TreasuryContactBalanceSummary } from '../../../../types';
interface Props {
  contact: {
    fullName: string;
    shortName: string;
    contactType: string;
    cuit: string | null;
    updatedAt: string | null;
  };
  summary: TreasuryContactBalanceSummary;
  totalsByCurrency: Array<{ currency: string; total: number }>;
  onViewInAccounts: () => void;
}
⋮----
const formatAmount = (amount: number, currency: string)
const amountToneClass = (amount: number) =>
const formatTimestamp = (iso: string | null) =>
const variationText = (
  variation: TreasuryContactBalanceSummary['variation'],
  currency: string
) =>
⋮----
```

## File: client/src/components/dashboard/tesoreria/contact/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/detail/AccountingImpactCard.tsx
```typescript
import React from 'react';
interface AccountingEntry {
  account: string;
  currency: string;
  amount: number;
  counterpart?: string | null;
}
interface AccountingImpactCardProps {
  entries: AccountingEntry[];
}
const amountClass = (amount: number)
const formatAmount = (amount: number, currency: string) =>
export const AccountingImpactCard: React.FC<AccountingImpactCardProps> = ({ entries }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <h4 className="text-lg font-semibold text-text-primary mb-4">Impacto contable</h4>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Moneda
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Monto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Contrapartida
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((entry, index) => (
            <tr key={`${entry.account}-${index}`}>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.account}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {entry.currency}
                </span>
              </td>
              <td className={`px-4 py-3 text-right text-sm font-semibold ${amountClass(entry.amount)}`}>
                {formatAmount(entry.amount, entry.currency)}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">{entry.counterpart || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-start">
        <i className="fa-solid fa-info-circle text-blue-600 mr-2 mt-0.5" />
        <div className="text-sm text-blue-800">
          Cada movimiento genera dos registros compensatorios (principio de partida doble).
        </div>
      </div>
    </div>
  </div>
);
```

## File: client/src/components/dashboard/tesoreria/detail/ContactInfoCard.tsx
```typescript
import React from 'react';
import { ClientSummary } from '../../../../types';
interface ContactInfoCardProps {
  contact: {
    name?: string | null;
    type?: string | null;
    status?: string | null;
  };
  clientDetail: ClientSummary | null;
  onViewAccount: () => void;
}
const contactTypeLabel = (type?: string | null) =>
```

## File: client/src/components/dashboard/tesoreria/detail/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/detail/LinkedOperationCard.tsx
```typescript
import React from 'react';
import { TreasuryMovementOperationLink } from '../../../../types';
interface LinkedOperationCardProps {
  operation: TreasuryMovementOperationLink | null;
  onViewOperation: () => void;
}
const statusBadgeClass = (status?: string | null) =>
const formatCurrency = (amount: number, currency: string)
const modelLabel = (model?: string | null) =>
export const LinkedOperationCard: React.FC<LinkedOperationCardProps> = ({
  operation,
  onViewOperation,
}) =>
```

## File: client/src/components/dashboard/tesoreria/detail/MovementDetailPanel.tsx
```typescript
import React, { useEffect, useMemo } from 'react';
import { ApiError, TreasuryMovement, TreasuryMovementOperationLink } from '../../../../types';
import { useTreasuryMovement, useClientDetail } from '../../../../hooks';
import { Alert } from '../../../ui';
import { MovementSummaryCard } from './MovementSummaryCard';
import { ContactInfoCard } from './ContactInfoCard';
import { LinkedOperationCard } from './LinkedOperationCard';
import { AccountingImpactCard } from './AccountingImpactCard';
import { MovementDetailSkeleton } from './MovementDetailSkeleton';
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface MovementDetailPanelProps {
  open: boolean;
  movementId: string | null;
  onClose: () => void;
  onEdit: (movement: TreasuryMovement) => void;
  onCancel: (movement: TreasuryMovement) => Promise<void>;
  cancelling: boolean;
  cancelError: ApiError | null;
  refreshToken: number;
  onShowToast: (toast: { type: ToastType; message: string }) => void;
}
interface AccountingEntry {
  account: string;
  currency: string;
  amount: number;
  counterpart?: string | null;
}
const balanceAccountLabel = (movement: TreasuryMovement) =>
const counterpartAccountLabel = (movement: TreasuryMovement) =>
const buildAccountingEntries = (
  movement: TreasuryMovement,
  contactName?: string | null
): AccountingEntry[] =>
const getPrimaryOperation = (operations?: TreasuryMovementOperationLink[])
⋮----
const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) =>
const handleEditClick = () =>
const handleCancelClick = async () =>
```

## File: client/src/components/dashboard/tesoreria/detail/MovementDetailSkeleton.tsx
```typescript
import React from 'react';
```

## File: client/src/components/dashboard/tesoreria/detail/MovementSummaryCard.tsx
```typescript
import React from 'react';
import { TreasuryMovement } from '../../../../types';
interface MovementSummaryCardProps {
  movement: TreasuryMovement;
  contactName?: string | null;
}
⋮----
const movementTypeLabel = (type?: string | null)
const mediumLabel = (medium?: string | null) =>
const formatCurrency = (amount: number, currency: string) =>
const formatDateTime = (movementAt?: string | null) =>
```

## File: client/src/components/dashboard/tesoreria/global/GlobalBalancesFilters.tsx
```typescript
import React from 'react';
import {
  TreasuryGlobalBalancesFilters,
  TreasuryBalanceState,
} from '../../../../types';
export interface FilterValues {
  currency: string;
  accountKey: string;
  search: string;
  contactType: string;
  balanceState: TreasuryBalanceState | '';
  dateFrom: string | null;
  dateTo: string | null;
}
interface ActiveFilterChip {
  key: keyof FilterValues;
  label: string;
}
interface Props {
  values: FilterValues;
  options: TreasuryGlobalBalancesFilters;
  activeFilters: ActiveFilterChip[];
  showAdvanced: boolean;
  onChange: (updates: Partial<FilterValues>) => void;
  onRemoveFilter: (key: keyof FilterValues) => void;
  onClearFilters: () => void;
  onToggleAdvanced: () => void;
  onApplyAdvanced: () => void;
}
```

## File: client/src/components/dashboard/tesoreria/global/GlobalBalancesPage.tsx
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import {
  GlobalBalancesFilters,
  FilterValues,
} from './GlobalBalancesFilters';
import { GlobalBalancesSummaryCards } from './GlobalBalancesSummaryCards';
import { GlobalBalancesTable } from './GlobalBalancesTable';
import {
  TreasuryBalanceState,
  TreasuryGlobalBalanceRow,
  TreasuryGlobalBalancesOverviewResponse,
} from '../../../../types';
import { useGlobalBalancesOverview } from '../../../../hooks';
import { Footer } from '../../operaciones/Footer';
type ToastType = 'success' | 'info' | 'warning' | 'error';
interface ToastState {
  type: ToastType;
  message: string;
}
type SortField = 'balance' | 'name' | 'variation' | 'lastMovement';
interface FilterState extends FilterValues {
  page: number;
  limit: number;
  sortBy: SortField;
  sortDirection: 'asc' | 'desc';
}
⋮----
const sortValueFromState = (sortBy: SortField, sortDirection: 'asc' | 'desc') =>
const balanceStateLabel = (state: TreasuryBalanceState) =>
const contactTypeLabel = (type: string) =>
const formatDate = (iso?: string | null) =>
⋮----
const handleFiltersChange = (
    updates: Partial<FilterState> | ((previous: FilterState) => Partial<FilterState>)
) =>
const handleValuesChange = (updates: Partial<FilterValues>) =>
const handlePageChange = (page: number) =>
const handleSortChange = (value: string) =>
const handleClearFilters = () =>
const handleRemoveFilter = (key: keyof FilterValues) =>
const handleSelectAccount = (accountKeyValue: string) =>
const handleSearchChange = (value: string) =>
const handleApplyAdvanced = () =>
const handleViewContactDetail = (row: TreasuryGlobalBalanceRow) =>
```

## File: client/src/components/dashboard/tesoreria/global/GlobalBalancesSummaryCards.tsx
```typescript
import React from 'react';
import { TreasuryGlobalBalanceSummaryCard } from '../../../../types';
interface Props {
  cards: TreasuryGlobalBalanceSummaryCard[];
  loading?: boolean;
  activeAccountKey?: string | null;
  onSelectCard?: (accountKey: string) => void;
  onRefresh?: () => void;
}
const formatAmount = (amount: number, currency: string)
const formatTime = (iso?: string | null) =>
const iconForLabel = (label: string, currency: string) =>
const variationClasses = (direction: string) =>
const amountClass = (amount: number) =>
```

## File: client/src/components/dashboard/tesoreria/global/GlobalBalancesTable.tsx
```typescript
import React from 'react';
import { ApiError, TreasuryGlobalBalanceRow } from '../../../../types';
import { Alert } from '../../../ui';
interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
interface Props {
  rows: TreasuryGlobalBalanceRow[];
  loading: boolean;
  error: ApiError | null;
  pagination: PaginationInfo;
  sortValue: string;
  onSortChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRowClick?: (row: TreasuryGlobalBalanceRow) => void;
  onViewDetail?: (row: TreasuryGlobalBalanceRow) => void;
}
const amountClass = (state: string) =>
const variationMeta = (direction: string) =>
const formatCurrency = (amount: number, currency: string) =>
⋮----
// Format the number with proper thousands separators and decimal places
⋮----
const formatDate = (iso: string | null) =>
const buildPages = (current: number, total: number) =>
⋮----
onChange=
⋮----
<option value="balance-desc">Saldo (mayor a menor)</option>
⋮----
const getContactIcon = () =>
const formatContactType = (type: string | null) =>
⋮----
```

## File: client/src/components/dashboard/tesoreria/global/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/linked/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/linked/LinkedBalanceDetailPanel.tsx
```typescript
import React, { ChangeEvent, useMemo } from 'react';
import { ApiError, TreasuryLinkedBalanceDetailResponse, TreasuryMovement } from '../../../../types';
interface PanelFilters {
  dateFrom: string | null;
  dateTo: string | null;
  type: 'incoming' | 'outgoing' | null;
}
interface Props {
  open: boolean;
  detail: TreasuryLinkedBalanceDetailResponse | null;
  loading: boolean;
  error: ApiError | null;
  filters: PanelFilters;
  onChangeFilters: (next: PanelFilters) => void;
  onClose: () => void;
  onViewMovement: (movement: TreasuryMovement) => void;
  onViewAllMovements: () => void;
  onRetry: () => void;
}
const formatCurrency = (amount: number, currency: string)
const variationLabel = (percentage: number | null, direction: string) =>
const variationClass = (direction: string) =>
const variationIcon = (direction: string) =>
const formatDateTime = (iso?: string | null) =>
const mediumLabel = (medium?: string | null) =>
const movementTypeLabel = (type: string | null | undefined, medium?: string | null) =>
const movementIconClass = (movement: TreasuryMovement)
⋮----
const handleDateChange =
(field: 'dateFrom' | 'dateTo')
const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) =>
⋮----
onChange=
```

## File: client/src/components/dashboard/tesoreria/linked/LinkedBalancesAccountingSection.tsx
```typescript
import React from 'react';
import { TreasuryLinkedBalanceSummaryEntry } from '../../../../types';
interface Props {
  balances: TreasuryLinkedBalanceSummaryEntry[];
  loading: boolean;
  onViewInAccounts: (balanceId: string) => void;
}
const formatAmount = (amount: number, currency: string)
const formatDateTime = (iso: string | null) =>
const stateBadge = (state: string) =>
const currencyBadgeClass = (currency: string)
```

## File: client/src/components/dashboard/tesoreria/linked/LinkedBalancesMovementsSection.tsx
```typescript
import React from 'react';
import { TreasuryLinkedBalanceSummaryEntry, TreasuryMovement } from '../../../../types';
interface Props {
  balances: TreasuryLinkedBalanceSummaryEntry[];
  loading: boolean;
  activeBalanceId: string;
  onTabChange: (balanceId: string) => void;
  onViewMovement: (movement: TreasuryMovement) => void;
  onViewAll: (balanceId: string) => void;
}
const formatDateTime = (iso?: string | null) =>
const typeBadge = (movement: TreasuryMovement) =>
const mediumLabel = (medium?: string | null) =>
const statusBadge = (status?: string | null) =>
const formatAmount = (movement: TreasuryMovement) =>
⋮----
{/* Desktop/Tablet Table */}
```

## File: client/src/components/dashboard/tesoreria/linked/LinkedBalancesPage.tsx
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ApiError,
  TreasuryLinkedBalanceSummaryEntry,
  TreasuryMovement,
} from '../../../../types';
import {
  useLinkedBalanceDetail,
  useLinkedTreasuryBalances,
} from '../../../../hooks';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import { Alert } from '../../../ui';
import { LinkedBalancesSummarySection } from './LinkedBalancesSummarySection';
import { LinkedBalancesMovementsSection } from './LinkedBalancesMovementsSection';
import { LinkedBalancesAccountingSection } from './LinkedBalancesAccountingSection';
import { LinkedBalanceDetailPanel } from './LinkedBalanceDetailPanel';
import { Footer } from '../../operaciones/Footer';
type ToastState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
};
type DetailPanelFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  type: 'incoming' | 'outgoing' | null;
};
const formatTime = (iso: string | null) =>
const ensureBalanceOrder = (
  balances: TreasuryLinkedBalanceSummaryEntry[]
): TreasuryLinkedBalanceSummaryEntry[] =>
export const LinkedBalancesPage: React.FC = () =>
⋮----
const handleKeyDown = (event: KeyboardEvent) =>
⋮----
const handleSelectBalance = (balanceId: string) =>
const handleOpenDetail = (balanceId: string) =>
const handleCloseDetail = () =>
const handleDetailFiltersChange = (next: DetailPanelFilters) =>
const handleViewMovement = (movement: TreasuryMovement) =>
const handleViewAllMovements = (balanceId?: string) =>
const handleViewInAccounts = (balanceId: string) =>
⋮----
onViewAllMovements=
```

## File: client/src/components/dashboard/tesoreria/linked/LinkedBalancesSummarySection.tsx
```typescript
import React from 'react';
import { TreasuryLinkedBalanceSummaryEntry } from '../../../../types';
interface Props {
  balances: TreasuryLinkedBalanceSummaryEntry[];
  loading: boolean;
  onViewDetail: (balanceId: string) => void;
  onSelectBalance: (balanceId: string) => void;
}
⋮----
const formatCurrency = (amount: number, currency: string)
const formatUpdatedAt = (iso: string) =>
const variationIcon = (direction: string) =>
const variationClass = (direction: string) =>
const variationLabel = (percentage: number | null, direction: string) =>
```

## File: client/src/components/dashboard/tesoreria/reconciliation/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/reconciliation/ReconciliationFilters.tsx
```typescript
import React from 'react';
export interface ReconciliationFiltersState {
  operationType: string;
  currency: string;
  contact: string;
  dateFrom: string;
  dateTo: string;
}
interface Props {
  filters: ReconciliationFiltersState;
  onUpdate: (next: Partial<ReconciliationFiltersState>) => void;
  onClear: () => void;
}
export const ReconciliationFilters: React.FC<Props> = ({ filters, onUpdate, onClear }) => (
  <div id="filters-section" className="bg-gray-50 border-b border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-text-primary mb-4">
      Filtro y búsqueda de coincidencias
    </h3>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="filter-card border-2 border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-text-primary">Tipo de operación</div>
        <select
          className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
          value={filters.operationType}
          onChange={(event) => onUpdate({ operationType: event.target.value })}
        >
          <option value="">Todos</option>
          <option value="buy">Compra</option>
          <option value="sell">Venta</option>
          <option value="transfer">Transferencia ARS</option>
        </select>
      </div>
      <div className="filter-card border-2 border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-text-primary">Moneda</div>
        <select
          className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
          value={filters.currency}
          onChange={(event) => onUpdate({ currency: event.target.value })}
        >
          <option value="">Todas</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="filter-card border-2 border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-text-primary">Contacto</div>
        <input
          type="text"
          className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
          placeholder="Buscar contacto..."
          value={filters.contact}
          onChange={(event) => onUpdate({ contact: event.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 filter-card border-2 border-gray-200 rounded-lg p-3">
        <div>
          <div className="text-xs text-gray-500">Desde</div>
          <input
            type="date"
            className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
            value={filters.dateFrom}
            onChange={(event) => onUpdate({ dateFrom: event.target.value })}
          />
        </div>
        <div>
          <div className="text-xs text-gray-500">Hasta</div>
          <input
            type="date"
            className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
            value={filters.dateTo}
            onChange={(event) => onUpdate({ dateTo: event.target.value })}
          />
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Ajustá los filtros para mejorar las coincidencias sugeridas.
      </div>
      <button
        type="button"
        className="text-sm text-primary hover:text-blue-700 font-medium"
        onClick={onClear}
      >
        Limpiar filtros
      </button>
    </div>
  </div>
);
```

## File: client/src/components/dashboard/tesoreria/reconciliation/ReconciliationModal.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import {
  useTreasuryBalances,
  useTreasuryMovements,
  useReconciliationSuggestions,
  useCompensateTreasuryMovement,
  useUserPermissions,
} from '../../../../hooks';
import { ApiError, TreasuryMovement, OperationSuggestion } from '../../../../types';
import { ReconciliationFilters, ReconciliationFiltersState } from './ReconciliationFilters';
import { ReconciliationOperationsTable } from './ReconciliationOperationsTable';
import { ReconciliationMovementsPanel } from './ReconciliationMovementsPanel';
import { ReconciliationSummary } from './ReconciliationSummary';
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Props {
  open: boolean;
  onClose: () => void;
  onShowToast: (toast: { type: ToastType; message: string }) => void;
  onSuccess: () => void;
}
⋮----
const formatCurrency = (amount: number, currency: string)
export const ReconciliationModal: React.FC<Props> = (
⋮----
const handleSelectMovement = (movement: TreasuryMovement) =>
const handleToggleOperation = (operationId: string) =>
const handleConfirm = async () =>
const handleSaveDraft = () =>
⋮----
onClear=
```

## File: client/src/components/dashboard/tesoreria/reconciliation/ReconciliationMovementsPanel.tsx
```typescript
import React, { useMemo } from 'react';
import { TreasuryMovement } from '../../../../types';
interface Props {
  movements: TreasuryMovement[];
  selectedMovementId: string | null;
  onSelect: (movement: TreasuryMovement) => void;
  filter: string;
  onFilterChange: (value: string) => void;
}
const formatAmount = (movement: TreasuryMovement) =>
const movementTypeBadge = (movement: TreasuryMovement) =>
⋮----
onChange=
```

## File: client/src/components/dashboard/tesoreria/reconciliation/ReconciliationOperationsTable.tsx
```typescript
import React from 'react';
import { OperationSuggestion } from '../../../../types';
interface Props {
  operations: OperationSuggestion[];
  selectedIds: string[];
  onToggle: (operationId: string) => void;
  loading: boolean;
  error: string | null;
}
const operationTypeBadge = (operation: OperationSuggestion) =>
const formatDate = (iso?: string | null) =>
```

## File: client/src/components/dashboard/tesoreria/reconciliation/ReconciliationSummary.tsx
```typescript
import React from 'react';
interface Props {
  operationsCount: number;
  movementsCount: number;
  operationsTotalLabel: string;
  movementTotalLabel: string;
  differenceLabel: string;
  isBalanced: boolean;
  warning?: string | null;
  disableConfirm: boolean;
  confirming: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
}
```

## File: client/src/components/dashboard/tesoreria/register/AttachmentList.tsx
```typescript
import React from 'react';
export interface AttachmentItem {
  id: string;
  file: File;
}
interface AttachmentListProps {
  items: AttachmentItem[];
  onRemove: (id: string) => void;
}
const formatFileSize = (bytes: number) =>
⋮----
<div className="text-xs text-gray-500">
```

## File: client/src/components/dashboard/tesoreria/register/index.ts
```typescript

```

## File: client/src/components/dashboard/tesoreria/register/MovementTypeSelector.tsx
```typescript
import React from 'react';
type MovementTypeValue = 'incoming' | 'outgoing' | '';
interface MovementTypeSelectorProps {
  value: MovementTypeValue;
  onChange: (value: MovementTypeValue) => void;
  error?: string | null;
}
```

## File: client/src/components/dashboard/tesoreria/register/RegisterMovementModal.tsx
```typescript
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  ClientSummary,
  CreateTreasuryMovementPayload,
  OperationSuggestion,
  TreasuryMovement,
} from '../../../../types';
import {
  useClientSearch,
  useCreateTreasuryMovement,
  useOperationSearch,
  useUserPermissions,
} from '../../../../hooks';
import { Alert } from '../../../ui';
import { MovementTypeSelector } from './MovementTypeSelector';
import { AttachmentItem, AttachmentList } from './AttachmentList';
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface RegisterMovementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (movement: TreasuryMovement) => void;
  onShowToast: (toast: { type: ToastType; message: string }) => void;
}
type MovementTypeValue = 'incoming' | 'outgoing' | '';
type MovementMediumValue = 'cash' | 'transfer' | 'deposit' | '';
interface FormValues {
  type: MovementTypeValue;
  medium: MovementMediumValue;
  currency: 'ARS' | 'USD' | '';
  amount: string;
  movementAt: string;
  reference: string;
}
⋮----
const formatDateTimeLocal = (date: Date) =>
const sanitizeAmountInput = (value: string) =>
const hasValidationErrors = (errors: Partial<Record<keyof FormValues, string>>)
⋮----
const handleClickOutside = (event: MouseEvent) =>
⋮----
const resetForm = () =>
const validateForm = (values: FormValues) =>
const handleMediumChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) =>
const handleReferenceChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
const handleMovementAtChange = (event: React.ChangeEvent<HTMLInputElement>) =>
const handleContactInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
const handleOperationInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
const handleSelectContact = (contact: ClientSummary) =>
const handleSelectOperation = (operation: OperationSuggestion) =>
const handleRemoveAttachment = (id: string) =>
const handleFiles = (files: FileList) =>
const handleDropZoneDragOver = (event: React.DragEvent<HTMLDivElement>) =>
const handleDropZoneDragLeave = (event: React.DragEvent<HTMLDivElement>) =>
const handleDropZoneDrop = (event: React.DragEvent<HTMLDivElement>) =>
const handleSaveDraft = () =>
const handleCreateNewContact = () =>
const buildPayload = (values: FormValues): CreateTreasuryMovementPayload =>
const handleSubmit = async () =>
```

## File: client/src/components/dashboard/tesoreria/TreasuryBalanceStripe.tsx
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType } from '../../shared/design-system';
interface Props {
  onSelectBalance?: (balanceId: string) => void;
}
const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => (
⋮----
const handleBalanceClick = () =>
const handleCardClick = (balanceId: string) =>
⋮----
const handleShowTooltip = () =>
const handleHideTooltip = () =>
⋮----
data=
```

## File: client/src/components/dashboard/tesoreria/TreasuryFilters.tsx
```typescript
import React, { useMemo } from 'react';
import { ApiError, ClientSummary } from '../../../types';
import { Alert } from '../../ui';
import { TreasuryMovementsFilters } from '../../../hooks';
interface Props {
  values: TreasuryMovementsFilters;
  onChange: <K extends keyof TreasuryMovementsFilters>(field: K, value: TreasuryMovementsFilters[K]) => void;
  onApply: () => void;
  onClear: () => void;
  contacts: ClientSummary[];
  contactsLoading: boolean;
  contactsError: ApiError | null;
  onRetryContacts: () => void;
}
const labelForType = (value: string) =>
const labelForMedium = (value: string) =>
const labelForStatus = (value: string) =>
```

## File: client/src/components/dashboard/tesoreria/TreasuryHeader.tsx
```typescript
import React from 'react';
import { Button } from '../../shared/design-system';
import { useUserPermissions } from '../../../hooks';
interface Props {
  onRegisterMovement: () => void;
  onOpenConciliation: () => void;
  onOpenSettings: () => void;
}
export const TreasuryHeader: React.FC<Props> = ({
  onRegisterMovement,
  onOpenConciliation,
  onOpenSettings,
}) =>
```

## File: client/src/components/dashboard/tesoreria/TreasuryMovementsPage.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useClientsList,
  useTreasuryMovements,
  TreasuryMovementsFilters,
  TreasuryMovementsSortOption,
  useCancelTreasuryMovement,
} from '../../../hooks';
import { Alert } from '../../ui';
import { TreasuryNavbar } from './TreasuryNavbar';
import { TreasuryBalanceStripe } from './TreasuryBalanceStripe';
import { TreasuryHeader } from './TreasuryHeader';
import { TreasuryFilters } from './TreasuryFilters';
import { TreasuryMovementsTable } from './TreasuryMovementsTable';
import { ApiError, TreasuryMovement } from '../../../types';
import { RegisterMovementModal } from './register';
import { MovementDetailPanel } from './detail';
import { ReconciliationModal } from './reconciliation';
import { Footer } from '../operaciones/Footer';
type ToastState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
};
⋮----
const movementIdentifier = (movement: TreasuryMovement)
⋮----
const showToast = (nextToast: ToastState) =>
⋮----
const handleDraftChange = <K extends keyof TreasuryMovementsFilters>(
    field: K,
    value: TreasuryMovementsFilters[K]
) =>
const handleApplyFilters = () =>
const handleClearFilters = () =>
const handleGlobalSearchChange = (value: string) =>
const handleRegisterMovement = () =>
const handleOpenConciliation = () =>
const handleSelectBalanceStripe = (balanceId: string) =>
const handleOpenSettings = () =>
const handleOpenMovementDetail = (movement: TreasuryMovement) =>
const handleViewDetail = (movement: TreasuryMovement) =>
const handleView = (movement: TreasuryMovement) =>
const handleEdit = (movement: TreasuryMovement) =>
const handleCancelMovement = async (movement: TreasuryMovement) =>
const handlePageChange = (pageNumber: number) =>
const handleSortChange = (nextSort: TreasuryMovementsSortOption) =>
const handleRegisterSuccess = (_movement: TreasuryMovement) =>
const handleCloseMovementDetail = () =>
const handleEditMovement = (movement: TreasuryMovement) =>
```

## File: client/src/components/dashboard/tesoreria/TreasuryMovementsTable.tsx
```typescript
import React from 'react';
import {
  ApiError,
  TreasuryMovement,
  TreasuryMovementsTotals,
} from '../../../types';
import {
  TreasuryMovementsSortOption,
} from '../../../hooks';
interface Props {
  items: TreasuryMovement[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  sort: TreasuryMovementsSortOption;
  onSortChange: (sort: TreasuryMovementsSortOption) => void;
  totals: Record<string, TreasuryMovementsTotals>;
  onViewDetail: (movement: TreasuryMovement) => void;
  onView: (movement: TreasuryMovement) => void;
  onEdit: (movement: TreasuryMovement) => void;
  onCancel: (movement: TreasuryMovement) => void;
}
const formatDate = (iso?: string | null) =>
const amountClass = (movement: TreasuryMovement)
const formatAmount = (movement: TreasuryMovement) =>
const typeIcon = (type: string)
const typeLabel = (type: string)
const mediumLabel = (medium: string) =>
const statusBadgeClass = (status: string) =>
const statusLabel = (status: string) =>
const currencyBadgeClass = (currency: string)
const totalsSummary = (totals: Record<string, TreasuryMovementsTotals>) =>
const movementCode = (movement: TreasuryMovement)
const linkedOperationCode = (movement: TreasuryMovement) =>
⋮----
{/* Mobile Card Layout */}
⋮----
key=
⋮----

⋮----
onClick=
```

## File: client/src/components/dashboard/tesoreria/TreasuryNavbar.tsx
```typescript
import React from 'react';
import { DashboardNavbar } from '../operaciones/Navbar';
interface Props {
  search: string;
  onSearchChange: (value: string) => void;
}
export const TreasuryNavbar: React.FC<Props> = (
```

## File: client/src/components/ErrorBoundary.tsx
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}
class ErrorBoundary extends Component<Props, State>
⋮----
constructor(props: Props)
static getDerivedStateFromError(error: Error): Partial<State>
componentDidCatch(error: Error, errorInfo: ErrorInfo)
componentDidUpdate(prevProps: Props)
componentWillUnmount()
private hasResetKeysChanged(prevResetKeys: Array<string | number>): boolean
private isInfiniteLoopError(error: Error): boolean
private scheduleReset()
⋮----
private generateEventId(): string
private logError(error: Error, errorInfo: ErrorInfo)
private getErrorMessage(): string
render()
⋮----
xmlns="http://www.w3.org/2000/svg"
```

## File: client/src/components/Header.tsx
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
interface HeaderProps {
  showAuthButtons?: boolean;
  currentPage?: 'login' | 'register' | 'home';
}
```

## File: client/src/components/icons/HeroiconsOutline.tsx
```typescript
import React from 'react';
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}
```

## File: client/src/components/index.ts
```typescript

```

## File: client/src/components/login/GoogleLoginButton.tsx
```typescript
import React from 'react';
interface GoogleLoginButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}
export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onClick,
  isLoading = false
}) =>
```

## File: client/src/components/login/index.ts
```typescript

```

## File: client/src/components/login/LoginForm.tsx
```typescript
import React, { useState } from 'react';
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
interface LoginFormProps {
  onSubmit: (formData: LoginFormData) => void;
  onForgotPasswordClick: () => void;
  isLoading: boolean;
  loginError?: string;
  rateLimitError?: string;
  showUnverifiedBanner?: boolean;
  unverifiedBannerTitle?: string;
  unverifiedBannerText?: string;
  onResendVerification?: () => void;
}
⋮----
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
const handleSubmit = (e: React.FormEvent) =>
const togglePassword = () =>
```

## File: client/src/components/login/LoginPage.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinimalHeader } from './MinimalHeader';
import { LoginForm } from './LoginForm';
import { GoogleLoginButton } from './GoogleLoginButton';
import { TwoFactorModal } from './TwoFactorModal';
import { useAuth } from '../../hooks/useAuth';
import { useConfig } from '../../hooks/useConfig';
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
export const LoginPage: React.FC = () =>
⋮----
const initializeGoogleSignIn = () =>
⋮----
const checkGoogleScript = () =>
⋮----
const handleLoginSubmit = async (formData: LoginFormData) =>
const handleTwoFactorSubmit = async (code: string) =>
const handleGoogleClick = () =>
const handleBackToLogin = () =>
// Handle create account navigation
const handleCreateAccountClick = () =>
const handleForgotPasswordClick = () =>
const handleResendVerification = async () =>
```

## File: client/src/components/login/MinimalHeader.tsx
```typescript
import React from 'react';
interface MinimalHeaderProps {
  onCreateAccountClick: () => void;
}
export const MinimalHeader: React.FC<MinimalHeaderProps> = ({ onCreateAccountClick }) => (
  <header id="header" className="bg-white shadow-sm border-b border-gray-200">
    <div className="px-4 py-3 md:px-4 md:py-3">
      <div className="grid grid-cols-3 items-center">
        <div aria-hidden="true" />
        <div className="flex items-center justify-center">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2">
            <i className="fa-solid fa-chart-line text-white text-xs"></i>
          </div>
          <span className="text-lg font-bold text-text-primary md:text-lg">FinaTech</span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onCreateAccountClick}
            className="text-primary hover:underline font-medium text-sm touch-friendly md:text-sm"
          >
            <span className="hidden sm:inline">Crear cuenta</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);
```

## File: client/src/components/login/TwoFactorModal.tsx
```typescript
import React, { useState } from 'react';
interface TwoFactorModalProps {
  isOpen: boolean;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}
⋮----
const handleSubmit = (e: React.FormEvent) =>
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
⋮----
{/* Header */}
⋮----
{/* Form */}
⋮----
{/* Two Factor Code Input */}
⋮----
{/* Error Message */}
⋮----
{/* Buttons */}
```

## File: client/src/components/login/VerifyEmailPage.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MinimalHeader } from './MinimalHeader';
type VerificationStatus = 'loading' | 'success' | 'error';
const useQueryToken = () =>
⋮----
const verify = async () =>
```

## File: client/src/components/recover/index.ts
```typescript

```

## File: client/src/components/recover/MinimalHeader.tsx
```typescript
import React from 'react';
```

## File: client/src/components/recover/PasswordResetForm.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { ApiError } from '../../types';
const isValidPassword = (value: string): boolean =>
interface PasswordResetFormProps {
  token: string;
}
⋮----
const validateToken = async () =>
⋮----
const handleSubmit = async (event: React.FormEvent) =>
⋮----
onChange=
⋮----
required
```

## File: client/src/components/recover/RecoveryPage.tsx
```typescript
import React from 'react';
import { useLocation } from 'react-router-dom';
import { MinimalHeader } from './MinimalHeader';
import { RecoveryRequestForm } from './RecoveryRequestForm';
import { PasswordResetForm } from './PasswordResetForm';
const useQuery = ()
```

## File: client/src/components/recover/RecoveryRequestForm.tsx
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { ApiError } from '../../types';
const isValidEmail = (email: string): boolean =>
⋮----
const hideError = ()
const handleSubmit = async (event: React.FormEvent) =>
⋮----
onChange=
```

## File: client/src/components/Register.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useConfig } from '../hooks';
import { RegisterResponse } from '../types';
import { validateRegistrationForm, hasFormErrors } from '../utils/validation';
interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}
export const Register: React.FC = () =>
⋮----
const initializeGoogleSignIn = () =>
⋮----
const checkGoogleScript = () =>
⋮----
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
const handleSubmit = async (e: React.FormEvent) =>
⋮----
// Hide all messages
⋮----
// Validate form
⋮----
const handleGoogleClick = () =>
```

## File: client/src/components/shared/design-system/BalanceCard.tsx
```typescript
import React from 'react';
import { StatusIndicator, StatusType } from './StatusIndicator';
import { BalanceCardSkeleton } from './LoadingSkeleton';
import { Button } from './Button';
export interface BalanceCardData {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: StatusType;
  updatedAt?: string;
  icon?: string;
}
interface BalanceCardProps {
  data: BalanceCardData;
  loading?: boolean;
  error?: boolean;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
  showRetryButton?: boolean;
}
const formatAmount = (amount: number, currency: string): string =>
const formatTime = (iso?: string): string =>
const getIconForBalance = (label?: string, currency?: string, customIcon?: string): string =>
⋮----
const handleClick = () =>
const handleKeyDown = (event: React.KeyboardEvent) =>
```

## File: client/src/components/shared/design-system/Button.tsx
```typescript
import React from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}
const getVariantClasses = (variant: ButtonVariant): string =>
const getSizeClasses = (size: ButtonSize): string =>
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) =>
```

## File: client/src/components/shared/design-system/index.ts
```typescript

```

## File: client/src/components/shared/design-system/LoadingSkeleton.tsx
```typescript
import React from 'react';
interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animate = true,
}) =>
interface BalanceCardSkeletonProps {
  className?: string;
}
```

## File: client/src/components/shared/design-system/StatusIndicator.tsx
```typescript
import React from 'react';
export type StatusType = 'ok' | 'warning' | 'error' | 'loading' | 'unknown';
interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
const getStatusClasses = (status: StatusType): string =>
const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string =>
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  className = '',
}) =>
```

## File: client/src/components/ui/Alert.tsx
```typescript
import React from 'react';
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}
```

## File: client/src/components/ui/Button.tsx
```typescript
import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'google';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}
```

## File: client/src/components/ui/index.ts
```typescript

```

## File: client/src/components/ui/Input.tsx
```typescript
import React, { useState } from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
}
```

## File: client/src/components/ui/LoadingSpinner.tsx
```typescript
import React from 'react';
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
}
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = '',
}) =>
```

## File: client/src/components/ui/Modal.tsx
```typescript
import React, { useEffect } from 'react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlayClick?: boolean;
}
⋮----
const handleEscape = (event: KeyboardEvent) =>
⋮----
const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) =>
```

## File: client/src/components/ui/PasswordRequirements.tsx
```typescript
import React from 'react';
import { PasswordRequirements as PasswordReqs } from '../../types';
interface PasswordRequirementsProps {
  requirements: PasswordReqs;
  className?: string;
}
```

## File: client/src/hooks/dashboard/index.ts
```typescript

```

## File: client/src/hooks/dashboard/useCancelTreasuryMovement.ts
```typescript
import { useCallback, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import { ApiError, TreasuryMovement } from '../../types';
interface CancelResponse {
  movement: TreasuryMovement;
}
export const useCancelTreasuryMovement = () =>
```

## File: client/src/hooks/dashboard/useClientSearch.ts
```typescript
import { useEffect, useMemo, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ClientSummary, ListClientsResponse, ApiError } from '../../types';
export const useClientSearch = (initialQuery = '') =>
```

## File: client/src/hooks/dashboard/useClientsList.ts
```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, ClientSummary, ListClientsResponse } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
export const useClientsList = (limit = 25) =>
```

## File: client/src/hooks/dashboard/useCompensateTreasuryMovement.ts
```typescript
import { useCallback, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import { ApiError, TreasuryMovement } from '../../types';
interface CompensateResponse {
  movement: TreasuryMovement;
}
interface CompensatePayload {
  amount?: number;
  contactId?: string;
  operation?: {
    id: string;
    model?: string | null;
  };
}
export const useCompensateTreasuryMovement = () =>
```

## File: client/src/hooks/dashboard/useContactBalanceDetail.ts
```typescript
import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { TreasuryContactBalanceDetailResponse } from '../../types';
import { subscribeDashboardBalanceRefresh } from '../../utils';
export interface ContactBalanceDetailFilters {
  currency?: string | null;
  operationType?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  accountKey?: string | null;
  page?: number;
  limit?: number;
  sort?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'type-asc' | 'type-desc';
}
export interface ContactBalanceDetailOptions {
  autoFetch?: boolean;
}
⋮----
const buildQueryString = (filters: ContactBalanceDetailFilters) =>
export const useContactBalanceDetail = (
  contactId: string | null | undefined,
  filters: ContactBalanceDetailFilters,
  options: ContactBalanceDetailOptions = {}
) =>
```

## File: client/src/hooks/dashboard/useCreateTransfer.ts
```typescript
import { useState, useCallback } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ApiError } from '../../types';
import { CreateTransferPayload, CreateTransferResponse } from '../../types';
export const useCreateTransfer = () =>
```

## File: client/src/hooks/dashboard/useCreateTreasuryMovement.ts
```typescript
import { useCallback } from 'react';
import { useApi } from '../useApi';
import {
  ApiError,
  CreateTreasuryMovementPayload,
  CreateTreasuryMovementResponse,
} from '../../types';
export const useCreateTreasuryMovement = () =>
```

## File: client/src/hooks/dashboard/useDashboardBalances.ts
```typescript
import { useCallback, useSyncExternalStore } from 'react';
import {
  apiRequest,
  handleApiError,
  subscribeDashboardBalanceRefresh,
  ensureDashboardBalanceStream,
  stopDashboardBalanceStream,
} from '../../utils';
import { ApiError, DashboardBalancesResponse, TreasuryBalance } from '../../types';
export interface UseDashboardBalancesOptions {
  enabled?: boolean;
  pollInterval?: number;
}
interface DashboardBalancesState {
  balances: TreasuryBalance[];
  loading: boolean;
  error: ApiError | null;
}
⋮----
const notify = () =>
const createStateHash = (state: DashboardBalancesState): string =>
const setState = (partial: Partial<DashboardBalancesState>) =>
const fetchBalances = async (): Promise<void> =>
const start = (pollInterval: number = DEFAULT_POLL_INTERVAL_MS) =>
const stop = () =>
const subscribe = (listener: () => void, pollInterval: number = DEFAULT_POLL_INTERVAL_MS) =>
const getSnapshot = (): DashboardBalancesState =>
⋮----
const getDisabledSnapshot = (): DashboardBalancesState
export const useDashboardBalances = (
  options: UseDashboardBalancesOptions = {}
) =>
```

## File: client/src/hooks/dashboard/useDashboardNotifications.ts
```typescript
import { useCallback, useSyncExternalStore } from 'react';
import { api, apiRequest, handleApiError } from '../../utils';
import { ApiError, DashboardNotification, DashboardNotificationsResponse } from '../../types';
interface NotificationsState {
  notifications: DashboardNotification[];
  loading: boolean;
  error: ApiError | null;
}
⋮----
const notify = () =>
const setState = (partial: Partial<NotificationsState>) =>
const fetchNotifications = async (options:
const subscribe = (listener: () => void) =>
const noopSubscribe = () => () =>
const getSnapshot = (): NotificationsState =>
const getDisabledSnapshot = (): NotificationsState => (
const markNotificationAsRead = async (notificationId: string) =>
const markAllNotificationsAsRead = async () =>
export const useDashboardNotifications = (enabled: boolean = true) =>
```

## File: client/src/hooks/dashboard/useGlobalBalancesOverview.ts
```typescript
import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import {
  TreasuryGlobalBalancesOverviewResponse,
  TreasuryBalanceState,
} from '../../types';
import { subscribeDashboardBalanceRefresh } from '../../utils';
export interface GlobalBalancesFilters {
  currency?: string;
  accountKey?: string;
  contactType?: string;
  balanceState?: TreasuryBalanceState | '';
  search?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  page?: number;
  limit?: number;
  sortBy?: 'balance' | 'name' | 'variation' | 'lastMovement';
  sortDirection?: 'asc' | 'desc';
}
const buildQueryString = (filters: GlobalBalancesFilters) =>
⋮----
export const useGlobalBalancesOverview = (filters: GlobalBalancesFilters) =>
```

## File: client/src/hooks/dashboard/useLatestMarketRate.ts
```typescript
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ApiError } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
export interface MarketRateOverride {
  baseAsset: string;
  quoteAsset: string;
  rate: number;
  validFrom: string;
  source: string;
  createdAt: string;
}
export interface UseLatestMarketRateOptions {
  baseAsset?: string;
  quoteAsset?: string;
  enabled?: boolean;
}
export interface UseLatestMarketRateResult {
  data: MarketRateOverride | null;
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<MarketRateOverride | null>;
}
export const useLatestMarketRate = (
  options: UseLatestMarketRateOptions = {}
): UseLatestMarketRateResult =>
```

## File: client/src/hooks/dashboard/useLinkedBalanceDetail.ts
```typescript
import { useCallback, useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { TreasuryLinkedBalanceDetailResponse } from '../../types';
export interface LinkedBalanceDetailParams {
  dateFrom?: string | null;
  dateTo?: string | null;
  type?: string | null;
  contactId?: string | null;
  page?: number;
  limit?: number;
}
export interface UseLinkedBalanceDetailOptions {
  autoFetch?: boolean;
}
export const useLinkedBalanceDetail = (
  balanceId: string | null,
  params: LinkedBalanceDetailParams = {},
  options: UseLinkedBalanceDetailOptions = {}
) =>
```

## File: client/src/hooks/dashboard/useLinkedTreasuryBalances.ts
```typescript
import { useEffect } from 'react';
import { useApi } from '../useApi';
import { TreasuryLinkedBalancesSummaryResponse } from '../../types';
export const useLinkedTreasuryBalances = () =>
```

## File: client/src/hooks/dashboard/useLogisticsOperations.ts
```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, handleApiError } from '../../utils';
import {
  ApiError,
  DEFAULT_LOGISTICS_FILTERS,
  LogisticsAttachment,
  LogisticsFilters,
  LogisticsMetrics,
  LogisticsOperation,
  LogisticsOperationRecord,
  LogisticsOperationsResponse,
  LogisticsTimelineEntry,
  OperationStatus,
  OperationType,
} from '../../types';
type PaginationState = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};
const toOperationType = (type: LogisticsOperationRecord['type']): OperationType =>
const toTimelineState = (status: LogisticsOperationRecord['timeline'][number]['status']): LogisticsTimelineEntry['state'] =>
const toAttachmentType = (icon?: string | null): LogisticsAttachment['type'] =>
const mapRecordToOperation = (record: LogisticsOperationRecord): LogisticsOperation =>
const buildQueryParams = (filters: LogisticsFilters, pagination: PaginationState) => (
export const useLogisticsOperations = () =>
export type UseLogisticsOperationsReturn = ReturnType<typeof useLogisticsOperations>;
```

## File: client/src/hooks/dashboard/useOperationSearch.ts
```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  ListTransfersResponse,
  OperationSuggestion,
  TransferOperation,
} from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
const normalizeOperationToSuggestion = (operation: TransferOperation): OperationSuggestion =>
interface UseOperationSearchOptions {
  minimumQueryLength?: number;
  limit?: number;
}
export const useOperationSearch = (options: UseOperationSearchOptions =
```

## File: client/src/hooks/dashboard/useReconciliationSuggestions.ts
```typescript
import { useCallback, useEffect, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import { ApiError, TreasuryMovement, OperationSuggestion } from '../../types';
interface ReconciliationSuggestionDTO {
  suggestionId: string;
  operationId: string | null;
  model: string | null;
  code: string | null;
  amount: number;
  currency: string;
  contactName: string | null;
  movementType: string | null;
  status: string | null;
  confirmedAt: string | null;
}
interface ReconciliationResponse {
  movement: TreasuryMovement;
  suggestions: ReconciliationSuggestionDTO[];
}
const normalizeSuggestion = (item: ReconciliationSuggestionDTO): OperationSuggestion => (
export const useReconciliationSuggestions = (movementId: string | null) =>
```

## File: client/src/hooks/dashboard/useTransactionDraft.ts
```typescript
import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  TransactionDraft,
  TransactionDraftPayload,
  TransactionSettlementPayload,
} from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
export const useTransactionDraft = (draftId?: string | null) =>
```

## File: client/src/hooks/dashboard/useTransferOperations.ts
```typescript
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../useApi';
import { ListTransfersResponse, TransferOperation } from '../../types';
export interface UseTransferOperationsOptions {
  limit?: number;
  skip?: number;
  query?: string;
}
⋮----
export const useTransferOperations = (opts: UseTransferOperationsOptions =
```

## File: client/src/hooks/dashboard/useTreasuryBalances.ts
```typescript
import { useEffect } from 'react';
import { useApi } from '../useApi';
import { TreasuryBalancesResponse } from '../../types';
export const useTreasuryBalances = () =>
```

## File: client/src/hooks/dashboard/useTreasuryMovement.ts
```typescript
import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { ApiError, TreasuryMovement } from '../../types';
interface MovementDetailResponse {
  movement: TreasuryMovement;
}
export const useTreasuryMovement = (movementId?: string | null) =>
```

## File: client/src/hooks/dashboard/useTreasuryMovements.ts
```typescript
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, TreasuryMovement, TreasuryMovementsResponse } from '../../types';
import { useApi } from '../useApi';
export type TreasuryMovementsSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'status';
export interface TreasuryMovementsFilters {
  dateFrom: string;
  dateTo: string;
  type: string;
  medium: string;
  currency: string;
  status: string;
  contactId: string;
  search: string;
}
export interface UseTreasuryMovementsOptions {
  limit?: number;
  autoRefreshMs?: number;
  initialFilters?: Partial<TreasuryMovementsFilters>;
}
⋮----
const sortToParams = (sort: TreasuryMovementsSortOption) =>
const normalizeFiltersForQuery = (filters: TreasuryMovementsFilters) =>
const sortItemsLocally = (
  items: TreasuryMovement[],
  sort: TreasuryMovementsSortOption
): TreasuryMovement[] =>
export const useTreasuryMovements = (options: UseTreasuryMovementsOptions =
```

## File: client/src/hooks/index.ts
```typescript

```

## File: client/src/hooks/useApi.ts
```typescript
import { useState, useCallback, useRef } from 'react';
import { UseApiState, UseApiOptions, RequestConfig, ApiError } from '../types';
import { apiRequest, handleApiError } from '../utils';
export const useApi = <T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiState<T> =>
```

## File: client/src/hooks/useAuth.ts
```typescript
import { useState, useCallback } from 'react';
import {
  LoginFormData,
  RegisterFormData,
  TwoFactorFormData,
  PasswordRecoveryFormData,
  PasswordResetFormData,
  LoginResponse,
  RegisterResponse,
  TwoFactorResponse,
  GoogleAuthResponse,
  PasswordRecoveryResponse,
  PasswordResetResponse,
  LoadingState,
  ApiError,
  UserProfile,
} from '../types';
import { api, handleApiError } from '../utils';
import { primeCurrentUser } from './useCurrentUser';
export const useAuth = () =>
⋮----
const extractProfile = (payload: any): UserProfile | null =>
```

## File: client/src/hooks/useClientDetail.ts
```typescript
import { useEffect } from 'react';
import { useApi } from './useApi';
import { ApiError, ClientSummary } from '../types';
export const useClientDetail = (clientId?: string | null) =>
```

## File: client/src/hooks/useConfig.ts
```typescript
import { useState, useEffect, useCallback } from 'react';
import { ConfigResponse, ApiError } from '../types';
import { api, handleApiError } from '../utils';
export const useConfig = () =>
```

## File: client/src/hooks/useCreateClient.ts
```typescript
import { useCallback, useState } from 'react';
import { ApiError, ClientSummary } from '../types';
import { apiRequest, handleApiError } from '../utils/api';
export interface CreateClientPayload {
  firstName: string;
  lastName: string;
  internalOwner: string;
  contactType: 'client' | 'provider';
  cuit?: string | null;
  email?: string | null;
  phone?: string | null;
}
export const useCreateClient = () =>
```

## File: client/src/hooks/useCurrentUser.ts
```typescript
import { useCallback, useEffect, useState } from 'react';
import { api, handleApiError } from '../utils';
import { ApiError, ProfileResponse, UserProfile } from '../types';
⋮----
type Subscriber = (profile: UserProfile | null, error: ApiError | null) => void;
⋮----
const notifySubscribers = (profile: UserProfile | null, error: ApiError | null) =>
const fetchUserProfile = async (): Promise<UserProfile | null> =>
export const useCurrentUser = () =>
⋮----
const listener: Subscriber = (profile, nextError) =>
⋮----
export const primeCurrentUser = (profile: UserProfile | null) =>
```

## File: client/src/hooks/useForm.ts
```typescript
import { useState, useCallback } from 'react';
export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => Promise<void> | void;
}
export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof T) => (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  isValid: boolean;
}
export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> =>
```

## File: client/src/hooks/useNotifications.ts
```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardNotifications } from './dashboard';
export type NotificationLevel = 'info' | 'warning' | 'success' | 'error';
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  level: NotificationLevel;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}
export const useNotifications = () =>
```

## File: client/src/hooks/useUserPermissions.ts
```typescript
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../types';
import { api, handleApiError } from '../utils';
interface UseUserPermissionsOptions {
  enabled?: boolean;
}
interface UseUserPermissionsResult {
  permissions: string[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<string[]>;
}
⋮----
const extractPermissions = (payload: any): string[] =>
const requestPermissions = async (): Promise<string[]> =>
export const useUserPermissions = (
  options: UseUserPermissionsOptions = {}
): UseUserPermissionsResult =>
```

## File: client/src/index.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
```

## File: client/src/types/api.ts
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
}
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
  status?: number;
  details?: any;
}
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  signal?: AbortSignal | null;
}
export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (config?: Partial<RequestConfig>) => Promise<T>;
  reset: () => void;
}
```

## File: client/src/types/auth.ts
```typescript
export interface User {
  _id: string;
  fullName: string;
  email: string;
  providers: {
    local?: {
      isActive: boolean;
    };
    google?: {
      id: string;
      isActive: boolean;
    };
  };
  isVerified: boolean;
  verification?: {
    token: string;
    expiresAt: Date;
  };
  passwordReset?: {
    token: string;
    expiresAt: Date;
  };
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastFailedLoginAt?: Date;
  lastLoginAt?: Date;
  twoFactor: {
    isEnabled: boolean;
    secret?: string;
    backupCodes?: string[];
  };
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  providers?: Array<{
    provider: string;
    providerId?: string;
  }>;
  isVerified?: boolean;
  createdAt?: string | Date;
  permissions?: string[];
}
export interface ProfileResponse {
  profile?: UserProfile | null;
}
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}
export interface TwoFactorFormData {
  code: string;
  challengeId?: string;
}
export interface PasswordRecoveryFormData {
  email: string;
}
export interface PasswordResetFormData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  profile?: UserProfile;
  requiresTwoFactor?: boolean;
  requiresVerification?: boolean;
  challengeId?: string;
  redirectUrl?: string;
}
export interface RegisterResponse {
  type?: 'pending_verification' | 'merged_google' | 'verified' | string;
  message: string;
  profile?: UserProfile;
  user?: User;
  success?: boolean;
}
export interface TwoFactorResponse {
  success: boolean;
  message: string;
  user?: User;
  redirectUrl?: string;
  profile?: UserProfile;
}
export interface GoogleAuthResponse {
  success: boolean;
  message: string;
  user?: User;
  profile?: UserProfile;
  requiresTwoFactor?: boolean;
  redirectUrl?: string;
}
export interface PasswordRecoveryResponse {
  success: boolean;
  message: string;
}
export interface PasswordResetResponse {
  success: boolean;
  message: string;
}
export interface ConfigResponse {
  googleClientId: string;
}
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
export interface FormErrors {
  [key: string]: string;
}
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar?: boolean;
}
export interface LoadingState {
  login: boolean;
  register: boolean;
  twoFactor: boolean;
  googleAuth: boolean;
  resendVerification: boolean;
  resendTwoFactor: boolean;
  passwordRecovery: boolean;
  passwordReset: boolean;
}
export interface RateLimitError {
  message: string;
  retryAfter?: number;
  remainingAttempts?: number;
}
export interface VerificationState {
  isUnverified: boolean;
  canResend: boolean;
  resendCooldown?: number;
}
export interface TwoFactorChallenge {
  challengeId: string;
  canResend: boolean;
  resendCooldown?: number;
}
export interface GoogleConfig {
  clientId: string;
  initialized: boolean;
}
export interface ValidationState {
  isValid: boolean;
  errors: FormErrors;
  touched: Record<string, boolean>;
}
export interface MessageState {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  visible: boolean;
}
```

## File: client/src/types/client.ts
```typescript
export interface ClientAddress {
  formatted: string;
  description?: string;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
export interface ClientSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  shortName: string;
  contactType: 'client' | 'provider' | string;
  cuit?: string | null;
  email?: string | null;
  phone?: string | null;
  internalOwner?: string | null;
  lastMarginPercentage?: number | null;
  primaryAddress?: ClientAddress | null;
  secondaryAddress?: ClientAddress | null;
  createdAt?: string;
}
export interface ListClientsResponse {
  items: ClientSummary[];
}
```

## File: client/src/types/dashboard.ts
```typescript
export interface TreasuryBalance {
  id: string;
  label: string;
  currency: 'ARS' | 'USD' | 'EUR' | string;
  amount: number;
  status: 'ok' | 'warning' | 'error' | string;
  updatedAt: string;
}
export interface DashboardBalancesResponse {
  balances: TreasuryBalance[];
}
export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  actionLabel?: string;
  actionUrl?: string;
  read?: boolean;
  message?: string;
  metadata?: Record<string, unknown> | null;
}
export interface DashboardNotificationsResponse {
  notifications: DashboardNotification[];
}
```

## File: client/src/types/global.d.ts
```typescript
interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: string | number;
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              locale?: string;
            }
          ) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getDismissedReason: () => string;
            getMomentType: () => string;
          }) => void) => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: any) => void;
          cancel: () => void;
        };
      };
    };
  }
```

## File: client/src/types/index.ts
```typescript
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
export interface TwoFactorFormData {
  code: string;
  challengeId: string;
}
export interface MessageState {
  type: 'error' | 'success' | 'warning';
  message: string;
  visible: boolean;
}
export interface VerificationState {
  isUnverified: boolean;
  canResend: boolean;
}
export interface RateLimitError {
  message: string;
  retryAfter?: number;
}
```

## File: client/src/types/logistics.ts
```typescript
export type OperationType = 'entrega' | 'transferencia' | 'retiro' | 'custodia' | 'transferencia-interna';
export type OperationStatus = 'pendiente' | 'en-curso' | 'completado' | 'anulado';
export interface LogisticsApiAmount {
  value: number | null;
  currency: string;
}
export interface LogisticsApiAttachment {
  name: string;
  size?: string | null;
  url?: string | null;
  icon?: string | null;
  color?: string | null;
}
export interface LogisticsApiTimelineEntry {
  label: string;
  status: 'pending' | 'current' | 'completed';
  timestamp?: string | Date | null;
  author?: string | null;
}
export interface LogisticsOperationRecord {
  id: string;
  operationCode: string;
  datetime: string;
  type: 'Entrega' | 'Transferencia' | 'Retiro' | 'Custodia';
  state: OperationStatus;
  contact: string;
  route: string;
  origin?: string;
  destination?: string;
  amount: LogisticsApiAmount | null;
  responsible?: string;
  attachments: LogisticsApiAttachment[];
  timeline: LogisticsApiTimelineEntry[];
  metadata?: Record<string, string | null | undefined> | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface LogisticsMetrics {
  active: number;
  pendingDeliveries: number;
  internalTransfers: number;
  completedToday: number;
  trends: {
    active: number;
    pendingDeliveries: number;
    internalTransfers: number;
    completedToday: number;
  };
}
export interface LogisticsOperationsResponse {
  data: LogisticsOperationRecord[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  metrics: LogisticsMetrics;
}
export interface LogisticsTimelineEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  user: string;
  state: 'completed' | 'current' | 'upcoming';
}
export interface LogisticsAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  size?: string | null;
  url?: string | null;
}
export interface LogisticsOperation {
  id: string;
  operationCode: string;
  date: string;
  type: OperationType;
  contact: string;
  route: string;
  origin?: string;
  destination?: string;
  status: OperationStatus;
  amount: number | null;
  currency: string;
  responsible: string;
  notes: string;
  timeline: LogisticsTimelineEntry[];
  attachments: LogisticsAttachment[];
}
export interface LogisticsFilters {
  search: string;
  operationType: '' | OperationType;
  status: '' | OperationStatus;
  dateFrom: string;
  dateTo: string;
  contact: string;
  responsible: string;
}
```

## File: client/src/types/transaction.ts
```typescript
import { ClientSummary } from './client';
export type TransactionType = 'buy' | 'sell';
export interface TransactionAsset {
  code: string;
  label: string;
}
export interface TransactionSettlementLine {
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number;
  computedPercentage: number;
}
export interface TransactionSettlement {
  mode: 'simple' | 'compound';
  simpleMethod: string | null;
  lines: TransactionSettlementLine[];
  totalPercentage: number;
  isComplete: boolean;
}
export interface TransactionAccountingEntry {
  action: 'settlement_completed' | 'settlement_reverted';
  performedAt: string | null;
  performedBy: string | null;
  metadata: {
    direction?: string | null;
    currency?: string | null;
    entries?: Array<{
      movementType: 'cash' | 'transfer' | 'usd';
      method: string;
      amount: number;
    }>;
  };
}
export interface TransactionSettlementImpact {
  currency: string | null;
  direction: 'incoming' | 'outgoing' | null;
  entries: Array<{
    movementType: 'cash' | 'transfer' | 'usd';
    method: string;
    amount: number;
  }>;
  balances: Array<{
    key: string;
    currency: string;
    amount: number;
    updatedAt: string;
  }>;
}
export interface TransactionDraft {
  id: string;
  clientId: string | null;
  client?: ClientSummary | null;
  type: TransactionType;
  incomingAsset: TransactionAsset;
  outgoingAsset: TransactionAsset;
  apr: number;
  marketApr: number;
  incomingAmount: number;
  outgoingAmount: number;
  marginPercentage: number;
  status: 'draft' | 'pending' | 'registered' | 'completed' | 'cancelled' | 'voided';
  currentStep: number;
  operationCode: string | null;
  completedAt: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  settlement: TransactionSettlement;
  accountingAudit?: TransactionAccountingEntry[];
  settlementImpact?: TransactionSettlementImpact;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface TransactionDraftPayload {
  clientId: string;
  type: TransactionType;
  incomingAsset: TransactionAsset;
  outgoingAsset: TransactionAsset;
  apr: number;
  marketApr: number;
  incomingAmount: number;
  outgoingAmount: number;
  notes?: string | null;
}
export interface TransactionSettlementLinePayload {
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number;
}
export interface TransactionSettlementPayload {
  mode: 'simple' | 'compound';
  simpleMethod?: string | null;
  lines?: TransactionSettlementLinePayload[];
}
```

## File: client/src/types/transfer.ts
```typescript
export type MovementType = 'cash' | 'transfer';
export type MovementDirection = 'incoming' | 'outgoing';
export type MovementMethod = 'ARS' | 'USD';
export interface TransferDistributionLineInput {
  contactId: string;
  method?: MovementMethod;
  amount: number;
}
export interface TransferDistributionLine {
  lineId: string;
  contactId: string;
  contactName: string | null;
  contactType: string | null;
  method: MovementMethod;
  amount: number;
  amountArs?: number;
}
export interface TransferOperation {
  id: string;
  operationCode: string | null;
  movementType: MovementType;
  direction: MovementDirection;
  currency: 'ARS' | 'USD' | string;
  totalAmount: number;
  distributionLines: TransferDistributionLine[];
  status: 'pending' | 'registered' | 'completed' | 'cancelled';
  confirmedAt: string | null;
  completedAt: string | null;
  completedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
export interface CreateTransferPayload {
  movementType: MovementType;
  direction: MovementDirection;
  totalAmount: number;
  distributionLines: TransferDistributionLineInput[];
  exchangeRates?: {
    usdArs?: number;
  };
}
export interface CreateTransferResponse {
  operation: TransferOperation;
  balance: {
    id: string;
    currency: string;
    amount: number;
    updatedAt: string;
  } | null;
  events: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string | null;
  }>;
  exchangeRates?: {
    usdArs?: number;
  } | null;
}
export interface ListTransfersResponse {
  items: TransferOperation[];
}
```

## File: client/src/types/treasury.ts
```typescript
export type TreasuryMovementType = 'incoming' | 'outgoing' | string;
export type TreasuryMovementMedium = 'cash' | 'transfer' | 'deposit' | string;
export type TreasuryMovementStatus =
  | 'registered'
  | 'compensated'
  | 'cancelled'
  | 'pending'
  | string;
export interface TreasuryContact {
  id: string | null;
  fullName: string;
  shortName?: string;
  contactType?: string;
  status?: string;
  email?: string | null;
}
export interface TreasuryMovementOperationLink {
  id: string | null;
  model: string | null;
  code: string | null;
  type: string | null;
  currency: string | null;
  amount: number;
  matchedAt: string | null;
  matchedBy: string | null;
}
export interface TreasuryMovement {
  id: string | null;
  movementCode: string | null;
  type: TreasuryMovementType;
  medium: TreasuryMovementMedium;
  currency: 'ARS' | 'USD' | string;
  amount: number;
  balanceKey?: string | null;
  status: TreasuryMovementStatus;
  movementAt: string | null;
  contact: TreasuryContact | null;
  description: string | null;
  reference: string | null;
  source: string;
  linkedOperations: TreasuryMovementOperationLink[];
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
  compensatedAt: string | null;
  compensatedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  auditTrail?: Array<{
    action: string;
    user: string | null;
    timestamp: string | null;
    metadata: Record<string, unknown>;
  }>;
}
export interface TreasuryMovementsTotals {
  incoming: number;
  outgoing: number;
  net: number;
}
export interface TreasuryMovementsResponse {
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  totals: Record<string, TreasuryMovementsTotals>;
  items: TreasuryMovement[];
}
export interface TreasuryBalancesResponse {
  balances: Array<{
    id: string;
    label: string;
    currency: string;
    amount: number;
    status: string;
    updatedAt: string;
  }>;
}
export interface CreateTreasuryMovementPayload {
  type: TreasuryMovementType;
  medium: TreasuryMovementMedium;
  currency: string;
  amount: number;
  movementAt?: string;
  contactId?: string | null;
  reference?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  operation?: {
    id: string;
    model?: string | null;
  };
}
export interface CreateTreasuryMovementResponse {
  movement: TreasuryMovement;
  balance: {
    id: string;
    label: string;
    currency: string;
    amount: number;
    status: string;
    updatedAt: string;
  } | null;
}
export interface OperationSuggestion {
  id: string;
  code: string | null;
  model: string;
  amount: number;
  currency: string;
  movementType?: string | null;
  status?: string | null;
  confirmedAt?: string | null;
  description?: string | null;
}
export interface TreasuryLinkedBalanceVariation {
  windowDays: number;
  percentage: number | null;
  direction: 'up' | 'down' | 'flat';
  currentNet: number;
  previousNet: number;
}
export interface TreasuryLinkedBalanceTotals {
  incoming: number;
  outgoing: number;
  net: number;
}
export interface TreasuryLinkedBalanceAccounting {
  accountName: string;
  currency: string;
  balance: number;
  lastOperationAt: string | null;
  state: 'activo' | 'inactivo' | 'sin_movimientos' | string;
}
export interface TreasuryLinkedBalanceContactSummary {
  contact: TreasuryContact;
  totals: TreasuryLinkedBalanceTotals;
  lastMovementAt: string | null;
  movementCount: number;
}
export interface TreasuryLinkedBalanceActivityEntry {
  id: string | null;
  createdAt: string | null;
  ledger: string;
  stage: string;
  amount: number;
  currency: string;
  direction: 'positive' | 'negative';
  operation: {
    id: string | null;
    code: string | null;
    type: string | null;
    source: string | null;
  } | null;
  counterpart: Record<string, unknown> | null;
  contact: TreasuryContact | null;
}
export interface TreasuryLinkedBalanceSummaryEntry {
  id: string;
  label: string;
  currency: string;
  amount: number;
  status: string;
  updatedAt: string;
  variation: TreasuryLinkedBalanceVariation;
  totals: TreasuryLinkedBalanceTotals;
  recentMovements: TreasuryMovement[];
  contacts: TreasuryLinkedBalanceContactSummary[];
  accounting: TreasuryLinkedBalanceAccounting | null;
  activity: TreasuryLinkedBalanceActivityEntry[];
}
export interface TreasuryLinkedBalancesSummaryResponse {
  generatedAt: string;
  balances: TreasuryLinkedBalanceSummaryEntry[];
}
export type TreasuryBalanceState = 'positive' | 'negative' | 'zero';
export interface TreasuryGlobalBalanceVariation {
  percentage: number;
  direction: 'up' | 'down' | 'flat';
  windowDays: number;
  currentWindowAmount: number;
  previousWindowAmount: number;
}
export interface TreasuryGlobalBalanceContact {
  id: string | null;
  fullName: string;
  shortName: string | null;
  contactType: string | null;
  status: string | null;
  cuit: string | null;
}
export interface TreasuryGlobalBalanceRow {
  id: string;
  accountKey: string;
  accountLabel: string;
  accountStatus: string;
  currency: string;
  amount: number;
  balanceState: TreasuryBalanceState;
  variation: TreasuryGlobalBalanceVariation;
  lastMovementAt: string | null;
  lastOperation: {
    code: string | null;
    type: string | null;
  } | null;
  contact: TreasuryGlobalBalanceContact;
}
export interface TreasuryGlobalBalanceSummaryCard {
  id: string;
  label: string;
  currency: string;
  amount: number;
  status: string;
  updatedAt: string | null;
  variation: {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    windowDays: number;
  };
}
export interface TreasuryGlobalBalancesFilterOption {
  value: string;
  label: string;
}
export interface TreasuryGlobalBalancesFilters {
  currencies: TreasuryGlobalBalancesFilterOption[];
  accountKeys: TreasuryGlobalBalancesFilterOption[];
  balanceStates: TreasuryGlobalBalancesFilterOption[];
  contactTypes: TreasuryGlobalBalancesFilterOption[];
}
export interface TreasuryGlobalBalancesStats {
  totalBalance: number;
  balanceStates: Record<TreasuryBalanceState, number>;
  totalsByCurrency: Array<{
    currency: string;
    total: number;
  }>;
}
export interface TreasuryGlobalBalancesOverviewResponse {
  generatedAt: string;
  summaryCards: TreasuryGlobalBalanceSummaryCard[];
  filters: TreasuryGlobalBalancesFilters;
  table: {
    items: TreasuryGlobalBalanceRow[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
  stats: TreasuryGlobalBalancesStats;
  appliedFilters: {
    currency: string | null;
    accountKey: string | null;
    contactType: string | null;
    balanceState: TreasuryBalanceState | null;
    search: string | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
}
export interface TreasuryContactBalanceSummaryTotals {
  amount: number;
  count: number;
}
export interface TreasuryContactBalanceSummary {
  balance: {
    amount: number;
    currency: string;
  };
  variation: {
    windowDays: number;
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    currentPeriodNet: number;
    previousPeriodNet: number;
  } | null;
  totals: {
    balance: number;
    incoming: TreasuryContactBalanceSummaryTotals;
    outgoing: TreasuryContactBalanceSummaryTotals;
    net: number;
    lastMovementAt: string | null;
  };
}
export interface TreasuryContactBalanceOperation {
  id: string | null;
  createdAt: string | null;
  currency: string;
  amount: number;
  direction: 'incoming' | 'outgoing';
  operation: {
    type: string;
    code: string | null;
    source: string | null;
  };
  status: {
    key: string;
    label: string;
  };
}
export interface TreasuryContactBalanceFilterOptions {
  operationTypes: TreasuryGlobalBalancesFilterOption[];
  currencies: TreasuryGlobalBalancesFilterOption[];
  statuses: TreasuryGlobalBalancesFilterOption[];
}
export interface TreasuryContactBalanceFiltersApplied {
  currency: string | null;
  operationType: string | null;
  status: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  search: string | null;
}
export interface TreasuryContactBalanceDetailResponse {
  contact: {
    id: string;
    fullName: string;
    shortName: string;
    contactType: string;
    status: string;
    cuit: string | null;
    updatedAt: string | null;
  };
  summary: TreasuryContactBalanceSummary;
  filters: {
    options: TreasuryContactBalanceFilterOptions;
    applied: TreasuryContactBalanceFiltersApplied;
  };
  table: {
    items: TreasuryContactBalanceOperation[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
    sort: {
      sortBy: 'date' | 'amount' | 'type';
      sortDirection: 'asc' | 'desc';
    };
  };
  stats: {
    totalsByCurrency: Array<{ currency: string; total: number }>;
    totalOperations: number;
  };
}
export interface TreasuryLinkedBalanceDetailFilters {
  dateFrom: string | null;
  dateTo: string | null;
  type: string | null;
  contactId: string | null;
  defaults: {
    dateFrom: string;
    dateTo: string;
  };
}
export interface TreasuryLinkedBalanceDetailResponse {
  balance: Omit<TreasuryLinkedBalanceSummaryEntry, 'recentMovements' | 'contacts' | 'activity' | 'totals'> & {
    variation: TreasuryLinkedBalanceVariation;
  };
  filters: TreasuryLinkedBalanceDetailFilters;
  totals: TreasuryLinkedBalanceTotals;
  overallTotals: TreasuryLinkedBalanceTotals;
  movements: {
    items: TreasuryMovement[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
  contacts: TreasuryLinkedBalanceContactSummary[];
  activity: TreasuryLinkedBalanceActivityEntry[];
  recentMovements: TreasuryMovement[];
}
```

## File: client/src/utils/api.ts
```typescript
import { ApiError, RequestConfig } from '../types';
⋮----
// Get CSRF token from meta tag or cookie
const getCSRFToken = (): string | null =>
⋮----
// Try to get from meta tag first
⋮----
// Fallback to cookies: prefer 'finatech_csrf', then 'csrfToken'
⋮----
const getDefaultHeaders = (): Record<string, string> =>
const buildQueryString = (params?: Record<string, unknown>) =>
const createApiError = (payload: ApiError &
// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  config: Partial<RequestConfig> = {}
): Promise<T> =>
⋮----
export const handleApiError = (error: any): ApiError =>
```

## File: client/src/utils/balanceEvents.ts
```typescript
export const emitDashboardBalanceRefresh = () =>
export const subscribeDashboardBalanceRefresh = (handler: () => void) =>
⋮----
const listener = ()
⋮----
const clearReconnectTimer = () =>
const scheduleReconnect = () =>
const handleStreamMessage = (event: MessageEvent<string>) =>
const openBalanceStream = () =>
export const ensureDashboardBalanceStream = () =>
export const stopDashboardBalanceStream = () =>
```

## File: client/src/utils/index.ts
```typescript

```

## File: client/src/utils/infiniteLoopTester.ts
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from './performanceMonitor';
interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  metrics?: any;
  timestamp: number;
}
interface InfiniteLoopTestSuite {
  runAllTests: () => Promise<TestResult[]>;
  runSpecificTest: (testName: string) => Promise<TestResult>;
  getTestHistory: () => TestResult[];
  clearHistory: () => void;
}
export const createInfiniteLoopTestSuite = (): InfiniteLoopTestSuite =>
⋮----
const addTestResult = (result: TestResult) =>
const testUseEffectStability = async (): Promise<TestResult> =>
⋮----
const TestComponent = () =>
⋮----
const unstableCallback = () =>
⋮----
const testPerformanceMonitoring = async (): Promise<TestResult> =>
const testErrorBoundaryIntegration = async (): Promise<TestResult> =>
const testMemoryLeakPrevention = async (): Promise<TestResult> =>
const testStateUpdateSafety = async (): Promise<TestResult> =>
const runAllTests = async (): Promise<TestResult[]> =>
const runSpecificTest = async (testName: string): Promise<TestResult> =>
const getTestHistory = (): TestResult[] =>
const clearHistory = (): void =>
⋮----
export const useInfiniteLoopTester = () =>
export const addTestControls = () =>
⋮----
const updateTestResults = (results: TestResult[]) =>
```

## File: client/src/utils/performanceMonitor.ts
```typescript
import { useEffect, useRef, useCallback } from 'react';
interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  slowRenders: number;
  fastRenders: number;
  renderHistory: Array<{
    timestamp: number;
    duration: number;
    props?: any;
    state?: any;
  }>;
}
interface PerformanceThresholds {
  slowRenderThreshold: number;
  maxRenderHistory: number;
  warningRenderCount: number;
  criticalRenderCount: number;
}
class PerformanceMonitor
⋮----
setThresholds(thresholds: Partial<PerformanceThresholds>)
startRender(componentName: string): () => void
private recordRender(componentName: string, duration: number, props?: any, state?: any)
private checkPerformanceIssues(metrics: PerformanceMetrics)
getMetrics(componentName?: string): PerformanceMetrics | Map<string, PerformanceMetrics>
private createEmptyMetrics(componentName: string): PerformanceMetrics
generateReport(): string
reset(componentName?: string)
⋮----
export const usePerformanceMonitor = (
  componentName: string,
  props?: any,
  state?: any
) =>
export const useRenderLoopDetector = (
  componentName: string,
  maxRendersPerSecond: number = 60
) =>
```

## File: client/src/utils/renderLogger.ts
```typescript
import { useEffect, useRef, useCallback } from 'react';
interface ComponentStats {
  totalRenders: number;
  lastRender: number;
  renderHistory: number[];
  isLooping: boolean;
  loopDetectedAt?: number;
}
class RenderLogger
⋮----
static getInstance(): RenderLogger
private constructor()
private handleGlobalError(event: ErrorEvent)
private logInfiniteLoopError()
logRender(componentName: string, props?: any, state?: any, reason?: string)
private warnAboutPotentialLoop(
    componentName: string,
    stats: ComponentStats,
    props?: any,
    state?: any,
    reason?: string
)
getComponentStats(componentName?: string)
clearLogs()
getLoopingComponents()
setEnabled(enabled: boolean)
setLoopThreshold(threshold: number)
setLoopTimeWindow(window: number)
⋮----
export const useRenderLogger = (
  componentName: string,
  props?: any,
  state?: any,
  dependencies?: any[]
) =>
export const useEffectLogger = (
  effect: React.EffectCallback,
  deps: React.DependencyList | undefined,
  componentName: string
) =>
export const usePerformanceMonitor = (componentName: string) =>
```

## File: client/src/utils/useEffectGuard.ts
```typescript
import React, { useEffect, useRef, useCallback } from 'react';
interface UseEffectGuardOptions {
  maxExecutions?: number;
  timeWindow?: number;
  componentName?: string;
  onLoopDetected?: (componentName: string, executions: number) => void;
}
export const useEffectGuard = (
  effect: React.EffectCallback,
  deps: React.DependencyList | undefined,
  options: UseEffectGuardOptions = {}
) =>
export const useDependencyTracker = (
  deps: React.DependencyList | undefined,
  componentName: string = 'Unknown Component'
) =>
export const useRenderSafeState = <T>(
  initialState: T | (() => T),
  componentName: string = 'Unknown Component'
) =>
export const useCascadeGuard = (
  componentName: string = 'Unknown Component',
  maxCascadeDepth: number = 5
) =>
```

## File: client/src/utils/validation.ts
```typescript
import { PasswordRequirements, FormErrors } from '../types';
export const validateEmail = (email: string): boolean =>
export const validatePasswordRequirements = (password: string): PasswordRequirements =>
export const isPasswordValid = (password: string): boolean =>
export const validateFullName = (fullName: string): boolean =>
export const validateLoginForm = (email: string, password: string): FormErrors =>
export const validateRegistrationForm = (
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  agreeToTerms: boolean
): FormErrors =>
export const validateTwoFactorCode = (code: string): FormErrors =>
export const hasFormErrors = (errors: FormErrors): boolean =>
```

## File: package.json
```json
{
  "name": "finatech",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon --config nodemon.json src/server.js",
    "start": "node src/server.js",
    "build": "cd client && npm install && npm run build",
    "lint": "npm run lint:server && npm run lint:client",
    "lint:server": "eslint src --ext .js",
    "lint:client": "cd client && npm run lint",
    "test": "npm run test:unit",
    "test:unit": "node --test tests/unit/**/*.test.js",
    "test:e2e": "playwright test"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.1.0",
    "express-validator": "^7.2.1",
    "google-auth-library": "^10.4.1",
    "mongoose": "^8.19.1",
    "nodemailer": "^7.0.9"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.1",
    "eslint": "^8.57.1",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-n": "^17.23.1",
    "mongodb-memory-server": "^9.5.0",
    "nodemon": "^3.1.10"
  }
}
```

## File: src/app.js
```javascript
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(ensureCsrfCookie());
app.use(requestLogger);
app.get('/api/test', (_req, res) => {
res.json({ status: 'ok', message: 'Test endpoint working' });
⋮----
app.get('/api/config', (_req, res) => {
res.json({
⋮----
googleMapsEnabled: Boolean(process.env.GOOGLE_MAPS_API_KEY),
⋮----
console.log('[APP] Applying CSRF protection to /api routes');
app.use('/api', (req, res, next) => {
console.log(`[APP] CSRF middleware called for ${req.method} ${req.path}`);
return csrfProtect()(req, res, next);
⋮----
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/current-accounts', currentAccountRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/rates', ratesRoutes);
app.get('/', (_req, res) => {
res.json({ status: 'ok', message: 'API running' });
⋮----
app.use(errorHandler);
```

## File: src/config/database.js
```javascript
const connectDatabase = async () => {
⋮----
throw new Error('Missing MONGODB_URI environment variable');
⋮----
mongoose.set('strictQuery', true);
await mongoose.connect(MONGODB_URI, {
serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 20,
connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 5000,
socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 20000,
⋮----
console.log('MongoDB connected');
```

## File: src/controllers/auth.controller.js
```javascript
const buildProfile = (user) => {
⋮----
id: user._id.toString(),
⋮----
permissions: Array.isArray(user.permissions) ? user.permissions : [],
providers: Array.isArray(user.providers)
? user.providers.map((provider) => ({
⋮----
const register = async (req, res, next) => {
⋮----
const context = { ip: req.ip, userAgent: req.get('user-agent') };
const result = await registerLocal({ fullName, email, password }, context);
⋮----
attachAuthCookie(res, session.sessionToken, { remember: session.rememberMe });
⋮----
res.status(status).json({
⋮----
profile: buildProfile(user),
⋮----
next(error);
⋮----
const verifyEmail = async (req, res, next) => {
⋮----
const result = await verifyEmailToken({ token }, context);
const accept = req.accepts(['html', 'json']);
⋮----
res.send(`
⋮----
res.json({
⋮----
profile: buildProfile(result.user),
⋮----
const googleAuth = async (req, res, next) => {
⋮----
const result = await registerWithGoogle({ idToken: token }, context);
⋮----
const login = async (req, res, next) => {
⋮----
const result = await loginWithEmail({ email, password, rememberMe }, context);
⋮----
const verifyTwoFactor = async (req, res, next) => {
⋮----
const result = await verifyTwoFactorChallenge({ challengeToken: normalizedChallenge, code }, context);
⋮----
const resendVerification = async (req, res, next) => {
⋮----
const result = await resendVerificationEmail({ email }, context);
res.json(result);
⋮----
const resendTwoFactor = async (req, res, next) => {
⋮----
const result = await resendTwoFactorCode({ challengeToken: normalizedChallenge }, context);
res.json({ success: true, ...result });
⋮----
const profile = async (req, res) => {
res.json({ profile: buildProfile(req.user) });
⋮----
const logout = async (req, res, next) => {
⋮----
clearAuthCookie(res);
res.status(204).send();
⋮----
setImmediate(() => {
deleteSessionByToken(sessionToken).catch((error) => {
console.error('Failed to delete session on logout', error);
⋮----
const recoverPassword = async (req, res, next) => {
⋮----
const result = await requestPasswordReset({ email }, context);
⋮----
const validateResetToken = async (req, res, next) => {
⋮----
const result = await validatePasswordResetToken({ token }, context);
⋮----
const resetPasswordController = async (req, res, next) => {
⋮----
const result = await resetPassword({ token, password }, context);
```

## File: src/controllers/client.controller.js
```javascript
const listClients = async (req, res, next) => {
⋮----
const results = await searchClients({
⋮----
limit: limit ? Number(limit) : undefined,
⋮----
res.json({ items: results });
⋮----
next(error);
⋮----
const findClient = async (req, res, next) => {
⋮----
const client = await getClientById(id);
⋮----
res.status(404).json({ message: 'Cliente no encontrado' });
⋮----
res.json(client);
⋮----
const createClientHandler = async (req, res, next) => {
const result = validationResult(req);
if (!result.isEmpty()) {
res.status(400).json({
⋮----
errors: result.array().map((error) => ({
⋮----
const client = await createClient(req.body);
res.status(201).json(client);
⋮----
res.status(409).json({
⋮----
field: Object.keys(error.keyPattern || {})[0] || 'cuit',
⋮----
errors: Object.entries(error.errors || {}).map(([field, detail]) => ({
```

## File: src/controllers/currentAccount.controller.js
```javascript
const summary = async (req, res, next) => {
⋮----
const data = await getCurrentAccountSummary({ topContacts });
res.json(data);
⋮----
next(error);
⋮----
const movements = async (req, res, next) => {
⋮----
const data = await listCurrentAccountMovements({ ledger, currency, limit, skip });
⋮----
const listContacts = async (req, res, next) => {
⋮----
const data = await listContactBalancesDetailed({
⋮----
const contactDetail = async (req, res, next) => {
⋮----
const data = await getContactBalanceDetail({
```

## File: src/controllers/geocoding.controller.js
```javascript
const autocomplete = async (req, res, next) => {
⋮----
const result = await getAddressPredictions(String(input || ''));
res.json({
⋮----
next(error);
```

## File: src/controllers/logistics.controller.js
```javascript
const parseFiltersFromQuery = (query) => ({
⋮----
const parsePaginationFromQuery = (query) => ({
page: query.page ? Number(query.page) : undefined,
limit: query.limit ? Number(query.limit) : undefined,
⋮----
const getLogisticsOperations = async (req, res, next) => {
⋮----
const filters = parseFiltersFromQuery(req.query || {});
const pagination = parsePaginationFromQuery(req.query || {});
const result = await listOperations({ filters, ...pagination });
res.json(result);
⋮----
next(error);
⋮----
const getLogisticsOperationById = async (req, res, next) => {
⋮----
const operation = await getOperationById(req.params.id);
⋮----
return res.status(404).json({ message: 'Operación logística no encontrada' });
⋮----
res.json(operation);
⋮----
const createLogisticsOperation = async (req, res, next) => {
⋮----
const operation = await createOperation(req.body || {});
res.status(201).json(operation);
⋮----
const patchLogisticsOperationState = async (req, res, next) => {
⋮----
const operation = await updateOperationState(req.params.id, req.body || {});
```

## File: src/controllers/transaction.controller.js
```javascript
const createDraft = async (req, res, next) => {
⋮----
const errors = validationResult(req);
if (!errors.isEmpty()) {
res.status(400).json({ errors: errors.array() });
⋮----
const transaction = await createTransactionDraft(req.body, context);
const payload = await buildWizardDraftResponse(transaction);
res.status(201).json(payload);
⋮----
next(error);
⋮----
const getDraft = async (req, res, next) => {
⋮----
throw new AppError('Autenticación requerida', 401);
⋮----
const transaction = await getTransactionDraft(id, userId);
⋮----
throw new AppError('Transacción no encontrada', 404);
⋮----
res.json(payload);
⋮----
const updateDraftData = async (req, res, next) => {
⋮----
const transaction = await updateTransactionDraft(id, req.body, context);
⋮----
const updateSettlement = async (req, res, next) => {
⋮----
const transaction = await updateTransactionSettlement(id, req.body, context);
⋮----
const advanceDraftStep = async (req, res, next) => {
⋮----
const transaction = await advanceTransactionStep(id, step, context);
⋮----
const finalizeDraft = async (req, res, next) => {
⋮----
const transaction = await finalizeTransaction(id, context);
⋮----
const voidDraft = async (req, res, next) => {
⋮----
const transaction = await voidTransaction(id, reason, context);
```

## File: src/controllers/transfer.controller.js
```javascript
const createTransferOperation = async (req, res, next) => {
⋮----
const errors = validationResult(req);
if (!errors.isEmpty()) {
res.status(400).json({ errors: errors.array() });
⋮----
const result = await registerTransferOperation(req.body, context);
res.status(201).json(result);
⋮----
next(error);
⋮----
const fetchTransferOperation = async (req, res, next) => {
⋮----
const operation = await getTransferOperationById(id);
⋮----
throw new AppError('Transferencia no encontrada.', 404);
⋮----
res.json(operation);
⋮----
const listTransferOperationsHandler = async (req, res, next) => {
⋮----
await sendCached({
⋮----
compute: async () => {
const operations = await listTransferOperations({
```

## File: src/controllers/treasury.controller.js
```javascript
const parseFilters = (query) => {
⋮----
if (query.type) filters.type = String(query.type).toLowerCase();
if (query.medium) filters.medium = String(query.medium).toLowerCase();
if (query.currency) filters.currency = String(query.currency).toUpperCase();
if (query.status) filters.status = String(query.status).toLowerCase();
⋮----
const balances = async (_req, res, next) => {
⋮----
const balancesData = await getTreasuryBalances();
res.json({ balances: balancesData });
⋮----
next(error);
⋮----
const linkedBalancesSummary = async (_req, res, next) => {
⋮----
const summary = await getLinkedBalancesSummary();
res.json(summary);
⋮----
const linkedBalanceDetail = async (req, res, next) => {
⋮----
const result = await getLinkedBalanceDetail(req.params.balanceKey || req.params.id, {
⋮----
res.json(result);
⋮----
const list = async (req, res, next) => {
⋮----
const filters = parseFilters(filterQuery);
const result = await listTreasuryMovements({
⋮----
const create = async (req, res, next) => {
⋮----
const result = await registerTreasuryMovement(req.body, {
⋮----
res.status(201).json(result);
⋮----
const detail = async (req, res, next) => {
⋮----
const movement = await getTreasuryMovementById(req.params.movementId || req.params.id);
res.json({ movement });
⋮----
const compensate = async (req, res, next) => {
⋮----
const movement = await compensateTreasuryMovement(req.params.movementId || req.params.id, req.body, {
⋮----
const cancel = async (req, res, next) => {
⋮----
const movement = await cancelTreasuryMovement(req.params.movementId || req.params.id, req.body, {
⋮----
const suggestions = async (req, res, next) => {
⋮----
const result = await suggestCompensationsForMovement(
⋮----
const globalOverview = async (req, res, next) => {
⋮----
const result = await getGlobalBalancesOverview({
⋮----
const contactBalanceDetail = async (req, res, next) => {
⋮----
const result = await getContactBalanceDetail(req.params.contactId || req.params.id, {
```

## File: src/middleware/csrf.js
```javascript
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
⋮----
function generateCsrfToken() {
return crypto.randomBytes(32).toString('hex');
⋮----
function ensureCsrfCookie(options = {}) {
⋮----
const token = generateCsrfToken();
⋮----
(process.env.NODE_ENV === 'production' && req.hostname?.split('.').slice(-2).join('.') !== 'localhost'
? `.${req.hostname.split('.').slice(-2).join('.')}`
⋮----
res.cookie(cookieName, token, {
⋮----
next();
⋮----
function csrfProtect(options = {}) {
⋮----
console.log(`[CSRF] Processing ${req.method} ${req.path}`);
if (SAFE_METHODS.has(req.method)) {
console.log('[CSRF] Safe method, skipping');
return next();
⋮----
if (excludedPaths.some((path) => url.startsWith(path))) {
console.log(`[CSRF] Excluded path ${url}, skipping`);
⋮----
console.log('[CSRF] Checking tokens...');
⋮----
const headerToken = req.get('X-CSRF-Token') || req.get('X-CSRF');
console.log(`[CSRF] Cookie token: ${cookieToken ? 'present' : 'missing'}`);
console.log(`[CSRF] Header token: ${headerToken ? 'present' : 'missing'}`);
⋮----
console.log('[CSRF] Rejecting: no cookie token');
return res.status(403).json({
⋮----
console.log('[CSRF] Rejecting: no header token');
⋮----
console.log('[CSRF] Rejecting: token mismatch');
⋮----
console.log('[CSRF] Tokens match, proceeding');
```

## File: src/middleware/errorHandler.js
```javascript
const errorHandler = (err, _req, res, _next) => {
console.error(err);
⋮----
res.status(status).json({ message, code, details });
```

## File: src/middleware/rateLimiter.js
```javascript
const authLimiter = rateLimit({
⋮----
max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
```

## File: src/middleware/requestLogger.js
```javascript
const requestLogger = (req, _res, next) => {
⋮----
console.log(`[${new Date().toISOString()}] ${method} ${originalUrl}`);
next();
```

## File: src/middleware/requireAuth.js
```javascript
const requireAuth = async (req, _res, next) => {
⋮----
throw new AppError('Authentication required', 401);
⋮----
const session = await findSessionByToken(sessionToken);
if (!session || session.expiresAt < new Date()) {
⋮----
await deleteSessionByToken(sessionToken);
⋮----
next();
⋮----
next(error);
```

## File: src/middleware/requirePermission.js
```javascript
const normalizePermission = (permission) =>
(typeof permission === 'string' ? permission.trim() : '').toLowerCase();
const toPermissionList = (permission) => {
if (Array.isArray(permission)) {
⋮----
.map(normalizePermission)
.filter(Boolean);
⋮----
const normalized = normalizePermission(permission);
⋮----
const requirePermission = (permission) => {
const required = toPermissionList(permission);
⋮----
throw new Error('Permission name is required');
⋮----
const permissions = Array.isArray(req.user?.permissions)
? req.user.permissions.map(normalizePermission)
⋮----
const hasPermission = required.some((perm) => permissions.includes(perm));
⋮----
throw new AppError('No tenés permisos suficientes para realizar esta acción.', 403);
⋮----
next();
⋮----
next(error);
```

## File: src/middleware/validateRequest.js
```javascript
const validateRequest = (req, _res, next) => {
const errors = validationResult(req);
if (errors.isEmpty()) {
return next();
⋮----
const formatted = errors.array().map((error) => ({
⋮----
next(new AppError('Validación fallida', 422, formatted));
```

## File: src/models/Client.js
```javascript
const addressSchema = new mongoose.Schema(
⋮----
const clientSchema = new mongoose.Schema(
⋮----
clientSchema.index({ fullName: 'text', shortName: 'text', cuit: 'text', firstName: 'text', lastName: 'text' });
clientSchema.virtual('displayName').get(function displayName() {
⋮----
clientSchema.pre('validate', function updateDerivedNames(next) {
⋮----
this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
⋮----
next();
⋮----
module.exports = mongoose.model('Client', clientSchema);
```

## File: src/models/ContactBalance.js
```javascript
const contactBalanceSchema = new mongoose.Schema(
⋮----
contactBalanceSchema.index({ contact: 1, currency: 1 }, { unique: true });
contactBalanceSchema.pre('save', function roundAmount(next) {
if (Number.isFinite(this.amount)) {
this.amount = Math.round(Number(this.amount) * 100) / 100;
⋮----
next();
⋮----
module.exports = mongoose.model('ContactBalance', contactBalanceSchema);
```

## File: src/models/CurrentAccountBalance.js
```javascript
const currentAccountBalanceSchema = new mongoose.Schema(
⋮----
currentAccountBalanceSchema.index({ accountKey: 1, currency: 1 }, { unique: true });
currentAccountBalanceSchema.pre('save', function roundAmount(next) {
if (Number.isFinite(this.amount)) {
this.amount = Math.round(Number(this.amount) * 100) / 100;
⋮----
next();
⋮----
module.exports = mongoose.model('CurrentAccountBalance', currentAccountBalanceSchema);
```

## File: src/models/CurrentAccountMovement.js
```javascript
const operationReferenceSchema = new mongoose.Schema(
⋮----
const counterpartSchema = new mongoose.Schema(
⋮----
const currentAccountMovementSchema = new mongoose.Schema(
⋮----
default: () => ({}),
⋮----
currentAccountMovementSchema.index({ ledger: 1, currency: 1, createdAt: -1 });
currentAccountMovementSchema.index({ 'operation.id': 1, ledger: 1 });
currentAccountMovementSchema.index({ contact: 1, currency: 1, createdAt: -1 });
module.exports = mongoose.model('CurrentAccountMovement', currentAccountMovementSchema);
```

## File: src/models/LogisticsOperation.js
```javascript
const amountSchema = new mongoose.Schema(
⋮----
const timelineStepSchema = new mongoose.Schema(
⋮----
const attachmentSchema = new mongoose.Schema(
⋮----
const logisticsOperationSchema = new mongoose.Schema(
⋮----
default: () => ({ value: null, currency: 'ARS' }),
⋮----
logisticsOperationSchema.index({ scheduledAt: -1 });
logisticsOperationSchema.index({ state: 1, scheduledAt: -1 });
logisticsOperationSchema.index({ type: 1, scheduledAt: -1 });
logisticsOperationSchema.index({ contactName: 1 });
logisticsOperationSchema.index({ responsibleName: 1 });
module.exports = mongoose.model('LogisticsOperation', logisticsOperationSchema);
```

## File: src/models/MarketRateOverride.js
```javascript
const marketRateOverrideSchema = new mongoose.Schema(
⋮----
marketRateOverrideSchema.index({ baseAsset: 1, quoteAsset: 1, validFrom: -1 });
module.exports = mongoose.model('MarketRateOverride', marketRateOverrideSchema);
```

## File: src/models/Notification.js
```javascript
const notificationSchema = new mongoose.Schema(
⋮----
notificationSchema.index({ createdAt: -1 });
const Notification = mongoose.model('Notification', notificationSchema);
```

## File: src/models/NotificationState.js
```javascript
const notificationStateSchema = new mongoose.Schema(
⋮----
default: () => new Date(),
⋮----
notificationStateSchema.index({ user: 1, notificationId: 1 }, { unique: true });
const NotificationState = mongoose.model('NotificationState', notificationStateSchema);
```

## File: src/models/SecurityLog.js
```javascript
const securityLogSchema = new mongoose.Schema(
⋮----
const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
```

## File: src/models/Session.js
```javascript
const sessionSchema = new mongoose.Schema(
⋮----
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Session = mongoose.model('Session', sessionSchema);
```

## File: src/models/Transaction.js
```javascript
const assetSchema = new mongoose.Schema(
⋮----
const transactionSchema = new mongoose.Schema(
⋮----
new mongoose.Schema(
⋮----
default: () => new Date(),
⋮----
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ client: 1, createdAt: -1 });
transactionSchema.index({ status: 1, currentStep: 1 });
transactionSchema.pre('validate', function applySettlementDefaults(next) {
⋮----
if (!Array.isArray(this.settlement.lines)) {
⋮----
next();
⋮----
transactionSchema.index({ operationCode: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Transaction', transactionSchema);
```

## File: src/models/TransferOperation.js
```javascript
const distributionLineSchema = new mongoose.Schema(
⋮----
default() {
return Number(this.amount || 0);
⋮----
const transferOperationSchema = new mongoose.Schema(
⋮----
validator(lines) {
if (!Array.isArray(lines) || lines.length === 0) {
⋮----
const sum = lines.reduce(
(acc, line) => acc + Number(line.amountArs != null ? line.amountArs : line.amount || 0),
⋮----
const total = Number(this.totalAmount || 0);
return Math.abs(sum - total) < 0.01;
⋮----
transferOperationSchema.index({ movementType: 1, direction: 1, createdAt: -1 });
transferOperationSchema.index({ confirmedAt: -1 });
transferOperationSchema.index({ operationCode: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('TransferOperation', transferOperationSchema);
```

## File: src/models/TreasuryBalance.js
```javascript
const treasuryBalanceSchema = new mongoose.Schema(
⋮----
treasuryBalanceSchema.index({ key: 1, currency: 1 }, { unique: true });
treasuryBalanceSchema.pre('save', function roundAmount(next) {
if (Number.isFinite(this.amount)) {
this.amount = Math.round(Number(this.amount) * 100) / 100;
⋮----
next();
⋮----
module.exports = mongoose.model('TreasuryBalance', treasuryBalanceSchema);
```

## File: src/models/TreasuryEvent.js
```javascript
const treasuryEventSchema = new mongoose.Schema(
⋮----
new mongoose.Schema(
⋮----
treasuryEventSchema.index({ type: 1, status: 1, createdAt: 1 });
treasuryEventSchema.index({ 'operation.id': 1, type: 1 });
module.exports = mongoose.model('TreasuryEvent', treasuryEventSchema);
```

## File: src/models/TreasuryMovement.js
```javascript
const movementOperationSchema = new mongoose.Schema(
⋮----
const auditLogSchema = new mongoose.Schema(
⋮----
default: () => new Date(),
⋮----
const treasuryMovementSchema = new mongoose.Schema(
⋮----
treasuryMovementSchema.index({ movementCode: 1 }, { unique: true });
treasuryMovementSchema.index({ movementAt: -1 });
treasuryMovementSchema.index({ status: 1, movementAt: -1 });
treasuryMovementSchema.index({ currency: 1, movementAt: -1 });
treasuryMovementSchema.index({ medium: 1, movementAt: -1 });
treasuryMovementSchema.index({ contact: 1, movementAt: -1 });
treasuryMovementSchema.index({ currency: 1, type: 1, movementAt: -1 });
treasuryMovementSchema.index(
⋮----
treasuryMovementSchema.pre('validate', function assignBalanceKey(next) {
⋮----
next();
⋮----
treasuryMovementSchema.pre('save', function roundAmount(next) {
if (Number.isFinite(this.amount)) {
this.amount = Math.round(Number(this.amount) * 100) / 100;
⋮----
module.exports = mongoose.model('TreasuryMovement', treasuryMovementSchema);
```

## File: src/models/TwoFactorChallenge.js
```javascript
const twoFactorChallengeSchema = new mongoose.Schema(
⋮----
twoFactorChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const TwoFactorChallenge = mongoose.model('TwoFactorChallenge', twoFactorChallengeSchema);
```

## File: src/models/User.js
```javascript
const providerSchema = new mongoose.Schema(
⋮----
const userSchema = new mongoose.Schema(
⋮----
return this.providers.some((item) => item.provider === provider);
⋮----
if (!this.hasProvider(provider)) {
this.providers.push({ provider, providerId });
⋮----
const User = mongoose.model('User', userSchema);
```

## File: src/routes/auth.routes.js
```javascript
const router = Router();
const passwordValidator = (value) => {
⋮----
const hasUppercase = /[A-Z]/.test(value);
const hasLowercase = /[a-z]/.test(value);
const hasNumber = /\d/.test(value);
⋮----
throw new Error('La contraseña no cumple con la complejidad requerida.');
⋮----
body('fullName').trim().notEmpty().withMessage('El nombre completo es obligatorio.'),
body('email').isEmail().withMessage('Ingresá un correo electrónico válido.').normalizeEmail(),
body('password').isString().custom(passwordValidator),
body('confirmPassword')
.custom((value, { req }) => value === req.body.password)
.withMessage('Las contraseñas no coinciden.'),
body('acceptTerms')
.toBoolean()
.isBoolean()
.withMessage('Debés aceptar los términos y condiciones.')
.custom((value) => value === true)
.withMessage('Debés aceptar los términos y condiciones.'),
⋮----
body().custom((value, { req }) => {
⋮----
throw new Error('Se requiere el token de Google ID (idToken o credential).');
⋮----
body('idToken').optional().isString().withMessage('El idToken debe ser una cadena.'),
body('credential').optional().isString().withMessage('El credential debe ser una cadena.'),
⋮----
body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
body('rememberMe').optional().isBoolean().withMessage('Recordarme debe ser un booleano.').toBoolean(),
⋮----
const challengeTokenPresenceValidator = body().custom((_, { req }) => {
⋮----
if (typeof challengeToken === 'string' && challengeToken.trim().length > 0) {
⋮----
if (typeof challengeId === 'string' && challengeId.trim().length > 0) {
⋮----
throw new Error('Se requiere el token del desafío de dos pasos.');
⋮----
const challengeTokenFormatValidator = body('challengeToken')
.optional()
.isString()
.withMessage('El token del desafío debe ser una cadena.')
.trim()
.notEmpty()
.withMessage('El token del desafío no puede estar vacío.');
const challengeIdFormatValidator = body('challengeId')
⋮----
body('code')
⋮----
.matches(/^\d{6}$/)
.withMessage('Ingresá un código válido de 6 dígitos.'),
⋮----
body('token').isString().withMessage('Se requiere el token de restablecimiento de contraseña.'),
⋮----
router.post('/register', authLimiter, ...registerValidators, validateRequest, register);
router.get('/verify-email', verifyEmail);
router.post('/google', authLimiter, ...googleValidators, validateRequest, googleAuth);
router.get('/google', (req, res) => {
⋮----
const redirectUrl = new URL('/login', clientBase);
redirectUrl.searchParams.set('provider', 'google');
res.redirect(302, redirectUrl.toString());
⋮----
router.get('/google/callback', (req, res) => {
⋮----
redirectUrl.searchParams.set('oauth', 'completed');
⋮----
router.post('/login', authLimiter, ...loginValidators, validateRequest, login);
router.post('/login/2fa', authLimiter, ...twoFactorValidators, validateRequest, verifyTwoFactor);
router.post(
⋮----
router.get('/me', requireAuth, profile);
router.post('/logout', requireAuth, logout);
router.post('/recover', authLimiter, ...recoverValidators, validateRequest, recoverPassword);
router.get('/reset/validate', authLimiter, validateResetToken);
router.post('/reset', authLimiter, ...resetPasswordValidators, validateRequest, resetPassword);
router.post('/test-csrf', (req, res) => {
console.log('[ROUTE] test-csrf route reached');
res.json({ status: 'ok', message: 'CSRF protection working', body: req.body });
```

## File: src/routes/client.routes.js
```javascript
const router = Router();
router.get('/', listClients);
router.get('/:id', findClient);
router.post(
⋮----
body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio.'),
body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio.'),
body('internalOwner').trim().notEmpty().withMessage('Indicá el responsable interno.'),
body('contactType')
.trim()
.notEmpty()
.withMessage('Seleccioná el tipo de contacto.')
.bail()
.isIn(['client', 'provider'])
.withMessage('Tipo de contacto inválido.'),
body('primaryAddress').optional({ values: 'falsy' }).isObject().withMessage('Dirección inválida.'),
body('secondaryAddress').optional({ values: 'falsy' }).isObject().withMessage('Dirección inválida.'),
```

## File: src/routes/currentAccount.routes.js
```javascript
const router = Router();
router.use(requireAuth, requirePermission('view-balances'));
router.get('/summary', summary);
router.get('/movements', movements);
router.get('/contacts', listContacts);
router.get('/contacts/:contactId', contactDetail);
```

## File: src/routes/dashboard.routes.js
```javascript
const router = Router();
const formatNotification = (notification, readSet = new Set()) => {
const id = notification._id.toString();
⋮----
read: readSet.has(id),
⋮----
const seedDefaultNotificationsIfEmpty = async () => {
const count = await Notification.estimatedDocumentCount();
⋮----
const now = new Date();
const minutesAgo = (minutes) => new Date(now.getTime() - minutes * 60 * 1000);
⋮----
createdAt: minutesAgo(5),
updatedAt: minutesAgo(5),
⋮----
createdAt: minutesAgo(18),
updatedAt: minutesAgo(18),
⋮----
createdAt: minutesAgo(42),
updatedAt: minutesAgo(42),
⋮----
createdAt: minutesAgo(120),
updatedAt: minutesAgo(120),
⋮----
await Notification.insertMany(defaults);
⋮----
router.get(
⋮----
requirePermission('view-balances'),
⋮----
const balances = await getTreasuryBalances();
res.json({ balances });
⋮----
next(error);
⋮----
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
⋮----
res.flushHeaders();
⋮----
res.write('\n');
⋮----
const cleanup = () => {
⋮----
clearInterval(heartbeat);
unsubscribe();
res.end();
⋮----
const send = (payload) => {
⋮----
res.write(`event: balance-update\n`);
res.write(`data: ${JSON.stringify(payload)}\n\n`);
⋮----
cleanup();
⋮----
const sendHeartbeat = () => {
⋮----
res.write(': keep-alive\n\n');
⋮----
const unsubscribe = subscribeBalanceUpdated((payload) => {
send({
⋮----
const heartbeat = setInterval(sendHeartbeat, 30000);
⋮----
timestamp: new Date().toISOString(),
⋮----
req.on('close', cleanup);
req.on('error', cleanup);
⋮----
const notificationsLimiter = rateLimit({
⋮----
keyGenerator: (req) => {
⋮----
const userKey = userId ? String(userId) : ipKeyGenerator(req.ip);
⋮----
body('title').isString().trim().notEmpty().withMessage('El título es obligatorio.'),
body('message').isString().trim().notEmpty().withMessage('La descripción es obligatoria.'),
body('severity')
.optional()
.isIn(['info', 'success', 'warning', 'error'])
.withMessage('La severidad es inválida.'),
body('actionLabel')
⋮----
.isString()
.trim()
.isLength({ max: 120 })
.withMessage('La etiqueta de acción es demasiado larga.'),
body('actionUrl')
⋮----
.isLength({ max: 1024 })
.withMessage('La URL de acción es demasiado larga.'),
body('metadata')
⋮----
.custom((value, { req }) => {
⋮----
req.body.metadata = JSON.parse(value);
⋮----
throw new Error('El metadata debe ser un objeto JSON válido.');
⋮----
throw new Error('El metadata debe ser un objeto.');
⋮----
router.get('/notifications', requireAuth, notificationsLimiter, async (req, res, next) => {
⋮----
await seedDefaultNotificationsIfEmpty();
const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
⋮----
const since = req.query.since ? new Date(req.query.since) : null;
⋮----
if (since && !Number.isNaN(since.getTime())) {
⋮----
const notifications = await Notification.find(match)
.sort({ createdAt: -1 })
.limit(limit)
.lean()
.exec();
const ids = notifications.map((notification) => notification._id.toString());
let readSet = new Set();
⋮----
const readStates = await NotificationState.find({
⋮----
readSet = new Set(readStates.map((state) => state.notificationId));
⋮----
let payload = notifications.map((notification) => formatNotification(notification, readSet));
⋮----
payload = payload.filter((notification) => !notification.read);
⋮----
res.json({ notifications: payload });
⋮----
router.post('/notifications/:id/read', requireAuth, async (req, res, next) => {
⋮----
return res.status(400).json({ message: 'El identificador de la notificación es obligatorio.' });
⋮----
if (!mongoose.Types.ObjectId.isValid(id)) {
return res.status(400).json({ message: 'Identificador inválido.' });
⋮----
const exists = await Notification.exists({ _id: id });
⋮----
return res.status(404).json({ message: 'Notificación no encontrada.' });
⋮----
await NotificationState.findOneAndUpdate(
⋮----
{ $set: { readAt: new Date() } },
⋮----
).exec();
res.json({ success: true });
⋮----
router.post('/notifications/read-all', requireAuth, async (req, res, next) => {
⋮----
const notifications = await Notification.find({}, { _id: 1 }).lean().exec();
⋮----
return res.json({ success: true });
⋮----
const bulkOperations = notifications.map((notification) => ({
⋮----
notificationId: notification._id.toString(),
⋮----
readAt: new Date(),
⋮----
await NotificationState.bulkWrite(bulkOperations, { ordered: false });
⋮----
router.post(
⋮----
requirePermission('manage-notifications'),
⋮----
const notification = await Notification.create({
⋮----
res.status(201).json({ notification: formatNotification(notification) });
⋮----
router.patch(
⋮----
param('id').isMongoId().withMessage('Identificador inválido.'),
body('title').optional().isString().trim().notEmpty().withMessage('El título no puede estar vacío.'),
body('message').optional().isString().trim().notEmpty().withMessage('La descripción no puede estar vacía.'),
⋮----
allowedFields.forEach((field) => {
⋮----
const notification = await Notification.findByIdAndUpdate(id, update, {
⋮----
res.json({ notification: formatNotification(notification) });
⋮----
router.delete(
⋮----
const notification = await Notification.findByIdAndDelete(id);
⋮----
await NotificationState.deleteMany({ notificationId: id });
res.status(204).send();
```

## File: src/routes/geocoding.routes.js
```javascript
const router = Router();
router.get('/autocomplete', autocomplete);
```

## File: src/routes/logistics.routes.js
```javascript
const router = Router();
router.get('/operations', getLogisticsOperations);
router.post('/operations', createLogisticsOperation);
router.get('/operations/:id', getLogisticsOperationById);
router.patch('/operations/:id/state', patchLogisticsOperationState);
```

## File: src/routes/rates.routes.js
```javascript
const router = Router();
router.put(
⋮----
requirePermission('manage-market-rates'),
body('baseAsset').isString().trim().notEmpty().withMessage('Indicá el activo base.'),
body('quoteAsset').isString().trim().notEmpty().withMessage('Indicá el activo de referencia.'),
body('rate').isFloat({ gt: 0 }).withMessage('Ingresá una tasa válida mayor a 0.'),
body('validFrom').optional().isISO8601().withMessage('La fecha de vigencia es inválida.'),
⋮----
const override = await saveManualMarketRate({
⋮----
res.json({ override });
⋮----
next(error);
⋮----
const marketLimiter = rateLimit({
⋮----
keyGenerator: (req) => {
⋮----
const userKey = userId ? String(userId) : ipKeyGenerator(req.ip);
⋮----
router.get('/market', requireAuth, marketLimiter, async (req, res, next) => {
⋮----
await sendCached({
⋮----
compute: async () => {
const override = await getLatestMarketRate({ baseAsset, quoteAsset });
```

## File: src/routes/transaction.routes.js
```javascript
const router = Router();
const assetValidators = (prefix) => [
body(`${prefix}.code`).isString().trim().notEmpty().withMessage('Asset code is required'),
body(`${prefix}.label`).isString().trim().notEmpty().withMessage('Asset label is required'),
⋮----
router.post(
⋮----
body('clientId').isString().notEmpty().withMessage('Client is required'),
body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
...assetValidators('incomingAsset'),
...assetValidators('outgoingAsset'),
body('apr').isFloat().withMessage('APR is required'),
body('marketApr').isFloat().withMessage('Market APR is required'),
body('incomingAmount').isFloat({ gt: 0 }).withMessage('Incoming amount must be greater than 0'),
body('outgoingAmount').isFloat({ gt: 0 }).withMessage('Outgoing amount must be greater than 0'),
⋮----
router.put(
⋮----
body('mode').optional().isIn(['simple', 'compound']).withMessage('El tipo de liquidación es inválido'),
body('simpleMethod')
.if((value, { req }) => (req.body.mode || 'simple') === 'simple')
.isString()
.trim()
.notEmpty()
.withMessage('Indicá el método de liquidación'),
body('lines')
.if((value, { req }) => (req.body.mode || 'simple') === 'compound')
.isArray({ min: 1 })
.withMessage('Agregá al menos una línea de liquidación'),
body('lines.*.method')
⋮----
.withMessage('Cada línea debe indicar un método'),
body('lines.*.allocationType')
⋮----
.isIn(['percentage', 'amount'])
.withMessage('El tipo de asignación debe ser porcentaje o monto'),
body('lines.*.value')
⋮----
.isFloat({ gt: 0 })
.withMessage('Las líneas deben tener un valor mayor a 0'),
⋮----
router.patch(
⋮----
body('step').isInt({ min: 1, max: 3 }).withMessage('Paso inválido.'),
⋮----
router.post('/draft/:id/finalize', requireAuth, finalizeDraft);
⋮----
body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('El motivo debe tener hasta 500 caracteres.'),
⋮----
router.get('/:id', requireAuth, getDraft);
```

## File: src/routes/transfer.routes.js
```javascript
const router = Router();
router.post(
⋮----
body('movementType')
.isIn(['cash', 'transfer'])
.withMessage('Seleccioná si la operación es en efectivo o transferencia.'),
body('direction')
.isIn(['incoming', 'outgoing'])
.withMessage('Indicá si la operación es entrante o saliente.'),
body('totalAmount')
.isFloat({ gt: 0 })
.withMessage('Ingresá un monto total válido, mayor a 0.'),
body('distributionLines')
.isArray({ min: 1 })
.withMessage('Agregá al menos una línea de distribución.'),
body('distributionLines.*.contactId')
.isMongoId()
.withMessage('Cada línea debe tener un contacto válido.'),
body('distributionLines.*.method')
.optional()
.isIn(['ARS', 'USD'])
.withMessage('El método debe ser ARS o USD.'),
body('distributionLines.*.amount')
⋮----
.withMessage('Los montos asignados deben ser mayores a 0.'),
body('exchangeRates.usdArs')
⋮----
.withMessage('La tasa USD/ARS debe ser mayor a 0.'),
⋮----
const transfersReadLimiter = rateLimit({
⋮----
keyGenerator: (req) => {
⋮----
const userKey = userId ? String(userId) : ipKeyGenerator(req.ip);
⋮----
router.get('/pesos', requireAuth, transfersReadLimiter, listTransferOperations);
router.get('/pesos/:id', requireAuth, fetchTransferOperation);
```

## File: src/routes/treasury.routes.js
```javascript
const router = Router();
⋮----
router.use(requireAuth);
router.get('/balances', requirePermission(VIEW_BALANCES_PERMISSIONS), balances);
router.get('/balances/overview', requirePermission(VIEW_BALANCES_PERMISSIONS), globalOverview);
router.get(
⋮----
requirePermission(VIEW_BALANCES_PERMISSIONS),
⋮----
router.get('/linked-balances', requirePermission(VIEW_BALANCES_PERMISSIONS), linkedBalancesSummary);
⋮----
requirePermission('access-treasury'),
⋮----
router.get('/movements', requirePermission('access-treasury'), list);
router.post('/movements', requirePermission('manage-treasury'), create);
router.get('/movements/:movementId', requirePermission('access-treasury'), detail);
router.post(
⋮----
requirePermission('manage-treasury'),
⋮----
router.post('/movements/:movementId/cancel', requirePermission('manage-treasury'), cancel);
```

## File: src/server.js
```javascript
require('dotenv').config();
⋮----
await connectDatabase();
await seedLogisticsOperations();
const server = http.createServer(app);
server.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
⋮----
console.error('Failed to start server', error);
process.exit(1);
```

## File: src/services/auth.service.js
```javascript
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
⋮----
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES) || 15;
⋮----
Number(process.env.TWO_FACTOR_CHALLENGE_DURATION_MINUTES) || 5;
⋮----
const PASSWORD_RESET_WINDOW_MINUTES = Number(process.env.PASSWORD_RESET_WINDOW_MINUTES) || 30;
const isTwoFactorEnabled = (user) => Boolean(user?.twoFactor?.enabled);
const ensureBaselinePermissions = (user) => {
⋮----
if (!Array.isArray(user.permissions)) {
⋮----
requiredPermissions.forEach((permission) => {
if (!user.permissions.includes(permission)) {
user.permissions.push(permission);
⋮----
const buildClientUrl = (path) => {
const normalizedPath = path.startsWith('/') ? path : `/${path}`;
⋮----
const isApiPath = normalizedPath.startsWith('/api/');
⋮----
return new URL(normalizedPath, base).toString();
⋮----
const buildRequestMetadata = (context = {}) => ({
⋮----
const generateTwoFactorCode = () => {
⋮----
return (Math.floor(Math.random() * (max - min)) + min).toString();
⋮----
const sendVerificationEmail = async (user, plainToken) => {
const verificationUrl = buildClientUrl(`/api/auth/verify-email?token=${plainToken}`);
⋮----
await sendEmail({
⋮----
throw new AppError(
⋮----
const sendTwoFactorCodeEmail = async (user, code) => {
⋮----
const sendAccountLockedEmail = async (user) => {
⋮----
const sendPasswordResetEmail = async (user, plainToken) => {
const resetUrl = buildClientUrl(`/reset?token=${plainToken}`);
⋮----
const ensureGoogleClient = () => {
⋮----
throw new AppError('Google OAuth no está configurado', 500, {
⋮----
const buildVerificationDetails = () => {
const plainToken = generateRandomToken(48);
⋮----
token: hashToken(plainToken),
expiresAt: new Date(Date.now() + VERIFICATION_WINDOW_MS),
⋮----
const buildPasswordResetDetails = () => {
⋮----
expiresAt: new Date(Date.now() + PASSWORD_RESET_WINDOW_MINUTES * 60 * 1000),
⋮----
const createTwoFactorChallenge = async ({ user, rememberMe, context }) => {
const plainToken = generateRandomToken(32);
const hashedToken = hashToken(plainToken);
const code = generateTwoFactorCode();
const codeHash = hashToken(code);
const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MINUTES * 60 * 1000);
await TwoFactorChallenge.deleteMany({ user: user._id });
await TwoFactorChallenge.create({
⋮----
rememberMe: Boolean(rememberMe),
metadata: buildRequestMetadata(context),
⋮----
sendTwoFactorCodeEmail(user, code).catch((err) => {
console.error('Failed to send 2FA code email', err);
⋮----
const issueSession = async ({ user, rememberMe = false, context }) => {
const metadata = buildRequestMetadata(context);
const { token, expiresAt, rememberMe: storedRemember } = await createSession({
⋮----
const registerLocal = async ({ fullName, email, password }, context = {}) => {
const normalizedEmail = email.trim().toLowerCase();
let user = await User.findOne({ email: normalizedEmail });
const requestMetadata = buildRequestMetadata(context);
⋮----
await logSecurityEvent({
⋮----
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
const { plainToken, verificationPayload } = buildVerificationDetails();
⋮----
user = await User.create({
⋮----
await sendVerificationEmail(user, plainToken);
⋮----
console.error('Failed to send verification email on registration', error);
⋮----
const appErr = new AppError(
⋮----
if (!user.isVerified && user.hasProvider('google')) {
ensureBaselinePermissions(user);
⋮----
user.addProvider('local');
⋮----
user.lastLoginAt = new Date();
⋮----
await user.save();
const session = await issueSession({ user, context, rememberMe: false });
⋮----
console.error('Failed to send verification email', error);
⋮----
const verifyEmailToken = async ({ token }, context = {}) => {
⋮----
throw new AppError('Se requiere el token de verificación', 400);
⋮----
const hashed = hashToken(token);
const user = await User.findOne({
⋮----
'verification.expiresAt': { $gt: new Date() },
⋮----
throw new AppError('Token inválido o vencido. Solicitá un nuevo correo de verificación.', 400, { code: 'INVALID_OR_EXPIRED_TOKEN' });
⋮----
...buildRequestMetadata(context),
⋮----
const authenticateGoogleToken = async (idToken) => {
const client = ensureGoogleClient();
const ticket = await client.verifyIdToken({
⋮----
return ticket.getPayload();
⋮----
const registerWithGoogle = async ({ idToken }, context = {}) => {
⋮----
throw new AppError('Se requiere el token de Google ID', 400, { code: 'GOOGLE_TOKEN_MISSING' });
⋮----
const payload = await authenticateGoogleToken(idToken);
⋮----
throw new AppError('El correo de la cuenta de Google no está verificado.', 400, {
⋮----
const normalizedEmail = email.toLowerCase();
⋮----
lastLoginAt: new Date(),
⋮----
const hadLocalProvider = user.hasProvider('local');
user.addProvider('google', sub);
⋮----
const loginWithEmail = async ({ email, password, rememberMe }, context = {}) => {
⋮----
const user = await User.findOne({ email: normalizedEmail });
⋮----
throw new AppError('Correo o contraseña incorrectos.', 401, { code: 'INVALID_CREDENTIALS' });
⋮----
if (user.lockUntil && user.lockUntil > new Date()) {
⋮----
throw new AppError('Demasiados intentos. Tu cuenta está bloqueada por 15 minutos.', 423, {
⋮----
const passwordMatches = await bcrypt.compare(password, user.passwordHash || '');
⋮----
const now = new Date();
⋮----
user.lockUntil = new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000);
⋮----
sendAccountLockedEmail(user).catch((err) => {
// eslint-disable-next-line no-console
console.error('Failed to send account locked email', err);
⋮----
provider: user.primaryProvider() || 'local',
⋮----
throw new AppError('Tu cuenta no está verificada.', 403, { code: 'ACCOUNT_NOT_VERIFIED' });
⋮----
if (isTwoFactorEnabled(user)) {
const { challengeToken, expiresAt } = await createTwoFactorChallenge({
⋮----
const session = await issueSession({ user, rememberMe, context });
⋮----
const verifyTwoFactorChallenge = async ({ challengeToken, code }, context = {}) => {
⋮----
throw new AppError('Se requieren el desafío de dos pasos y el código.', 400, {
⋮----
const hashedToken = hashToken(challengeToken);
const challenge = await TwoFactorChallenge.findOne({ token: hashedToken });
if (!challenge || challenge.expiresAt < new Date()) {
⋮----
await TwoFactorChallenge.deleteOne({ _id: challenge._id });
⋮----
throw new AppError('Código inválido o vencido.', 400, {
⋮----
const user = await User.findById(challenge.user);
⋮----
throw new AppError('Código inválido o vencido. Intentá nuevamente.', 400, {
⋮----
const rememberMe = Boolean(challenge.rememberMe);
⋮----
const metadata = challenge.metadata || buildRequestMetadata(context);
⋮----
const resendTwoFactorCode = async ({ challengeToken }, context = {}) => {
⋮----
throw new AppError('Se requiere el token del desafío de dos pasos.', 400, {
⋮----
throw new AppError('The verification window expired. Please start again.', 400, {
⋮----
challenge.codeHash = hashToken(code);
challenge.expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MINUTES * 60 * 1000);
challenge.metadata = buildRequestMetadata(context);
await challenge.save();
await sendTwoFactorCodeEmail(user, code);
⋮----
const resendVerificationEmail = async ({ email }, context = {}) => {
⋮----
console.error('Failed to resend verification email', error);
throw new AppError('No se pudo reenviar el email de verificación.', 502, {
⋮----
const requestPasswordReset = async ({ email }, context = {}) => {
const normalizedEmail = (email || '').trim().toLowerCase();
⋮----
const { plainToken, resetPayload } = buildPasswordResetDetails();
⋮----
await sendPasswordResetEmail(user, plainToken);
⋮----
console.error('Failed to send password reset email', error);
⋮----
const validatePasswordResetToken = async ({ token }, context = {}) => {
⋮----
throw new AppError('Enlace inválido o expirado.', 400, {
⋮----
const fallbackUser = await User.findOne({ 'passwordReset.token': hashed });
⋮----
provider: fallbackUser.primaryProvider() || 'local',
⋮----
const resetPassword = async ({ token, password }, context = {}) => {
⋮----
await deleteSessionsByUser(user._id);
```

## File: src/services/client.service.js
```javascript
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ensureSampleClients = async () => {
const total = await Client.estimatedDocumentCount();
⋮----
const operations = SAMPLE_CLIENTS.map((client) => ({
⋮----
await Client.bulkWrite(operations, { ordered: false });
⋮----
const toTitleCase = (value) =>
⋮----
.split(' ')
.filter(Boolean)
.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
.join(' ')
⋮----
const normalizeAddressInput = (address) => {
⋮----
latitude: Number.isFinite(address.latitude) ? address.latitude : null,
longitude: Number.isFinite(address.longitude) ? address.longitude : null,
⋮----
const formatClient = (client) => {
⋮----
.trim();
⋮----
id: client._id.toString(),
⋮----
const searchClients = async ({ query, limit = 10 } = {}) => {
await ensureSampleClients();
⋮----
const pattern = new RegExp(escapeRegex(query), 'i');
⋮----
const clients = await Client.find(filter).sort({ fullName: 1 }).limit(limit).lean();
return clients.map(formatClient);
⋮----
const getClientById = async (id) => {
const client = await Client.findById(id).lean();
return formatClient(client);
⋮----
const createClient = async (payload) => {
⋮----
const document = new Client({
firstName: toTitleCase(payload.firstName),
lastName: toTitleCase(payload.lastName),
internalOwner: toTitleCase(payload.internalOwner),
⋮----
primaryAddress: normalizeAddressInput(payload.primaryAddress),
secondaryAddress: normalizeAddressInput(payload.secondaryAddress),
⋮----
if (payload.cuit && String(payload.cuit).trim()) {
document.cuit = String(payload.cuit).trim();
⋮----
if (payload.email && String(payload.email).trim()) {
document.email = String(payload.email).trim();
⋮----
if (payload.phone && String(payload.phone).trim()) {
document.phone = String(payload.phone).trim();
⋮----
await document.validate();
await document.save();
⋮----
await Promise.all([
ensureContactBalance(document._id, 'ARS'),
ensureContactBalance(document._id, 'USD'),
⋮----
console.error(`Failed to initialize balances for new client ${document._id}`, balanceError);
⋮----
return formatClient(document.toObject());
```

## File: src/services/currentAccount.service.js
```javascript
const roundAmount = (value) => {
const numeric = Number(value);
if (!Number.isFinite(numeric)) {
⋮----
return Math.round(numeric * 100) / 100;
⋮----
const ensureAccountBalance = async (accountKey, currency, { session } = {}) => {
await CurrentAccountBalance.updateOne(
⋮----
const ensureContactBalance = async (contactId, currency, { session } = {}) => {
await ContactBalance.updateOne(
⋮----
const adjustAccountBalance = async (accountKey, currency, delta, { session, userId } = {}) => {
const numericDelta = roundAmount(delta);
if (!Number.isFinite(numericDelta) || numericDelta === 0) {
⋮----
const normalizedKey = String(accountKey || ACCOUNT_KEY).toLowerCase();
const normalizedCurrency = String(currency || 'ARS').toUpperCase();
await ensureAccountBalance(normalizedKey, normalizedCurrency, { session });
const balance = await CurrentAccountBalance.findOne({
⋮----
}).session(session || null);
const currentAmount = Number(balance?.amount || 0);
const nextAmount = roundAmount(currentAmount + numericDelta);
⋮----
if (userId && mongoose.Types.ObjectId.isValid(userId)) {
⋮----
await balance.save({ session });
return balance.toObject();
⋮----
const adjustContactBalance = async (contactId, currency, delta, { session, userId } = {}) => {
if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
⋮----
await ensureContactBalance(contactId, normalizedCurrency, { session });
const balance = await ContactBalance.findOne({
⋮----
const registerMovements = async (entries = [], { session } = {}) => {
⋮----
const formattedEntries = entries.map((entry) => ({
⋮----
amount: roundAmount(entry.amount),
⋮----
const created = await CurrentAccountMovement.insertMany(formattedEntries, {
⋮----
return created.map((doc) => doc.toObject());
⋮----
const extractCurrencyAndAmountFromTransaction = (transaction) => {
⋮----
amount: Number(transaction.incomingAmount),
⋮----
amount: Number(transaction.outgoingAmount),
⋮----
const pick = (code) =>
candidates.find(
⋮----
candidate.currency.toUpperCase() === code &&
Number.isFinite(candidate.amount) &&
⋮----
const ars = pick('ARS');
⋮----
const usd = pick('USD');
⋮----
const applyTransactionRegistration = async (transaction, { session, userId } = {}) => {
const info = extractCurrencyAndAmountFromTransaction(transaction);
if (!info || !Number.isFinite(info.amount) || info.amount <= 0) {
⋮----
const amount = roundAmount(info.amount);
⋮----
await adjustAccountBalance(ACCOUNT_KEY, currency, delta, { session, userId });
⋮----
id: mongoose.Types.ObjectId.isValid(transaction.client)
⋮----
performedBy: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
⋮----
if (contactId && mongoose.Types.ObjectId.isValid(contactId)) {
await adjustContactBalance(contactId, currency, delta, { session, userId });
movements.push({
⋮----
await registerMovements(movements, { session });
⋮----
const reverseTransactionRegistration = async (transaction, { session, userId } = {}) => {
⋮----
const registerTransferRegistration = async (operationDoc, { session, userId } = {}) => {
⋮----
const currency = String(operationDoc.currency || 'ARS').toUpperCase();
const totalAmount = roundAmount(operationDoc.totalAmount || operationDoc.amount || 0);
if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
⋮----
const lines = Array.isArray(operationDoc.distributionLines)
⋮----
await Promise.all(
lines.map(async (line) => {
⋮----
if (!mongoose.Types.ObjectId.isValid(contactId)) {
⋮----
const amountOriginal = Number(line.amount);
const amountArs = Number(line.amountArs ?? amountOriginal);
if (!Number.isFinite(amountArs) || amountArs <= 0) {
⋮----
direction === 'incoming' ? roundAmount(amountArs) : -roundAmount(amountArs);
await adjustContactBalance(contactId, currency, contactDelta, { session, userId });
⋮----
const applyTreasurySettlement = async (operationDoc, { session, userId } = {}) => {
⋮----
const counterpartKey = normalizeBalanceKey(operationDoc.movementType || 'cash');
⋮----
: Array.isArray(operationDoc.payload?.contacts)
⋮----
direction === 'incoming' ? -roundAmount(amountArs) : roundAmount(amountArs);
⋮----
const getCurrentAccountSummary = async ({ topContacts = 5 } = {}) => {
⋮----
const [balances, contactBalances] = await Promise.all([
CurrentAccountBalance.find({})
.sort({ accountKey: 1, currency: 1 })
.lean(),
ContactBalance.aggregate([
⋮----
{ $limit: Math.max(Number(topContacts) || 5, 1) },
⋮----
const totalsByCurrency = balances.reduce((acc, balance) => {
⋮----
acc[currency] = roundAmount((acc[currency] || 0) + Number(balance.amount || 0));
⋮----
const findBalance = (currency) =>
balances.find((balance) => balance.currency === currency) || null;
const receivableUsd = findBalance('USD');
const receivableArs = findBalance('ARS');
⋮----
generatedAt: new Date().toISOString(),
balances: balances.map((balance) => ({
⋮----
amount: roundAmount(balance.amount || 0),
⋮----
amount: roundAmount(receivableUsd.amount || 0),
⋮----
amount: roundAmount(receivableArs.amount || 0),
⋮----
topContacts: contactBalances.map((entry) => ({
contactId: entry.contactId?.toString() || null,
⋮----
amount: roundAmount(entry.amount || 0),
⋮----
id: entry.contact.id ? entry.contact.id.toString() : null,
⋮----
const listCurrentAccountMovements = async ({
⋮----
if (ledger && ['general', 'contact'].includes(ledger)) {
⋮----
query.currency = currency.toUpperCase();
⋮----
const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
const sanitizedSkip = Math.max(Number(skip) || 0, 0);
const [total, movements] = await Promise.all([
CurrentAccountMovement.countDocuments(query),
CurrentAccountMovement.find(query)
.sort({ createdAt: -1 })
.skip(sanitizedSkip)
.limit(sanitizedLimit)
⋮----
.filter((movement) => movement.contact)
.map((movement) => movement.contact)
.filter((id) => mongoose.Types.ObjectId.isValid(id));
⋮----
? await Client.find({ _id: { $in: contactIds } })
.select({ fullName: 1, shortName: 1, contactType: 1 })
.lean()
⋮----
const contactMap = new Map(contacts.map((contact) => [contact._id.toString(), contact]));
const formatted = movements.map((movement) => ({
id: movement._id.toString(),
⋮----
const data = contactMap.get(movement.contact.toString());
⋮----
id: movement.contact.toString(),
⋮----
: { id: movement.contact.toString() };
⋮----
amount: roundAmount(movement.amount),
⋮----
performedBy: movement.performedBy ? movement.performedBy.toString() : null,
⋮----
const buildBalanceSignMatch = (balanceSign) => {
⋮----
const buildContactSearchStage = (search) => {
⋮----
const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
⋮----
const listContactBalancesDetailed = async ({
⋮----
const normalizedCurrency = currency ? currency.toUpperCase() : 'USD';
const sanitizedLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
const sanitizedPage = Math.max(Number(page) || 1, 1);
⋮----
const searchStage = buildContactSearchStage(search);
if (searchStage) pipeline.push(searchStage);
⋮----
if (contactType && ['client', 'provider'].includes(contactType)) {
pipeline.push({ $match: { 'contactDoc.contactType': contactType } });
⋮----
if (status && ['active', 'inactive'].includes(status)) {
pipeline.push({ $match: { 'contactDoc.status': status } });
⋮----
const balanceFilter = buildBalanceSignMatch(balanceSign);
⋮----
pipeline.push({ $match: balanceFilter });
⋮----
movementMatchAnd.push({ $gte: ['$createdAt', new Date(dateFrom)] });
⋮----
const toDate = new Date(dateTo);
toDate.setHours(23, 59, 59, 999);
movementMatchAnd.push({ $lte: ['$createdAt', toDate] });
⋮----
pipeline.push({
⋮----
pipeline.push({ $match: { lastOperationAt: { $ne: null } } });
⋮----
pipeline.push({ $sort: sortStage });
⋮----
const [aggregateResult] = await ContactBalance.aggregate(pipeline);
⋮----
const items = data.map((entry) => ({
contactId: entry.contact?.toString(),
⋮----
roundAmount(entry.amount || 0) > 0
⋮----
: roundAmount(entry.amount || 0) < 0
⋮----
id: entry.contactDoc._id ? entry.contactDoc._id.toString() : null,
⋮----
id: entry.lastMovement._id ? entry.lastMovement._id.toString() : null,
⋮----
amount: roundAmount(entry.lastMovement.amount || 0),
⋮----
state: mapStageToState(entry.lastMovement.stage),
⋮----
totalPages: Math.max(1, Math.ceil((totalItems || 0) / sanitizedLimit)),
⋮----
const deriveOperationLabel = (movement) => {
⋮----
const mapStageToState = (stage) => {
⋮----
const getContactBalanceDetail = async ({
⋮----
throw new Error('Identificador de contacto inválido');
⋮----
const contact = await Client.findById(contactId).lean();
⋮----
throw new Error('El contacto no existe');
⋮----
const balances = await ContactBalance.find({ contact: contact._id }).lean();
const balanceMap = balances.reduce((acc, balance) => {
acc[balance.currency] = roundAmount(balance.amount || 0);
⋮----
const availableCurrencies = Object.keys(balanceMap);
⋮----
? currency.toUpperCase()
: availableCurrencies.includes('USD')
⋮----
: availableCurrencies.includes('ARS')
⋮----
if (['buy', 'sell'].includes(operationType)) {
⋮----
query.createdAt.$gte = new Date(dateFrom);
⋮----
const [totalItems, operations] = await Promise.all([
⋮----
.sort(sortStage)
.skip(skip)
⋮----
const totals = await CurrentAccountMovement.aggregate([
⋮----
incoming: roundAmount(totals[0].incoming || 0),
outgoing: roundAmount(totals[0].outgoing || 0),
net: roundAmount((totals[0].incoming || 0) - (totals[0].outgoing || 0)),
⋮----
const items = operations.map((movement) => {
const label = deriveOperationLabel(movement);
⋮----
state: mapStageToState(movement.stage),
⋮----
id: contact._id.toString(),
```

## File: src/services/geocoding.service.js
```javascript
const toStructuredPrediction = (prediction) => ({
⋮----
const getFallbackPredictions = (input) => {
const query = input.trim().toLowerCase();
⋮----
return STATIC_ADDRESSES.filter((item) => item.description.toLowerCase().includes(query))
.slice(0, 5)
.map((item) => ({
⋮----
const callPlacesApi = async (input) => {
⋮----
predictions: getFallbackPredictions(input),
⋮----
throw Object.assign(new Error('Fetch API not available in this runtime'), { status: 503 });
⋮----
const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
url.searchParams.set('input', input);
url.searchParams.set('types', 'address');
url.searchParams.set('language', 'es');
url.searchParams.set('components', 'country:ar');
url.searchParams.set('key', apiKey);
const response = await fetch(url.toString());
⋮----
throw Object.assign(new Error('No se pudo contactar con Google Maps'), { status: 503 });
⋮----
const payload = await response.json();
⋮----
throw Object.assign(new Error(payload.error_message || 'Google Maps devolvió un error'), {
⋮----
predictions: (payload.predictions || []).map(toStructuredPrediction),
⋮----
const getAddressPredictions = async (input) => {
if (!input || !input.toString().trim()) {
⋮----
if (input.trim().length < 3) {
⋮----
return callPlacesApi(input.trim());
```

## File: src/services/logistics.service.js
```javascript
const buildQueryFromFilters = (filters = {}) => {
⋮----
const pattern = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
⋮----
query.contactName = new RegExp(filters.contact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
⋮----
query.scheduledAt.$gte = new Date(filters.dateFrom);
⋮----
const toDate = new Date(filters.dateTo);
toDate.setHours(23, 59, 59, 999);
⋮----
const pickAmount = (amount) => {
⋮----
const buildRouteDescription = (operation) => {
⋮----
const mapOperationToDto = (operation) => ({
id: operation._id.toString(),
⋮----
route: buildRouteDescription(operation),
⋮----
amount: pickAmount(operation.amount),
⋮----
const computeSummaryMetrics = async () => {
const [active, pendingDeliveries, internalTransfers, completedToday] = await Promise.all([
LogisticsOperation.countDocuments({ state: 'en-curso' }),
LogisticsOperation.countDocuments({ state: 'pendiente', type: 'Entrega' }),
LogisticsOperation.countDocuments({ type: 'Transferencia' }),
⋮----
const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
return LogisticsOperation.countDocuments({ state: 'completado', scheduledAt: { $gte: since } });
⋮----
const listOperations = async ({ filters = {}, page = 1, limit = 20 } = {}) => {
const numericPage = Math.max(Number(page) || 1, 1);
const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
const query = buildQueryFromFilters(filters);
const [totalItems, operations, metrics] = await Promise.all([
LogisticsOperation.countDocuments(query),
LogisticsOperation.find(query)
.sort({ scheduledAt: -1 })
.skip((numericPage - 1) * numericLimit)
.limit(numericLimit),
computeSummaryMetrics(),
⋮----
const totalPages = Math.max(1, Math.ceil(totalItems / numericLimit));
⋮----
data: operations.map(mapOperationToDto),
⋮----
const getOperationById = async (idOrCode) => {
⋮----
if (mongoose.Types.ObjectId.isValid(idOrCode)) {
const byId = await LogisticsOperation.findById(idOrCode);
if (byId) return mapOperationToDto(byId);
⋮----
const operation = await LogisticsOperation.findOne({ operationCode: idOrCode });
return operation ? mapOperationToDto(operation) : null;
⋮----
const createOperation = async (payload) => {
const operation = await LogisticsOperation.create({
⋮----
scheduledAt: payload.scheduledAt || new Date(),
⋮----
return mapOperationToDto(operation);
⋮----
const updateOperationState = async (id, { state }) => {
if (!state || !['pendiente', 'en-curso', 'completado', 'anulado'].includes(state)) {
const error = new Error('Estado de operación inválido');
⋮----
const operation = await LogisticsOperation.findById(id);
⋮----
const error = new Error('Operación no encontrada');
⋮----
const error = new Error('Las operaciones completadas no pueden modificarse');
⋮----
const now = new Date();
operation.timeline = (operation.timeline || []).map((step, index) => ({
⋮----
...(operation.timeline || []).filter((step) => step.status === 'completed'),
⋮----
await operation.save();
```

## File: src/services/marketRate.service.js
```javascript
const saveManualMarketRate = async ({ baseAsset, quoteAsset, rate, validFrom, userId }) => {
const normalizedBase = String(baseAsset || '').toUpperCase();
const normalizedQuote = String(quoteAsset || '').toUpperCase();
const numericRate = Number(rate);
const validFromDate = validFrom ? new Date(validFrom) : new Date();
⋮----
throw new Error('Indicá los activos base y contra los que se cotiza.');
⋮----
if (!Number.isFinite(numericRate) || numericRate <= 0) {
throw new Error('Ingresá una tasa válida.');
⋮----
if (Number.isNaN(validFromDate.getTime())) {
throw new Error('La fecha de vigencia es inválida.');
⋮----
const override = await MarketRateOverride.create({
⋮----
return override.toObject();
⋮----
const getLatestMarketRate = async ({ baseAsset, quoteAsset }) => {
⋮----
const override = await MarketRateOverride.findOne({
⋮----
.sort({ validFrom: -1, createdAt: -1 })
.lean();
```

## File: src/services/securityLog.service.js
```javascript
const logSecurityEvent = async ({
⋮----
await SecurityLog.create({
⋮----
console.error('Failed to log security event', error);
```

## File: src/services/session.service.js
```javascript
Number(process.env.SESSION_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
⋮----
Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
const buildExpiry = (rememberMe) =>
new Date(Date.now() + (rememberMe ? SESSION_REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS));
const createSession = async ({ user, rememberMe = false, userAgent, ipAddress }) => {
const token = generateRandomToken(48);
const tokenHash = hashToken(token);
const expiresAt = buildExpiry(rememberMe);
await Session.create({
⋮----
const findSessionByToken = async (token) => {
⋮----
return Session.findOne({ tokenHash }).populate('user');
⋮----
const deleteSessionByToken = async (token) => {
⋮----
await Session.deleteOne({ tokenHash });
⋮----
const deleteSessionsByUser = async (userId) => {
await Session.deleteMany({ user: userId });
```

## File: src/services/transaction.service.js
```javascript
const calculateMarginPercentage = ({ type, incomingAmount, outgoingAmount, marketRate }) => {
const numericIncoming = Number(incomingAmount);
const numericOutgoing = Number(outgoingAmount);
const numericMarket = Number(marketRate);
⋮----
!Number.isFinite(numericIncoming) ||
!Number.isFinite(numericOutgoing) ||
!Number.isFinite(numericMarket) ||
⋮----
return Number(((diff / numericMarket) * 100).toFixed(4));
⋮----
const normalizeAsset = ({ code, label }) => {
⋮----
throw new Error('Invalid asset definition');
⋮----
code: String(code).trim(),
label: String(label).trim(),
⋮----
const stripDiacritics = (value = '') =>
String(value)
.normalize('NFD')
.replace(/[^\w\s.-]/g, '')
.replace(/[\u0300-\u036f]/g, '');
const mapSettlementMethodToMovementType = (method) => {
const normalized = stripDiacritics(method).toLowerCase();
if (normalized.includes('usd') || normalized.includes('dolar')) {
⋮----
if (normalized.includes('efectivo') || normalized.includes('cash')) {
⋮----
normalized.includes('deposito') ||
normalized.includes('transfer') ||
normalized.includes('banco') ||
normalized.includes('cheque')
⋮----
const resolveSettlementSlices = (transaction, totalAmount) => {
const safeTotal = roundAmount(totalAmount);
if (!Number.isFinite(safeTotal) || safeTotal <= 0) {
⋮----
movementType: mapSettlementMethodToMovementType(fallbackMethod),
⋮----
const lines = Array.isArray(transaction.settlement.lines)
⋮----
const amounts = lines.map((line) => {
const baseValue = Number(line.value);
if (!Number.isFinite(baseValue) || baseValue <= 0) {
⋮----
return roundAmount(baseValue);
⋮----
const percentage = Number(line.computedPercentage ?? baseValue);
if (!Number.isFinite(percentage) || percentage <= 0) {
⋮----
return roundAmount((percentage / 100) * safeTotal);
⋮----
const assignedTotal = amounts.reduce((sum, value) => sum + value, 0);
let difference = roundAmount(safeTotal - assignedTotal);
if (Math.abs(difference) > Math.max(0.5, safeTotal * 0.02)) {
throw new Error('La liquidación no coincide con el monto total de la operación.');
⋮----
if (amounts.length > 0 && Math.abs(difference) > 0) {
⋮----
amounts[lastIndex] = roundAmount(amounts[lastIndex] + difference);
difference = roundAmount(
safeTotal - amounts.reduce((sum, value) => sum + value, 0)
⋮----
if (Math.abs(difference) > 0.05) {
throw new Error('No pudimos balancear la liquidación con el monto total.');
⋮----
.map((line, index) => ({
⋮----
movementType: mapSettlementMethodToMovementType(line.method),
⋮----
.filter((slice) => Number.isFinite(slice.amount) && slice.amount > 0);
⋮----
const formatTransaction = (transaction) => {
⋮----
id: transaction._id.toString(),
userId: userId ? userId.toString() : null,
clientId: clientId ? clientId.toString() : null,
⋮----
voidedBy: transaction.voidedBy ? transaction.voidedBy.toString() : null,
⋮----
lines: Array.isArray(transaction.settlement.lines)
? transaction.settlement.lines.map((line) => ({
⋮----
isComplete: Boolean(transaction.settlement.isComplete),
⋮----
accountingAudit: Array.isArray(transaction.accountingAudit)
? transaction.accountingAudit.map((entry) => ({
⋮----
performedAt: entry.performedAt ? entry.performedAt.toISOString() : null,
performedBy: entry.performedBy ? entry.performedBy.toString() : null,
⋮----
const createTransactionDraft = async (payload, context = {}) => {
⋮----
throw new Error('User ID is required in context to create a draft');
⋮----
if (!mongoose.Types.ObjectId.isValid(clientId)) {
throw new Error('Invalid client identifier');
⋮----
const incoming = normalizeAsset(incomingAsset);
const outgoing = normalizeAsset(outgoingAsset);
const numericApr = Number(apr);
const numericMarketApr = Number(marketApr);
⋮----
if (!Number.isFinite(numericApr) || !Number.isFinite(numericMarketApr)) {
throw new Error('APR values are required');
⋮----
throw new Error('Amounts must be greater than 0');
⋮----
const marginPercentage = calculateMarginPercentage({
⋮----
const transaction = await Transaction.create({
⋮----
return formatTransaction(transaction);
⋮----
const getTransactionDraft = async (id, userId) => {
if (!mongoose.Types.ObjectId.isValid(id)) {
⋮----
throw new Error('User ID is required to fetch a draft');
⋮----
const transaction = await Transaction.findOne({ _id: id, user: userId }).lean();
⋮----
const buildWizardDraftResponse = async (transaction) => {
⋮----
const client = await getClientById(transaction.clientId || transaction.client);
⋮----
const updateTransactionDraft = async (id, payload = {}, context = {}) => {
⋮----
throw new Error('Invalid transaction identifier');
⋮----
throw new Error('User ID is required to update a draft');
⋮----
const transaction = await Transaction.findOne({ _id: id, user: userId });
⋮----
throw new Error('Transaction not found');
⋮----
if (!Number.isFinite(numericIncoming) || numericIncoming <= 0) {
throw new Error('Incoming amount must be greater than 0');
⋮----
if (!Number.isFinite(numericOutgoing) || numericOutgoing <= 0) {
throw new Error('Outgoing amount must be greater than 0');
⋮----
await transaction.save();
⋮----
const updateTransactionSettlement = async (id, payload = {}, context = {}) => {
⋮----
throw new Error('User ID is required to update settlement');
⋮----
const method = typeof payload.simpleMethod === 'string' ? payload.simpleMethod.trim() : '';
⋮----
throw new Error('Debe seleccionar un método de liquidación');
⋮----
? Number(transaction.outgoingAmount)
: Number(transaction.incomingAmount);
if (!baseAmount || !Number.isFinite(baseAmount) || baseAmount <= 0) {
throw new Error('La operación no tiene un monto base válido para calcular la liquidación');
⋮----
const lines = Array.isArray(payload.lines) ? payload.lines : [];
⋮----
throw new Error('Agregá al menos una línea de liquidación');
⋮----
lines.forEach((line, index) => {
const method = typeof line.method === 'string' ? line.method.trim() : '';
⋮----
const value = Number(line.value);
⋮----
throw new Error(`La línea ${index + 1} debe tener un método de liquidación`);
⋮----
if (!Number.isFinite(value) || value <= 0) {
throw new Error(`La línea ${index + 1} debe tener un valor mayor a cero`);
⋮----
if (!Number.isFinite(computedPercentage) || computedPercentage <= 0) {
throw new Error(`No se pudo calcular el porcentaje de la línea ${index + 1}`);
⋮----
normalizedLines.push({
⋮----
value: Number(value.toFixed(4)),
computedPercentage: Number(computedPercentage.toFixed(4)),
⋮----
const roundedTotal = Number(totalPercentage.toFixed(4));
const difference = Math.abs(roundedTotal - 100);
⋮----
throw new Error(
`La suma de los métodos debe ser exactamente 100%. Diferencia actual: ${difference.toFixed(
⋮----
transaction.currentStep = Math.max(Number(transaction.currentStep) || 1, 2);
⋮----
const advanceTransactionStep = async (id, step = 1, context = {}) => {
⋮----
const numericStep = Number(step);
if (!Number.isInteger(numericStep) || numericStep < 1 || numericStep > 3) {
throw new Error('Paso inválido.');
⋮----
throw new Error('User ID is required to advance step');
⋮----
transaction.currentStep = Math.max(Number(transaction.currentStep) || 1, numericStep);
⋮----
const generateOperationCode = async () => {
⋮----
const code = `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(
Math.random() * 36
).toString(36).toUpperCase()}`;
const exists = await Transaction.exists({ operationCode: code });
⋮----
return `${prefix}${Date.now()}`;
⋮----
const validateTransactionForFinalization = (transaction) => {
⋮----
throw new Error('La operación no tiene un cliente asignado.');
⋮----
if (!Number.isFinite(Number(transaction.incomingAmount)) || Number(transaction.incomingAmount) <= 0) {
throw new Error('El monto que recibe el cliente debe ser mayor a cero.');
⋮----
if (!Number.isFinite(Number(transaction.outgoingAmount)) || Number(transaction.outgoingAmount) <= 0) {
throw new Error('El monto que paga el cliente debe ser mayor a cero.');
⋮----
if (!Number.isFinite(Number(transaction.apr)) || Number(transaction.apr) <= 0) {
throw new Error('El tipo de cambio aplicado es inválido.');
⋮----
throw new Error('Seleccioná un método de liquidación para continuar.');
⋮----
!Array.isArray(transaction.settlement.lines) ||
⋮----
throw new Error('Agregá al menos una línea de liquidación.');
⋮----
const total = Number(transaction.settlement.totalPercentage || 0);
if (Math.abs(total - 100) > 0.1) {
throw new Error('La liquidación debe completar exactamente el 100%.');
⋮----
const finalizeTransaction = async (id, context = {}) => {
⋮----
throw new Error('User ID is required to finalize');
⋮----
const session = await mongoose.startSession();
⋮----
await session.withTransaction(async () => {
const transaction = await Transaction.findOne({ _id: id, user: userId }).session(session);
⋮----
formatted = formatTransaction(transaction);
⋮----
validateTransactionForFinalization(transaction);
⋮----
transaction.operationCode = transaction.operationCode || (await generateOperationCode());
transaction.completedAt = new Date();
⋮----
registrationResult = await applyTransactionRegistration(transaction, {
⋮----
await transaction.save({ session });
⋮----
session.endSession();
⋮----
emitBalanceUpdated({
⋮----
const voidTransaction = async (id, reason = '', context = {}) => {
⋮----
throw new Error('User ID is required to void');
⋮----
throw new Error('No podés anular una operación que ya fue liquidada.');
⋮----
throw new Error('El estado actual de la operación no permite anularla.');
⋮----
reversalResult = await reverseTransactionRegistration(transaction, {
⋮----
transaction.voidedAt = new Date();
⋮----
transaction.voidReason = reason ? String(reason).trim() || null : null;
if (!Array.isArray(transaction.accountingAudit)) {
⋮----
transaction.accountingAudit.push({
⋮----
performedAt: new Date(),
```

## File: src/services/transactionLifecycle.service.js
```javascript
const ensureAuditTrail = (transaction) => {
if (!Array.isArray(transaction.accountingAudit)) {
⋮----
const toNumberOrZero = (value) => {
const numeric = Number(value);
return Number.isFinite(numeric) ? numeric : 0;
⋮----
const resolveTransactionBaseAmount = (transaction, preferredCurrency) => {
⋮----
? String(transaction.incomingAsset.code).toUpperCase()
⋮----
? String(transaction.outgoingAsset.code).toUpperCase()
⋮----
const incomingAmount = Math.abs(toNumberOrZero(transaction.incomingAmount));
const outgoingAmount = Math.abs(toNumberOrZero(transaction.outgoingAmount));
const preferred = preferredCurrency ? String(preferredCurrency).toUpperCase() : null;
⋮----
const sumSettledAmount = (auditTrail, currency, excludeMovementId) => {
if (!Array.isArray(auditTrail) || auditTrail.length === 0) {
⋮----
const normalizedCurrency = currency ? String(currency).toUpperCase() : null;
const excludedId = excludeMovementId ? String(excludeMovementId) : null;
⋮----
.filter((entry) => entry && entry.action === 'settlement_completed')
.filter((entry) => {
⋮----
? String(entry.metadata.currency).toUpperCase()
⋮----
.reduce((total, entry) => total + Math.abs(toNumberOrZero(entry?.metadata?.amount)), 0);
⋮----
const normalizeMovementId = (movementId) => {
⋮----
return mongoose.Types.ObjectId.isValid(movementId)
? new mongoose.Types.ObjectId(movementId).toString()
: String(movementId);
⋮----
return String(movementId);
⋮----
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const recordTransactionSettlement = async (
⋮----
if (!isValidObjectId(transactionId)) {
⋮----
const transaction = await Transaction.findById(transactionId).session(session || null);
⋮----
const now = new Date();
const normalizedMovementId = normalizeMovementId(impact.movementId);
ensureAuditTrail(transaction);
⋮----
currency: impact.currency ? String(impact.currency).toUpperCase() : null,
⋮----
const impactAmount = Math.abs(toNumberOrZero(impact.amount));
⋮----
const baseAmount = resolveTransactionBaseAmount(transaction, auditMetadata.currency);
⋮----
const alreadySettled = sumSettledAmount(
⋮----
throw new Error('La operación ya fue compensada en su totalidad.');
⋮----
const existingIndex = transaction.accountingAudit.findIndex(
⋮----
userId && isValidObjectId(userId) ? userId : null;
⋮----
transaction.accountingAudit.push({
⋮----
performedBy: userId && isValidObjectId(userId) ? userId : null,
⋮----
if (userId && isValidObjectId(userId)) {
⋮----
await transaction.save({ session });
⋮----
const revertTransactionSettlement = async (
⋮----
const normalizedMovementId = normalizeMovementId(movementId);
⋮----
transaction.accountingAudit = transaction.accountingAudit.filter(
⋮----
const settlementEntriesRemaining = transaction.accountingAudit.some(
⋮----
performedAt: new Date(),
```

## File: src/services/transfer.service.js
```javascript
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const roundAmount = (value) => {
const numeric = Number(value);
if (!Number.isFinite(numeric)) {
⋮----
return Math.round(numeric * 100) / 100;
⋮----
const formatContact = (client) => {
⋮----
? client._id.toString()
⋮----
const formatTransferOperation = (operation, contacts = []) => {
⋮----
const contactMap = new Map();
⋮----
.map(formatContact)
.filter(Boolean)
.forEach((contact) => {
contactMap.set(contact.id, contact);
⋮----
const distributionLines = Array.isArray(operation.distributionLines)
? operation.distributionLines.map((line, index) => {
⋮----
? line.contact._id.toString()
⋮----
? line.contact.toString()
⋮----
const contact = contactMap.get(contactId) || formatContact(line.contact);
⋮----
lineId: `${operation._id.toString()}-${index}`,
⋮----
amount: roundAmount(line.amount),
amountArs: roundAmount(line.amountArs == null ? line.amount : line.amountArs),
⋮----
id: operation._id.toString(),
⋮----
totalAmount: roundAmount(operation.totalAmount),
⋮----
? new Date(operation.confirmedAt).toISOString()
⋮----
completedAt: operation.completedAt ? new Date(operation.completedAt).toISOString() : null,
completedBy: operation.completedBy ? operation.completedBy.toString() : null,
cancelledAt: operation.cancelledAt ? new Date(operation.cancelledAt).toISOString() : null,
cancelledBy: operation.cancelledBy ? operation.cancelledBy.toString() : null,
⋮----
createdAt: operation.createdAt ? new Date(operation.createdAt).toISOString() : null,
updatedAt: operation.updatedAt ? new Date(operation.updatedAt).toISOString() : null,
⋮----
const generateTransferOperationCode = async () => {
⋮----
const code = `${prefix}${Math.floor(Math.random() * 1_000_000)
.toString()
.padStart(6, '0')}`;
const exists = await TransferOperation.exists({ operationCode: code });
⋮----
return `${prefix}${Date.now()}`;
⋮----
const validateAndNormalizePayload = async (payload = {}) => {
⋮----
const totalAmount = roundAmount(payload.totalAmount);
if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
throw new AppError('Ingresá un monto total válido.', 400);
⋮----
const lines = Array.isArray(payload.distributionLines) ? payload.distributionLines : [];
⋮----
throw new AppError('Agregá al menos un contacto a la distribución.', 400);
⋮----
const needsUsdRate = lines.some(
(line) => String(line.method || line.currency || '').toUpperCase() === 'USD'
⋮----
const rateFromPayload = Number(payload?.exchangeRates?.usdArs);
if (Number.isFinite(rateFromPayload) && rateFromPayload > 0) {
⋮----
const marketRate = await getLatestMarketRate({ baseAsset: 'USD', quoteAsset: 'ARS' });
if (marketRate?.rate && Number.isFinite(marketRate.rate) && marketRate.rate > 0) {
⋮----
throw new AppError('No hay una tasa USD/ARS disponible. Intentá nuevamente.', 400);
⋮----
const normalizedLines = lines.map((line, index) => {
⋮----
if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
throw new AppError(`La línea ${index + 1} no tiene un contacto válido.`, 400);
⋮----
const method = String(line.method || '').toUpperCase() === 'USD' ? 'USD' : 'ARS';
const amount = roundAmount(line.amount);
if (!Number.isFinite(amount) || amount <= 0) {
throw new AppError(`Ingresá un monto válido en la línea ${index + 1}.`, 400);
⋮----
const amountArs = method === 'USD' ? roundAmount(amount * usdArsRate) : amount;
⋮----
contact: new mongoose.Types.ObjectId(contactId),
⋮----
const assignedTotal = normalizedLines.reduce((sum, line) => sum + line.amountArs, 0);
const difference = Math.abs(assignedTotal - totalAmount);
⋮----
throw new AppError(
`La suma de las asignaciones debe coincidir con el monto total. Diferencia: ${difference.toFixed(
⋮----
const contactIds = normalizedLines.map((line) => line.contact);
const contacts = await Client.find({ _id: { $in: contactIds } }).lean();
⋮----
throw new AppError('Uno de los contactos seleccionados ya no está disponible.', 400);
⋮----
const contactsMap = new Map(contacts.map((client) => [client._id.toString(), client]));
⋮----
const registerTransferOperation = async (payload, context = {}) => {
⋮----
await validateAndNormalizePayload(payload);
const session = await mongoose.startSession();
⋮----
await session.withTransaction(async () => {
const operation = new TransferOperation({
operationCode: await generateTransferOperationCode(),
⋮----
confirmedAt: new Date(),
⋮----
await operation.save({ session });
const operationPayload = operation.toObject();
⋮----
await registerTransferRegistration(operationPayload, {
⋮----
balance = await adjustTreasuryBalanceForMovement(movementType, 'ARS', delta, {
⋮----
await applyTreasurySettlement(operationPayload, {
⋮----
eventDocuments = await createTransferOperationEvents(operationDocument, { session });
⋮----
session.endSession();
⋮----
const formattedOperation = formatTransferOperation(operationDocument, contacts);
⋮----
new Date().toISOString(),
⋮----
distributionLines: normalizedLines.map((line) => ({
contact: line.contact.toString(),
⋮----
amountArs: roundAmount(line.amountArs),
⋮----
treasuryMovementResult = await registerTreasuryMovement(treasuryPayload, treasuryContext);
emitBalanceUpdated({
⋮----
id: normalizeBalanceKey(movementType),
⋮----
amount: roundAmount(balance.amount),
updatedAt: new Date(balance.updatedAt || balance.createdAt || Date.now()).toISOString(),
⋮----
events: eventDocuments.map((event) => ({
id: event._id.toString(),
⋮----
createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
⋮----
const getTransferOperationById = async (id) => {
if (!mongoose.Types.ObjectId.isValid(id)) {
⋮----
const operation = await TransferOperation.findById(id).lean();
⋮----
const contactIds = Array.isArray(operation.distributionLines)
⋮----
.map((line) => line.contact)
.filter((contactId) => mongoose.Types.ObjectId.isValid(contactId))
⋮----
? await Client.find({ _id: { $in: contactIds } }).lean()
⋮----
return formatTransferOperation(operation, contacts);
⋮----
const listTransferOperations = async ({ limit = 20, skip = 0, search = '' } = {}) => {
const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
const sanitizedSkip = Math.max(Number(skip) || 0, 0);
const searchTerm = typeof search === 'string' ? search.trim() : '';
const regex = searchTerm ? new RegExp(escapeRegex(searchTerm), 'i') : null;
⋮----
if (mongoose.Types.ObjectId.isValid(searchTerm)) {
orFilters.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
⋮----
pipeline.push({
⋮----
pipeline.push({ $skip: sanitizedSkip });
⋮----
pipeline.push({ $limit: sanitizedLimit });
⋮----
const operations = await TransferOperation.aggregate(pipeline);
return operations.map((operation) => {
const contacts = Array.isArray(operation.contacts) ? operation.contacts : [];
⋮----
return formatTransferOperation(rest, contacts);
```

## File: src/services/treasury.service.js
```javascript
const GLOBAL_BALANCE_SORT_FIELDS = new Set(['balance', 'name', 'variation', 'lastMovement']);
⋮----
const CONTACT_BALANCE_SORT_FIELDS = new Set(['date', 'amount', 'type']);
⋮----
const getBalanceConfig = (key) => {
⋮----
const normalized = String(key).toLowerCase();
⋮----
const parseDateFilter = (value, { endOfDay = false } = {}) => {
⋮----
const date = new Date(value);
if (Number.isNaN(date.getTime())) {
⋮----
date.setHours(23, 59, 59, 999);
⋮----
const buildMovementMatch = (key, filters = {}) => {
⋮----
typeof filters.type === 'string' && MOVEMENT_TYPES.includes(filters.type.toLowerCase())
? filters.type.toLowerCase()
⋮----
const dateFrom = parseDateFilter(filters.dateFrom);
const dateTo = parseDateFilter(filters.dateTo, { endOfDay: true });
⋮----
if (filters.contactId && mongoose.Types.ObjectId.isValid(filters.contactId)) {
match.contact = new mongoose.Types.ObjectId(filters.contactId);
⋮----
const fetchMovementTotalsForBalance = async (key, filters = {}) => {
const match = buildMovementMatch(key, filters);
⋮----
const groupedTotals = await TreasuryMovement.aggregate(pipeline);
const totals = groupedTotals.reduce(
⋮----
acc.incoming = roundAmount(entry.amount);
⋮----
acc.outgoing = roundAmount(entry.amount);
⋮----
totals.net = roundAmount(totals.incoming - totals.outgoing);
⋮----
const computeVariationForBalance = async (key, { days = DEFAULT_VARIATION_WINDOW_DAYS } = {}) => {
const windowDays = Math.max(Number(days) || DEFAULT_VARIATION_WINDOW_DAYS, 1);
const now = new Date();
const currentWindowStart = new Date(now.getTime() - windowDays * MS_IN_DAY);
const previousWindowStart = new Date(currentWindowStart.getTime() - windowDays * MS_IN_DAY);
const [currentTotals, previousTotals] = await Promise.all([
fetchMovementTotalsForBalance(key, {
dateFrom: currentWindowStart.toISOString(),
dateTo: now.toISOString(),
⋮----
dateFrom: previousWindowStart.toISOString(),
dateTo: currentWindowStart.toISOString(),
⋮----
if (Math.abs(previousNet) > 0) {
variationPercentage = roundAmount(((currentNet - previousNet) / Math.abs(previousNet)) * 100);
} else if (Math.abs(currentNet) > 0) {
⋮----
const fetchRecentMovementsForBalance = async (key, limit = 3, filters = {}) => {
const sanitizedLimit = Math.min(Math.max(Number(limit) || 3, 1), 20);
⋮----
const movements = await TreasuryMovement.find(match)
.sort({ movementAt: -1 })
.limit(sanitizedLimit)
.lean();
⋮----
.map((movement) => movement.contact)
.filter((id) => id && mongoose.Types.ObjectId.isValid(id))
.map((id) => id.toString());
⋮----
? await Client.find({ _id: { $in: contactIds } })
.select({ fullName: 1, shortName: 1, contactType: 1, status: 1, email: 1 })
.lean()
⋮----
return movements.map((movement) => formatTreasuryMovement(movement, contacts));
⋮----
const fetchContactSummariesForBalance = async (key, limit = 3, filters = {}) => {
⋮----
const grouped = await TreasuryMovement.aggregate(pipeline);
⋮----
.map((entry) => entry._id)
.filter((id) => id && mongoose.Types.ObjectId.isValid(id));
const contacts = await Client.find({ _id: { $in: contactIds } })
⋮----
const contactMap = new Map(
contacts.map((contact) => [contact._id ? contact._id.toString() : contact.id, contact])
⋮----
return grouped.map((entry) => {
const contactDoc = contactMap.get(entry._id.toString());
const formattedContact = contactDoc ? formatContact(contactDoc) : { id: entry._id.toString() };
⋮----
incoming: roundAmount(entry.incoming || 0),
outgoing: roundAmount(entry.outgoing || 0),
net: roundAmount((entry.incoming || 0) - (entry.outgoing || 0)),
⋮----
lastMovementAt: entry.lastMovementAt ? new Date(entry.lastMovementAt).toISOString() : null,
⋮----
const fetchAccountingSummaryForBalance = async (key) => {
const config = getBalanceConfig(key);
⋮----
const [summary] = await CurrentAccountMovement.aggregate(pipeline);
const balance = summary ? roundAmount(summary.balance || 0) : 0;
⋮----
? new Date(summary.lastOperationAt).toISOString()
⋮----
const lastOperationDate = new Date(lastOperationAt);
const diffDays = (Date.now() - lastOperationDate.getTime()) / MS_IN_DAY;
⋮----
const fetchRecentActivityForBalance = async (key, limit = 5) => {
const sanitizedLimit = Math.min(Math.max(Number(limit) || 5, 1), 25);
const activityEntries = await CurrentAccountMovement.find({
⋮----
.sort({ createdAt: -1 })
⋮----
.map((entry) => entry.contact)
⋮----
.select({ fullName: 1, shortName: 1, contactType: 1, status: 1 })
⋮----
return activityEntries.map((entry) => {
const contactDoc = entry.contact ? contactMap.get(entry.contact.toString()) : null;
⋮----
id: entry._id ? entry._id.toString() : null,
createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
⋮----
amount: roundAmount(entry.amount || 0),
⋮----
? entry.operation.id.toString()
⋮----
contact: contactDoc ? formatContact(contactDoc) : null,
⋮----
const buildLinkedBalanceSummaryEntry = async (config, baseBalanceMap, options = {}) => {
⋮----
const baseBalance = baseBalanceMap.get(config.id) || {
⋮----
updatedAt: new Date().toISOString(),
⋮----
const [variation, totals, recentMovements, contacts, accounting, activity] = await Promise.all([
computeVariationForBalance(config.id, { days: variationWindowDays }),
fetchMovementTotalsForBalance(config.id),
fetchRecentMovementsForBalance(config.id, recentMovementsLimit),
fetchContactSummariesForBalance(config.id, contactLimit),
fetchAccountingSummaryForBalance(config.id),
fetchRecentActivityForBalance(config.id, activityLimit),
⋮----
amount: roundAmount(baseBalance.amount || 0),
⋮----
updatedAt: baseBalance.updatedAt || new Date().toISOString(),
⋮----
const getLinkedBalancesSummary = async (options = {}) => {
const balances = await getTreasuryBalances();
const balanceMap = new Map(balances.map((balance) => [balance.id, balance]));
const configs = Object.values(LINKED_BALANCE_CONFIG);
const entries = await Promise.all(
configs.map((config) => buildLinkedBalanceSummaryEntry(config, balanceMap, options))
⋮----
generatedAt: new Date().toISOString(),
⋮----
const computeVariationPercentage = (currentValue = 0, previousValue = 0) => {
const current = Number(currentValue) || 0;
const previous = Number(previousValue) || 0;
⋮----
const raw = ((current - previous) / Math.abs(previous)) * 100;
return roundAmount(raw);
⋮----
const directionFromVariation = (value) => {
⋮----
const resolveAccountLabel = (key, currency) => {
⋮----
const normalized = String(key)
.replace(/[_-]+/g, ' ')
.replace(/\s+/g, ' ')
.trim();
⋮----
.split(' ')
.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
.join(' ');
⋮----
const resolveSummaryLabel = (accountKey, currency) => {
const normalizedAccountKey = (accountKey || '').toLowerCase();
const normalizedCurrency = (currency || '').toUpperCase();
⋮----
return resolveAccountLabel(accountKey, currency);
⋮----
const computeBalanceState = (amount) => {
⋮----
const buildOverviewMatch = (filters = {}) => {
⋮----
match.currency = String(filters.currency).toUpperCase();
⋮----
match.accountKey = String(filters.accountKey).toLowerCase();
⋮----
match['counterpart.key'] = String(filters.counterpartKey).toLowerCase();
⋮----
const from = parseDateFilter(filters.dateFrom);
⋮----
const to = parseDateFilter(filters.dateTo, { endOfDay: true });
⋮----
if (Object.keys(dateFilters).length) {
⋮----
const getGlobalBalancesOverview = async (query = {}) => {
⋮----
const rawAccountKey = typeof accountKey === 'string' ? accountKey.trim() : '';
let normalizedAccountKey = rawAccountKey ? rawAccountKey.toLowerCase() : '';
let normalizedCurrency = typeof currency === 'string' && currency.trim().length
? currency.toUpperCase()
⋮----
if (normalizedAccountKey.includes('::')) {
const [baseKey, currencySuffix] = normalizedAccountKey.split('::');
⋮----
normalizedCurrency = currencySuffix.toUpperCase();
⋮----
const numericPage = Math.max(Number(page) || 1, 1);
const numericLimit = Math.min(Math.max(Number(limit) || DEFAULT_GLOBAL_BALANCES_LIMIT, 1), 100);
⋮----
typeof sortBy === 'string' && GLOBAL_BALANCE_SORT_FIELDS.has(sortBy)
⋮----
const ascending = String(sortDirection).toLowerCase() === 'asc';
⋮----
const currentWindowStart = new Date(now.getTime() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY);
const previousWindowStart = new Date(currentWindowStart.getTime() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY);
const match = buildOverviewMatch({
⋮----
const rawRows = await CurrentAccountMovement.aggregate(pipeline);
⋮----
.map((row) => row._id.contact)
.filter((value) => value && mongoose.Types.ObjectId.isValid(value))
.map((value) => value.toString());
⋮----
.select({ fullName: 1, shortName: 1, contactType: 1, status: 1, cuit: 1 })
⋮----
contacts.map((contact) => [contact._id ? contact._id.toString() : '', contact])
⋮----
const appliedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';
const normalizedBalanceFilter = BALANCE_STATE_VALUES.includes(balanceState)
⋮----
typeof contactType === 'string' && contactType.trim().length
? contactType.trim().toLowerCase()
⋮----
const formattedRows = rawRows.map((row) => {
⋮----
row._id.contact && mongoose.Types.ObjectId.isValid(row._id.contact)
? row._id.contact.toString()
⋮----
const contactDoc = contactId ? contactMap.get(contactId) : null;
⋮----
const amount = roundAmount(row.balance || 0);
const state = computeBalanceState(amount);
const variationChange = computeVariationPercentage(
⋮----
const label = resolveSummaryLabel(accountKeyValue, currencyValue);
⋮----
id: `${accountKeyValue}-${contactId || 'general'}-${currencyValue}`.toLowerCase(),
⋮----
direction: directionFromVariation(variationChange),
currentWindowAmount: roundAmount(row.currentWindowAmount || 0),
previousWindowAmount: roundAmount(row.previousWindowAmount || 0),
⋮----
lastMovementAt: row.lastMovementAt ? new Date(row.lastMovementAt).toISOString() : null,
⋮----
? formattedRows.filter((row) => {
⋮----
.join(' ')
.toLowerCase();
return haystack.includes(appliedSearch);
⋮----
? filteredBySearch.filter((row) => row.balanceState === normalizedBalanceFilter)
⋮----
? filteredByState.filter(
⋮----
(row.contact?.contactType || '').toLowerCase() === normalizedContactType ||
⋮----
const sortedRows = [...fullyFiltered].sort((a, b) => {
⋮----
const nameA = (a.contact?.fullName || '').toLowerCase();
const nameB = (b.contact?.fullName || '').toLowerCase();
⋮----
const dateA = a.lastMovementAt ? new Date(a.lastMovementAt).getTime() : 0;
const dateB = b.lastMovementAt ? new Date(b.lastMovementAt).getTime() : 0;
⋮----
const totalPages = Math.max(1, Math.ceil(totalItems / numericLimit));
⋮----
const paginatedRows = sortedRows.slice(startIndex, startIndex + numericLimit);
const summaryByAccount = new Map();
const currencies = new Set();
const accountKeys = new Map();
const contactTypesSet = new Set();
⋮----
currencies.add(row.currency);
const summaryKey = `${row.accountKey || 'general'}::${row.currency || 'ARS'}`.toLowerCase();
const summaryLabel = resolveSummaryLabel(row.accountKey, row.currency);
accountKeys.set(summaryKey, summaryLabel);
⋮----
contactTypesSet.add(row.contact.contactType);
⋮----
if (BALANCE_STATE_VALUES.includes(row.balanceState)) {
⋮----
if (!summaryByAccount.has(summaryKey)) {
summaryByAccount.set(summaryKey, {
⋮----
const entry = summaryByAccount.get(summaryKey);
entry.amount = roundAmount((entry.amount || 0) + row.amount);
entry.currentWindowAmount = roundAmount(
⋮----
entry.previousWindowAmount = roundAmount(
⋮----
(!entry.updatedAt || new Date(row.lastMovementAt).getTime() > new Date(entry.updatedAt).getTime())
⋮----
const summaryCards = Array.from(summaryByAccount.values()).map((entry) => {
const variationPercentage = computeVariationPercentage(
⋮----
amount: roundAmount(entry.amount),
⋮----
direction: directionFromVariation(variationPercentage),
⋮----
summaryCards.sort((a, b) => {
⋮----
const indexA = order.indexOf(a.id);
const indexB = order.indexOf(b.id);
⋮----
return a.label.localeCompare(b.label);
⋮----
const totalBalance = roundAmount(
fullyFiltered.reduce((acc, row) => acc + (row.amount || 0), 0)
⋮----
const totalsByCurrency = Array.from(currencies).map((currencyValue) => ({
⋮----
total: roundAmount(
⋮----
.filter((row) => row.currency === currencyValue)
.reduce((acc, row) => acc + (row.amount || 0), 0)
⋮----
currencies: Array.from(currencies).map((value) => ({
⋮----
accountKeys: Array.from(accountKeys.entries()).map(([value, label]) => ({
⋮----
balanceStates: BALANCE_STATE_VALUES.map((value) => ({
⋮----
contactTypes: Array.from(contactTypesSet).map((value) => ({
⋮----
: value.charAt(0).toUpperCase() + value.slice(1),
⋮----
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
⋮----
const mapStageToStatus = (stage, metadataStatus) => {
const normalizedStage = typeof stage === 'string' ? stage.toLowerCase() : '';
const normalizedMetadata = typeof metadataStatus === 'string' ? metadataStatus.toLowerCase() : '';
⋮----
const normalizeContactStatusFilter = (value) => {
⋮----
const normalized = String(value).toLowerCase();
if (['registrada', 'registered', 'registration'].includes(normalized)) {
⋮----
if (['compensada', 'settled', 'settlement', 'compensado'].includes(normalized)) {
⋮----
if (['pendiente', 'pending'].includes(normalized)) {
⋮----
const buildContactMovementMatch = (contactId, filters = {}) => {
⋮----
const statusFilter = normalizeContactStatusFilter(filters.status);
⋮----
andConditions.push({ 'metadata.status': statusFilter.metadataStatus });
⋮----
andConditions.push({
⋮----
$regex: new RegExp(escapeRegex(filters.operationType), 'i'),
⋮----
if (Object.keys(range).length) {
⋮----
const regex = new RegExp(escapeRegex(filters.search), 'i');
⋮----
const buildContactFilterOptions = (operationTypes = [], currencies = [], stages = [], metadataStatuses = []) => {
⋮----
.filter(Boolean)
.map((value) => ({ value, label: value }))
.sort((a, b) => a.label.localeCompare(b.label));
⋮----
const statusKeys = new Set();
stages.filter(Boolean).forEach((stage) => {
const { key } = mapStageToStatus(stage);
⋮----
statusKeys.add(key);
⋮----
metadataStatuses.filter(Boolean).forEach((metadataStatus) => {
const { key } = mapStageToStatus(null, metadataStatus);
⋮----
const statusOptions = Array.from(statusKeys)
.map((key) => ({ value: key, label: STATUS_LABELS[key] || key }))
⋮----
const getContactBalanceDetail = async (contactIdInput, query = {}) => {
if (!mongoose.Types.ObjectId.isValid(contactIdInput)) {
throw new AppError('El contacto indicado no es válido.', 400, {
⋮----
const contact = await Client.findById(contactIdInput)
⋮----
throw new AppError('El contacto indicado no existe.', 404, {
⋮----
const contactId = new mongoose.Types.ObjectId(contactIdInput);
⋮----
const numericLimit = Math.min(Math.max(Number(limit) || CONTACT_BALANCE_DEFAULT_LIMIT, 1), 100);
const normalizedSortBy = CONTACT_BALANCE_SORT_FIELDS.has(sortBy) ? sortBy : 'date';
⋮----
const match = buildContactMovementMatch(contactId, filters);
⋮----
const [totalItems, operations, aggregatedTotals, totalsByCurrency, filterSource] = await Promise.all([
CurrentAccountMovement.countDocuments(match),
CurrentAccountMovement.find(match)
.sort(sortStage)
.skip(skip)
.limit(numericLimit)
.lean(),
CurrentAccountMovement.aggregate([
⋮----
$match: buildContactMovementMatch(contactId, {
⋮----
balance: roundAmount(totalsEntry.balance || 0),
⋮----
amount: roundAmount(totalsEntry.incoming || 0),
⋮----
amount: roundAmount(Math.abs(totalsEntry.outgoing || 0)),
⋮----
net: roundAmount((totalsEntry.incoming || 0) + (totalsEntry.outgoing || 0)),
⋮----
? new Date(totalsEntry.lastMovementAt).toISOString()
⋮----
const totalsByCurrencyList = totalsByCurrency.map((entry) => ({
⋮----
total: roundAmount(entry.total || 0),
⋮----
const filterOptions = buildContactFilterOptions(
⋮----
const operationsList = operations.map((operation) => {
const amount = roundAmount(operation.amount || 0);
⋮----
const status = mapStageToStatus(operation.stage, operation.metadata?.status);
⋮----
id: operation._id ? operation._id.toString() : null,
createdAt: operation.createdAt ? new Date(operation.createdAt).toISOString() : null,
⋮----
const baseMatchWithoutDate = buildContactMovementMatch(contactId, {
⋮----
const [currentWindowTotals, previousWindowTotals] = await Promise.all([
⋮----
const variationPercentage = computeVariationPercentage(currentNet, previousNet);
⋮----
currentPeriodNet: roundAmount(currentNet),
previousPeriodNet: roundAmount(previousNet),
⋮----
id: contact._id ? contact._id.toString() : contactIdInput,
⋮----
currency: currency ? String(currency).toUpperCase() : totalsByCurrencyList[0]?.currency || 'ARS',
⋮----
totalPages: Math.max(1, Math.ceil(totalItems / numericLimit)),
⋮----
const getLinkedBalanceDetail = async (keyInput, options = {}) => {
const config = getBalanceConfig(keyInput);
⋮----
throw new AppError('La cuenta indicada no existe.', 404);
⋮----
const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
const sanitizedPage = Math.max(Number(page) || 1, 1);
if (contactId && !mongoose.Types.ObjectId.isValid(contactId)) {
throw new AppError('El contacto indicado no es válido.', 400);
⋮----
const match = buildMovementMatch(config.id, { dateFrom, dateTo, type, contactId });
const [totalItems, movements] = await Promise.all([
TreasuryMovement.countDocuments(match),
TreasuryMovement.find(match)
⋮----
.skip((sanitizedPage - 1) * sanitizedLimit)
⋮----
const formattedMovements = movements.map((movement) =>
formatTreasuryMovement(movement, contacts)
⋮----
const [totals, overallTotals, variation, summaryEntry] = await Promise.all([
fetchMovementTotalsForBalance(config.id, { dateFrom, dateTo, type, contactId }),
⋮----
computeVariationForBalance(config.id),
⋮----
const baseBalances = await getTreasuryBalances();
const baseMap = new Map(baseBalances.map((balance) => [balance.id, balance]));
return buildLinkedBalanceSummaryEntry(config, baseMap, {
⋮----
const [contactsBreakdown, recentActivity, recentMovements] = await Promise.all([
fetchContactSummariesForBalance(config.id, contactLimit, { dateFrom, dateTo, type, contactId }),
⋮----
fetchRecentMovementsForBalance(config.id, recentMovementsLimit, { dateFrom, dateTo, type }),
⋮----
dateFrom: new Date(Date.now() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY)
.toISOString()
.split('T')[0],
dateTo: new Date().toISOString().split('T')[0],
⋮----
totalPages: Math.max(1, Math.ceil(totalItems / sanitizedLimit)),
⋮----
const roundAmount = (value) => {
const numeric = Number(value);
if (!Number.isFinite(numeric)) {
⋮----
return Math.round(numeric * 100) / 100;
⋮----
const normalizeBalanceKey = (movementType) => {
⋮----
const resolveMovementBalanceType = (currency, medium) => {
const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'ARS';
⋮----
const ensureBalance = async (key, currency, { amount = 0, session } = {}) => {
await TreasuryBalance.updateOne(
⋮----
const adjustTreasuryBalanceForMovement = async (
⋮----
const key = normalizeBalanceKey(movementType);
⋮----
const numericDelta = Number(delta);
if (!Number.isFinite(numericDelta) || numericDelta === 0) {
return TreasuryBalance.findOne({ key, currency: normalizedCurrency })
.session(session || null)
⋮----
await ensureBalance(key, normalizedCurrency, { session });
⋮----
(await TreasuryBalance.findOne({ key, currency: normalizedCurrency }).session(session || null)) ||
new TreasuryBalance({ key, currency: normalizedCurrency, amount: 0 });
const currentAmount = Number(balance.amount) || 0;
const nextAmount = Math.round((currentAmount + numericDelta) * 100) / 100;
⋮----
if (userId && mongoose.Types.ObjectId.isValid(userId)) {
⋮----
await balance.save({ session });
return balance.toObject();
⋮----
const formatBalance = (balance) => {
⋮----
amount: Number(Number(balance.amount || 0).toFixed(2)),
⋮----
updatedAt: (balance.updatedAt || balance.createdAt || new Date()).toISOString(),
⋮----
const getTreasuryBalances = async () => {
await Promise.all([
ensureBalance('transfers', 'ARS'),
ensureBalance('cash', 'ARS'),
ensureBalance('usd', 'USD'),
⋮----
const balances = await TreasuryBalance.find({})
.sort({ key: 1 })
⋮----
return balances.map(formatBalance).filter(Boolean);
⋮----
const generateTreasuryMovementCode = async () => {
⋮----
const code = `${prefix}${Math.floor(Math.random() * 1_000_000)
.toString()
.padStart(6, '0')}`;
const exists = await TreasuryMovement.exists({ movementCode: code });
⋮----
return `${prefix}${Date.now()}`;
⋮----
const buildAuditEntry = (action, userId, metadata = {}) => ({
⋮----
user: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
timestamp: new Date(),
⋮----
const formatContact = (contact) => {
⋮----
? contact._id.toString()
⋮----
const formatMovementOperation = (operation) => ({
id: operation.id ? operation.id.toString() : null,
⋮----
amount: roundAmount(operation.amount || 0),
matchedAt: operation.matchedAt ? new Date(operation.matchedAt).toISOString() : null,
matchedBy: operation.matchedBy ? operation.matchedBy.toString() : null,
⋮----
const formatTreasuryMovement = (movement, contacts = []) => {
⋮----
movement.contact && contactMap.has(movement.contact.toString())
? formatContact(contactMap.get(movement.contact.toString()))
⋮----
? { id: movement.contact.toString() }
⋮----
id: movement._id ? movement._id.toString() : null,
⋮----
amount: roundAmount(movement.amount),
⋮----
movementAt: movement.movementAt ? new Date(movement.movementAt).toISOString() : null,
⋮----
linkedOperations: Array.isArray(movement.linkedOperations)
? movement.linkedOperations.map(formatMovementOperation)
⋮----
createdAt: movement.createdAt ? new Date(movement.createdAt).toISOString() : null,
updatedAt: movement.updatedAt ? new Date(movement.updatedAt).toISOString() : null,
⋮----
? new Date(movement.compensatedAt).toISOString()
⋮----
compensatedBy: movement.compensatedBy ? movement.compensatedBy.toString() : null,
cancelledAt: movement.cancelledAt ? new Date(movement.cancelledAt).toISOString() : null,
cancelledBy: movement.cancelledBy ? movement.cancelledBy.toString() : null,
⋮----
auditTrail: Array.isArray(movement.auditTrail)
? movement.auditTrail.map((entry) => ({
⋮----
user: entry.user ? entry.user.toString() : null,
timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
⋮----
const deriveTransactionAmountForCurrency = (transaction, currency) => {
⋮----
const normalizedCurrency = currency.toUpperCase();
⋮----
candidate.asset.code.toUpperCase() === normalizedCurrency
⋮----
return Number(candidate.amount);
⋮----
const getApplyTreasurySettlement = () => {
⋮----
throw new Error('applyTreasurySettlement is not available');
⋮----
const fetchOperationLink = async (operationPayload, { session } = {}) => {
⋮----
typeof typeInput === 'string' && typeInput.toLowerCase().includes('transfer')
⋮----
if (!id || !mongoose.Types.ObjectId.isValid(id)) {
throw new AppError('La operación asociada no es válida.', 400);
⋮----
const document = await Model.findById(id).session(session || null);
⋮----
throw new AppError('La operación asociada no existe.', 404);
⋮----
const validateAndNormalizeMovementPayload = async (payload = {}, { session } = {}) => {
const type = MOVEMENT_TYPES.includes(payload.type) ? payload.type : 'incoming';
⋮----
typeof payload.medium === 'string' && MOVEMENT_MEDIUMS.includes(payload.medium.toLowerCase())
? payload.medium.toLowerCase()
⋮----
throw new AppError('Seleccioná un medio válido (efectivo, transferencia o depósito).', 400);
⋮----
typeof payload.currency === 'string' && SUPPORTED_CURRENCIES.includes(payload.currency.toUpperCase())
? payload.currency.toUpperCase()
⋮----
throw new AppError('Seleccioná una moneda válida (ARS o USD).', 400);
⋮----
const amount = roundAmount(payload.amount);
if (!Number.isFinite(amount) || amount <= 0) {
throw new AppError('Ingresá un monto válido mayor a cero.', 400);
⋮----
const movementAt = movementAtInput ? new Date(movementAtInput) : new Date();
if (Number.isNaN(movementAt.getTime())) {
throw new AppError('La fecha/hora del movimiento es inválida.', 400);
⋮----
if (!mongoose.Types.ObjectId.isValid(contactIdCandidate)) {
throw new AppError('El contacto asociado no es válido.', 400);
⋮----
contactDoc = await Client.findById(contactIdCandidate).session(session || null);
⋮----
throw new AppError('El contacto asociado no existe o no está disponible.', 404);
⋮----
const operationLink = await fetchOperationLink(payload.operation || payload.operationReference, {
⋮----
if (candidate && mongoose.Types.ObjectId.isValid(candidate)) {
contactDoc = await Client.findById(candidate).session(session || null);
⋮----
typeof payload.reference === 'string' && payload.reference.trim().length
? payload.reference.trim()
⋮----
typeof payload.description === 'string' && payload.description.trim().length
? payload.description.trim()
⋮----
const registerTreasuryMovement = async (payload = {}, context = {}) => {
const session = await mongoose.startSession();
⋮----
const skipBalanceAdjustments = Boolean(context.skipBalanceAdjustments);
const skipSettlement = Boolean(context.skipSettlement);
const skipBalanceEvent = Boolean(context.skipBalanceEvent);
⋮----
await session.withTransaction(async () => {
const normalized = await validateAndNormalizeMovementPayload(payload, { session });
const applySettlement = getApplyTreasurySettlement();
const balanceMovementType = resolveMovementBalanceType(normalized.currency, normalized.medium);
const movementCode = await generateTreasuryMovementCode();
const movement = new TreasuryMovement({
⋮----
balanceKey: normalizeBalanceKey(balanceMovementType),
⋮----
context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null,
⋮----
auditTrail: [buildAuditEntry('registered', context.userId, { source: 'api' })],
⋮----
? deriveTransactionAmountForCurrency(document, normalized.currency) || normalized.amount
: Number(document.totalAmount || normalized.amount);
⋮----
amount: roundAmount(operationAmount || normalized.amount),
matchedAt: new Date(),
⋮----
context.userId && mongoose.Types.ObjectId.isValid(context.userId)
⋮----
document.completedAt = document.completedAt || new Date();
⋮----
await document.save({ session });
⋮----
await movement.save({ session });
⋮----
balanceSnapshot = await adjustTreasuryBalanceForMovement(
⋮----
balanceSnapshot = await TreasuryBalance.findOne({
key: normalizeBalanceKey(balanceMovementType),
⋮----
.session(session)
⋮----
await applySettlement(settlementPayload, {
⋮----
contactForResponse = normalized.contactDoc.toObject();
⋮----
if (contactCandidate && mongoose.Types.ObjectId.isValid(contactCandidate)) {
const contactDoc = await Client.findById(contactCandidate).session(session);
⋮----
contactForResponse = contactDoc.toObject();
⋮----
await recordTransactionSettlement(
⋮----
movement.compensatedAt = new Date();
⋮----
movement.auditTrail.push(
buildAuditEntry('compensated', context.userId, { method: 'auto-link' })
⋮----
context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null;
⋮----
movementDocument = movement.toObject();
⋮----
session.endSession();
⋮----
const formattedMovement = formatTreasuryMovement(movementDocument, contactForResponse ? [contactForResponse] : []);
⋮----
? roundAmount(movementDocument.amount || 0)
: -roundAmount(movementDocument?.amount || 0);
⋮----
emitBalanceUpdated({
⋮----
balance: balanceSnapshot ? formatBalance(balanceSnapshot) : null,
⋮----
const buildMovementQuery = (filters = {}) => {
⋮----
if (filters.type && MOVEMENT_TYPES.includes(filters.type)) {
⋮----
if (filters.medium && MOVEMENT_MEDIUMS.includes(filters.medium)) {
⋮----
if (filters.currency && SUPPORTED_CURRENCIES.includes(filters.currency.toUpperCase())) {
query.currency = filters.currency.toUpperCase();
⋮----
if (filters.status && ['registered', 'compensated', 'cancelled'].includes(filters.status)) {
⋮----
if (filters.contact && mongoose.Types.ObjectId.isValid(filters.contact)) {
query.contact = new mongoose.Types.ObjectId(filters.contact);
⋮----
const from = new Date(filters.dateFrom);
if (!Number.isNaN(from.getTime())) {
⋮----
const to = new Date(filters.dateTo);
if (!Number.isNaN(to.getTime())) {
to.setHours(23, 59, 59, 999);
⋮----
if (Object.keys(query.movementAt).length === 0) {
⋮----
const cleaned = filters.search.trim().replace(/^#/, '');
⋮----
// Use MongoDB text search for efficient lookup across indexed text fields. Requires text index on relevant fields.
⋮----
const listTreasuryMovements = async ({
⋮----
const numericLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
const query = buildMovementQuery(filters);
⋮----
const normalizedSort = allowedSortFields.includes(sortBy) ? sortBy : 'movementAt';
⋮----
const [aggregated] = await TreasuryMovement.aggregate([
⋮----
]).exec();
⋮----
const items = movements.map((movement) => formatTreasuryMovement(movement, contacts));
const totalsByCurrency = totals.reduce((acc, total) => {
⋮----
const amount = roundAmount(total.amount);
⋮----
acc[currency].incoming = roundAmount((acc[currency].incoming || 0) + amount);
acc[currency].net = roundAmount((acc[currency].net || 0) + amount);
⋮----
acc[currency].outgoing = roundAmount((acc[currency].outgoing || 0) + amount);
acc[currency].net = roundAmount((acc[currency].net || 0) - amount);
⋮----
const getTreasuryMovementById = async (idOrCode) => {
⋮----
throw new AppError('Debés indicar el movimiento a consultar.', 400);
⋮----
if (mongoose.Types.ObjectId.isValid(idOrCode)) {
movement = await TreasuryMovement.findById(idOrCode).lean();
⋮----
movement = await TreasuryMovement.findOne({ movementCode: idOrCode }).lean();
⋮----
throw new AppError('El movimiento solicitado no existe.', 404);
⋮----
? await Client.find({ _id: movement.contact })
⋮----
return formatTreasuryMovement(movement, contacts);
⋮----
const compensateTreasuryMovement = async (movementId, payload = {}, context = {}) => {
if (!mongoose.Types.ObjectId.isValid(movementId)) {
throw new AppError('El identificador de movimiento es inválido.', 400);
⋮----
const movement = await TreasuryMovement.findById(movementId).session(session);
⋮----
throw new AppError('El movimiento indicado no existe.', 404);
⋮----
throw new AppError('No podés compensar un movimiento anulado.', 409);
⋮----
throw new AppError('El movimiento ya está compensado.', 409);
⋮----
const amount = payload.amount ? roundAmount(payload.amount) : roundAmount(movement.amount);
⋮----
throw new AppError('El monto a compensar es inválido.', 400);
⋮----
if (amount > roundAmount(movement.amount) && !payload.allowOverpay) {
throw new AppError('El monto a compensar supera el movimiento original.', 400);
⋮----
const balanceMovementType = resolveMovementBalanceType(movement.currency, movement.medium);
⋮----
contactDoc = await Client.findById(movement.contact).session(session);
⋮----
if (!mongoose.Types.ObjectId.isValid(payload.contactId)) {
⋮----
contactDoc = await Client.findById(payload.contactId).session(session);
⋮----
throw new AppError('El contacto indicado no existe.', 404);
⋮----
const operationLink = await fetchOperationLink(
⋮----
const existing = movement.linkedOperations.find((op) =>
op.id && operationLink && String(op.id) === String(operationLink.document._id)
⋮----
? deriveTransactionAmountForCurrency(operationLink.document, movement.currency) ||
⋮----
: Number(operationLink.document.totalAmount || amount);
movement.linkedOperations.push({
⋮----
amount: roundAmount(operationAmount || amount),
⋮----
operationLink.document.completedAt || new Date();
⋮----
await operationLink.document.save({ session });
⋮----
buildAuditEntry('compensated', context.userId, {
⋮----
updatedDocument = movement.toObject();
⋮----
return formatTreasuryMovement(
⋮----
const cancelTreasuryMovement = async (movementId, { reason } = {}, context = {}) => {
⋮----
throw new AppError('El movimiento ya se encuentra anulado.', 409);
⋮----
throw new AppError('No podés anular un movimiento compensado.', 409);
⋮----
await adjustTreasuryBalanceForMovement(balanceMovementType, movement.currency, -delta, {
⋮----
const contactDoc = await Client.findById(movement.contact).session(session);
⋮----
movement.cancelledAt = new Date();
⋮----
typeof reason === 'string' && reason.trim().length ? reason.trim() : null;
⋮----
buildAuditEntry('cancelled', context.userId, {
⋮----
const linkedOperations = Array.isArray(movement.linkedOperations)
⋮----
const linkedTransactions = linkedOperations.filter(
⋮----
await Promise.all(
linkedTransactions.map((op) =>
revertTransactionSettlement(op.id, movement._id, {
⋮----
const linkedTransfers = linkedOperations.filter(
⋮----
linkedTransfers.map(async (op) => {
const transfer = await TransferOperation.findById(op.id).session(session);
⋮----
transfer.cancelledAt = new Date();
⋮----
await transfer.save({ session });
⋮----
const suggestCompensationsForMovement = async (movementId, { limit = 10 } = {}) => {
⋮----
const movement = await TreasuryMovement.findById(movementId).lean();
⋮----
const candidateMovements = await CurrentAccountMovement.find(query)
⋮----
.limit(Math.min(Math.max(Number(limit) || 10, 1), 25))
⋮----
movement: formatTreasuryMovement(movement),
⋮----
.map((entry) => (entry.operation?.source === 'transaction' ? entry.operation.id : null))
⋮----
? await Transaction.find({ _id: { $in: transactionIds } })
.select({
⋮----
const transactionMap = new Map(transactions.map((tx) => [tx._id.toString(), tx]));
⋮----
.select({ fullName: 1, shortName: 1, contactType: 1 })
⋮----
const contactMap = new Map(contacts.map((contact) => [contact._id.toString(), contact]));
const suggestions = candidateMovements.map((entry) => {
const absoluteMovementAmount = Math.abs(Number(movement.amount) || 0);
const absoluteEntryAmount = Math.abs(Number(entry.amount) || 0);
const amountDifference = roundAmount(Math.abs(absoluteMovementAmount - absoluteEntryAmount));
⋮----
const createdAt = entry.createdAt ? new Date(entry.createdAt) : null;
const movementDate = movement.movementAt ? new Date(movement.movementAt) : null;
⋮----
? Math.round(Math.abs(createdAt.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24))
⋮----
? transactionMap.get(entry.operation.id?.toString())
⋮----
(movement.contact && entry.contact && movement.contact.toString() === entry.contact.toString() ? 0 : 0.5) +
⋮----
id: entry._id.toString(),
⋮----
id: transaction._id.toString(),
⋮----
confirmedAt: transaction.completedAt ? transaction.completedAt.toISOString() : null,
⋮----
id: entry.operation.id.toString(),
⋮----
suggestionId: entry._id.toString(),
currentAccountMovementId: entry._id.toString(),
⋮----
ratio: Number(ratio.toFixed(4)),
⋮----
movement.contact.toString() === entry.contact.toString(),
⋮----
score: Number(score.toFixed(4)),
⋮----
movement: formatTreasuryMovement(movement, contacts),
```

## File: src/services/treasuryEvent.service.js
```javascript
const buildDistributionSummary = (lines = []) =>
lines.map((line) => ({
⋮----
const createTransferOperationEvents = async (operationDocument, { session } = {}) => {
⋮----
distributionSummary: buildDistributionSummary(operationDocument.distributionLines),
⋮----
contacts: baseOperation.distributionSummary.map((summary) => ({
⋮----
const created = await TreasuryEvent.insertMany(events, { session });
return created.map((event) => event.toObject());
```

## File: src/utils/AppError.js
```javascript
class AppError extends Error {
```

## File: src/utils/authCookie.js
```javascript
const buildCookieOptions = (remember = false) => {
⋮----
Number(process.env.SESSION_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
⋮----
Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
⋮----
const attachAuthCookie = (res, token, options = {}) => {
⋮----
const remember = Boolean(options.remember);
res.cookie(COOKIE_NAME, token, buildCookieOptions(remember));
⋮----
const clearAuthCookie = (res) => {
⋮----
res.clearCookie(COOKIE_NAME, {
```

## File: src/utils/email.js
```javascript
const buildTransport = ({ port, secure, host, user, pass }) => {
⋮----
return nodemailer.createTransport({
⋮----
connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 15000,
socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000,
greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
⋮----
maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || 3,
maxMessages: Number(process.env.SMTP_MAX_MESSAGES) || 50,
⋮----
const getConfiguredPort = () => {
const requested = Number(process.env.SMTP_PORT);
if (Number.isFinite(requested) && requested > 0) {
⋮----
const getTransport = async ({ forceNew = false, port, secure } = {}) => {
⋮----
console.warn('SMTP_HOST not configured. Emails will be logged to the console.');
⋮----
const resolvedPort = port ?? getConfiguredPort();
⋮----
const transport = buildTransport({ port: resolvedPort, secure: resolvedSecure });
⋮----
const shouldAttemptTlsFallback = (error, transport) => {
⋮----
const currentSecure = Boolean(transport?.options?.secure);
⋮----
transientCodes.includes(error.code) &&
Number(currentPort) === 587 &&
⋮----
const getBackupTransportIfConfigured = () => {
⋮----
const port = Number(process.env.SMTP_BACKUP_PORT) || 587;
⋮----
return buildTransport({ port, secure, host, user, pass });
⋮----
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sendWithRetries = async (transport, mailOptions) => {
const maxAttempts = Number(process.env.SMTP_RETRY_ATTEMPTS) || 2;
const backoffMs = Number(process.env.SMTP_RETRY_BACKOFF_MS) || 1500;
⋮----
for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
⋮----
await transport.verify();
⋮----
await transport.sendMail(mailOptions);
⋮----
console.warn(
⋮----
if (shouldAttemptTlsFallback(error, transport)) {
console.warn('Retrying with implicit TLS (465)...');
⋮----
const tlsTransport = await getTransport({ forceNew: true, port: 465, secure: true });
⋮----
if (transientCodes.includes(error.code) && attempt < Math.max(1, maxAttempts)) {
await sleep(backoffMs * attempt);
⋮----
const sendEmail = async ({ to, subject, html, text }) => {
⋮----
let transport = await getTransport();
⋮----
console.log('----- Email Log -----');
console.log({ to, subject, text, html });
⋮----
await sendWithRetries(transport, { from, to, subject, text, html });
⋮----
const backup = getBackupTransportIfConfigured();
⋮----
await sendWithRetries(backup, { from, to, subject, text, html });
⋮----
console.error('Backup SMTP also failed', backupErr);
⋮----
const verifySmtpConnection = async () => {
const transport = await getTransport();
```

## File: src/utils/eventBus.js
```javascript
class AppEventBus extends EventEmitter {}
const eventBus = new AppEventBus();
const emitBalanceUpdated = (payload = {}) => {
eventBus.emit(BALANCE_UPDATED_EVENT, {
⋮----
emittedAt: new Date().toISOString(),
⋮----
const subscribeBalanceUpdated = (listener) => {
eventBus.on(BALANCE_UPDATED_EVENT, listener);
return () => eventBus.off(BALANCE_UPDATED_EVENT, listener);
```

## File: src/utils/responseCache.js
```javascript
const cache = new Map();
function getEntry(key) {
const entry = cache.get(key);
⋮----
if (entry.expiresAt && entry.expiresAt > Date.now()) {
⋮----
cache.delete(key);
⋮----
function setEntry(key, payload, ttlMs) {
const body = JSON.stringify(payload ?? null);
const etag = `W/"${crypto.createHash('md5').update(body).digest('hex')}"`;
const expiresAt = Date.now() + Number(ttlMs || 0);
⋮----
cache.set(key, value);
⋮----
function invalidateEntry(key) {
⋮----
async function sendCached({ req, res, compute, key, ttlMs }) {
let entry = getEntry(key);
⋮----
const payload = await compute();
entry = setEntry(key, payload, ttlMs);
⋮----
res.set('ETag', entry.etag);
res.set('Cache-Control', `private, max-age=${Math.floor(Number(ttlMs || 0) / 1000)}`);
const ifNoneMatch = req.get('If-None-Match');
⋮----
return res.status(304).end();
⋮----
return res.json(entry.payload);
⋮----
function buildUserAwareKey(req, baseKey) {
```

## File: src/utils/seedLogisticsOperations.js
```javascript
const buildTimeline = (steps) =>
steps.map((step) => ({
⋮----
timestamp: step.timestamp ? new Date(step.timestamp) : null,
⋮----
const seedLogisticsOperations = async () => {
⋮----
const existing = await LogisticsOperation.estimatedDocumentCount();
⋮----
scheduledAt: new Date('2025-10-17T14:30:00-03:00'),
⋮----
timeline: buildTimeline([
⋮----
scheduledAt: new Date('2025-10-17T13:15:00-03:00'),
⋮----
scheduledAt: new Date('2025-10-17T11:45:00-03:00'),
⋮----
scheduledAt: new Date('2025-10-17T10:20:00-03:00'),
⋮----
scheduledAt: new Date('2025-10-16T18:05:00-03:00'),
⋮----
scheduledAt: new Date('2025-10-16T09:25:00-03:00'),
⋮----
scheduledAt: new Date('2025-10-15T15:45:00-03:00'),
⋮----
scheduledAt: new Date('2025-10-14T12:05:00-03:00'),
⋮----
await LogisticsOperation.insertMany(sampleOperations);
console.log('Seeded logistics operations');
```

## File: src/utils/token.js
```javascript
const generateRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
```

## File: tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./client/tsconfig.json" }
  ]
}
```
