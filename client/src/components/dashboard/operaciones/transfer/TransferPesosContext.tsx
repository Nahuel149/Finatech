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
}

const DEFAULT_STATE: TransferDraftState = {
  movementType: null,
  direction: null,
  totalAmount: 0,
  distributionLines: [],
};

const TransferPesosContext = createContext<TransferPesosContextValue | undefined>(undefined);

let lineCounter = 0;
const generateLineId = () => {
  lineCounter += 1;
  return `transfer-line-${lineCounter}`;
};

export const TransferPesosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<TransferDraftState>(DEFAULT_STATE);
  const [lastOperation, setLastOperation] = useState<TransferOperation | null>(null);

  const setMovementType = useCallback((movementType: MovementType) => {
    setDraft((prev) => ({
      ...prev,
      movementType,
    }));
  }, []);

  const setDirection = useCallback((direction: MovementDirection) => {
    setDraft((prev) => ({
      ...prev,
      direction,
    }));
  }, []);

  const setTotalAmount = useCallback((totalAmount: number) => {
    setDraft((prev) => ({
      ...prev,
      totalAmount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0,
    }));
  }, []);

  const addLine = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      distributionLines: [
        ...prev.distributionLines,
        {
          id: generateLineId(),
          contactId: null,
          contactName: '',
          contactType: null,
          cuit: null,
          method: 'ARS',
          amount: 0,
        },
      ],
    }));
  }, []);

  const updateLine = useCallback(
    (lineId: string, updater: (line: TransferDraftLine) => TransferDraftLine) => {
      setDraft((prev) => ({
        ...prev,
        distributionLines: prev.distributionLines.map((line) =>
          line.id === lineId ? updater(line) : line
        ),
      }));
    },
    []
  );

  const updateLineAmount = useCallback(
    (lineId: string, amount: number) => {
      updateLine(lineId, (line) => ({
        ...line,
        amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
      }));
    },
    [updateLine]
  );

  const updateLineMethod = useCallback(
    (lineId: string, method: MovementMethod) => {
      updateLine(lineId, (line) => ({
        ...line,
        method,
      }));
    },
    [updateLine]
  );

  const setLineContact = useCallback(
    (
      lineId: string,
      payload: {
        contactId: string;
        contactName: string;
        contactType: string | null;
        cuit: string | null;
      }
    ) => {
      updateLine(lineId, (line) => ({
        ...line,
        contactId: payload.contactId,
        contactName: payload.contactName,
        contactType: payload.contactType,
        cuit: payload.cuit,
      }));
    },
    [updateLine]
  );

  const removeLine = useCallback((lineId: string) => {
    setDraft((prev) => ({
      ...prev,
      distributionLines: prev.distributionLines.filter((line) => line.id !== lineId),
    }));
  }, []);

  const reset = useCallback(() => {
    setDraft(DEFAULT_STATE);
    setLastOperation(null);
  }, []);

  const toPayload = useCallback(() => {
    if (
      !draft.movementType ||
      !draft.direction ||
      !Number.isFinite(draft.totalAmount) ||
      draft.totalAmount <= 0
    ) {
      return null;
    }

    const lines = draft.distributionLines.filter(
      (line) => line.contactId && Number.isFinite(line.amount) && line.amount > 0
    );

    if (!lines.length) {
      return null;
    }

    return lines.map<TransferDistributionLineInput>((line) => ({
      contactId: line.contactId!,
      method: line.method,
      amount: line.amount,
    }));
  }, [draft]);

  const value = useMemo<TransferPesosContextValue>(
    () => ({
      draft,
      lastOperation,
      setMovementType,
      setDirection,
      setTotalAmount,
      addLine,
      updateLineAmount,
      updateLineMethod,
      setLineContact,
      removeLine,
      reset,
      setLastOperation,
      toPayload,
    }),
    [
      draft,
      lastOperation,
      setMovementType,
      setDirection,
      setTotalAmount,
      addLine,
      updateLineAmount,
      updateLineMethod,
      setLineContact,
      removeLine,
      reset,
      setLastOperation,
      toPayload,
    ]
  );

  return <TransferPesosContext.Provider value={value}>{children}</TransferPesosContext.Provider>;
};

export const useTransferPesos = () => {
  const ctx = useContext(TransferPesosContext);
  if (!ctx) {
    throw new Error('useTransferPesos must be used within a TransferPesosProvider');
  }
  return ctx;
};
