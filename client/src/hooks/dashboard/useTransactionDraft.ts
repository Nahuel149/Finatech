import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  TransactionDraft,
  TransactionDraftPayload,
  TransactionSettlementPayload,
} from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';

export const useTransactionDraft = (draftId?: string | null) => {
  const [draft, setDraft] = useState<TransactionDraft | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(draftId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchDraft = useCallback(async () => {
    if (!draftId) {
      setDraft(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<TransactionDraft>(`/api/transactions/${draftId}`, {
        method: 'GET',
      });
      setDraft(response);
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const persistDraft = useCallback(
    async (payload: TransactionDraftPayload) => {
      setSaving(true);
      setError(null);
      try {
        const endpoint = draft?.id
          ? `/api/transactions/draft/${draft.id}`
          : '/api/transactions/draft';
        const method = draft?.id ? 'PUT' : 'POST';
        const response = await apiRequest<TransactionDraft>(endpoint, {
          method,
          body: payload,
        });
        setDraft(response);
        return response;
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        throw apiErr;
      } finally {
        setSaving(false);
      }
    },
    [draft],
  );

  const advanceStep = useCallback(
    async (step: number) => {
      if (!draft?.id) {
        throw new Error('No hay borrador disponible para avanzar.');
      }
      setSaving(true);
      setError(null);
      try {
        const response = await apiRequest<TransactionDraft>(
          `/api/transactions/draft/${draft.id}/step`,
          {
            method: 'PATCH',
            body: { step },
          }
        );
        setDraft(response);
        return response;
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        throw apiErr;
      } finally {
        setSaving(false);
      }
    },
    [draft],
  );

  const updateSettlement = useCallback(
    async (payload: TransactionSettlementPayload) => {
      const targetId = draft?.id || draftId;
      if (!targetId) {
        throw new Error('No hay un borrador válido para actualizar.');
      }

      setSaving(true);
      setError(null);

      try {
        const response = await apiRequest<TransactionDraft>(
          `/api/transactions/draft/${targetId}/settlement`,
          {
            method: 'PUT',
            body: payload,
          }
        );
        setDraft(response);
        return response;
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        throw apiErr;
      } finally {
        setSaving(false);
      }
    },
    [draft?.id, draftId],
  );

  const finalizeDraft = useCallback(async () => {
    const targetId = draft?.id || draftId;
    if (!targetId) {
      throw new Error('No hay un borrador válido para confirmar.');
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest<TransactionDraft>(
        `/api/transactions/draft/${targetId}/finalize`,
        {
          method: 'POST',
        }
       );
      setDraft(response);
      return response;
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
      throw apiErr;
    } finally {
      setSaving(false);
    }
  }, [draft?.id, draftId]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    draft,
    loading,
    saving,
    error,
    fetchDraft,
    saveDraft: persistDraft,
    advanceStep,
    resetError,
    finalize: finalizeDraft,
    updateSettlement,
  };
};
