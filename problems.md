### Accounting Issues Tracking

- [x] Corregir el mapeo de liquidaciones para operaciones `buy` (`registerTreasuryMovement` → `direction: 'incoming'`).
- [x] Registrar la cuenta por cobrar inicial al crear transferencias en pesos antes de liquidar (`registerTransferRegistration`).
- [x] Ajustar `reverseTransactionRegistration` para usar el enum válido y aplicar el delta inverso.
- [x] Agregar guardarraíl contra compensaciones duplicadas en `recordTransactionSettlement`.
- [x] Restaurar la traza contable completa al permitir `settlement_reverted` tras la reversa exitosa.
