import React from 'react';
import { useTransferOperations } from '../../../hooks';
import { TransferOperation } from '../../../types';

interface Props {
  search?: string;
}

const statusBadgeClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20';
    case 'registered':
      return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20';
    case 'error':
      return 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20';
    default:
      return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20';
  }
};

const amountStr = (op: TransferOperation) => {
  const locale = op.currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: op.currency }).format(op.totalAmount);
};

const clientStr = (op: TransferOperation) => {
  const names = (op.distributionLines || []).map((l) => l.contactName).filter(Boolean) as string[];
  if (!names.length) return '—';
  if (names.length === 1) return names[0]!;
  return `${names[0]} + ${names.length - 1} más`;
};

const typeStr = (op: TransferOperation) => {
  const mt = op.movementType;
  if (mt === 'cash') return 'Efectivo';
  if (mt === 'transfer') return 'Transferencia';
  return mt;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isSameDay) return `Hoy ${h}:${m}`;
  if (isYesterday) return `Ayer ${h}:${m}`;
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${h}:${m}`;
};

export const RecentOperationsTable: React.FC<Props> = ({ search = '' }) => {
  const { items, loading, error, refresh } = useTransferOperations({ limit: 10, skip: 0, query: search });

  return (
    <section id="recent-operations" className="mb-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">Operaciones recientes</h2>
              <p className="text-gray-600">Últimas operaciones registradas en el sistema</p>
            </div>
            <button className="text-primary hover:underline font-medium">Ver historial</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 w-24 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}

              {!loading && !error && items.map((op) => (
                <tr key={op.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.operationCode || op.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeStr(op)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clientStr(op)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{amountStr(op)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(op.status)}`}>
                      {op.status || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(op.confirmedAt || op.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary hover:underline">Ver</button>
                  </td>
                </tr>
              ))}

              {!loading && error && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={7}>
                    <div className="flex items-center justify-between">
                      <span>Error al cargar operaciones. Verifica tu conexión.</span>
                      <button onClick={() => refresh()} className="text-primary hover:underline">Reintentar</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};