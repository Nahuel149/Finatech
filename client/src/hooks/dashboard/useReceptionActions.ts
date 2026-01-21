import { useCallback, useState } from 'react';
import { ApiError } from '../../types/auth';
import { ConfirmTreasuryReceptionPayload, OmitTreasuryReceptionPayload, RevertTreasuryReceptionPayload, TreasuryReception } from '../../types/treasuryReceptions';
import { handleApiError } from '../../utils/api';
import { confirmTreasuryReception as confirmReceptionApi, omitTreasuryReception as omitReceptionApi, revertTreasuryReception as revertReceptionApi } from '../../utils/treasuryReceptionsApi';

export type ReceptionActionType = 'confirm' | 'omit' | 'revert';

interface ReceptionActionsHook {
  runningAction: ReceptionActionType | null;
  error: ApiError | null;
  confirmReception: (
    receptionId: string,
    payload?: ConfirmTreasuryReceptionPayload
  ) => Promise<TreasuryReception>;
  omitReception: (
    receptionId: string,
    payload: OmitTreasuryReceptionPayload
  ) => Promise<TreasuryReception>;
  revertReception: (
    receptionId: string,
    payload?: RevertTreasuryReceptionPayload
  ) => Promise<TreasuryReception>;
  resetError: () => void;
}

export const useReceptionActions = (): ReceptionActionsHook => {
  const [runningAction, setRunningAction] = useState<ReceptionActionType | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async <T>(type: ReceptionActionType, handler: () => Promise<T>): Promise<T> => {
      setRunningAction(type);
      setError(null);
      try {
        const result = await handler();
        return result;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError);
        throw apiError;
      } finally {
        setRunningAction(null);
      }
    },
    []
  );

  const confirmReception = useCallback(
    async (
      receptionId: string,
      payload: ConfirmTreasuryReceptionPayload = {}
    ): Promise<TreasuryReception> =>
      execute('confirm', () => confirmReceptionApi(receptionId, payload)),
    [execute]
  );

  const omitReception = useCallback(
    async (
      receptionId: string,
      payload: OmitTreasuryReceptionPayload
    ): Promise<TreasuryReception> =>
      execute('omit', () => omitReceptionApi(receptionId, payload)),
    [execute]
  );

  const revertReception = useCallback(
    async (
      receptionId: string,
      payload: RevertTreasuryReceptionPayload = {}
    ): Promise<TreasuryReception> =>
      execute('revert', () => revertReceptionApi(receptionId, payload)),
    [execute]
  );

  const resetError = useCallback(() => setError(null), []);

  return {
    runningAction,
    error,
    confirmReception,
    omitReception,
    revertReception,
    resetError,
  };
};
