import React, { useEffect, useMemo } from 'react';
import { Button } from '../../shared/design-system';
import { useDashboardOperations } from '../../../hooks';
import { DashboardOperationRow } from '../../../types';

interface OperationsReportPanelProps {
  open: boolean;
  onClose: () => void;
}

type SummaryEntry = {
  label: string;
  count: number;
};

const parseMargin = (label: string) => {
  if (!label) return null;
  const normalized = label.replace(',', '.');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
};

const formatRelativeTime = (isoDate: string) => {
  const now = Date.now();
  const timestamp = new Date(isoDate).getTime();
  const diffMs = Math.max(now - timestamp, 0);
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'hace instantes';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
};

const buildCounts = (items: DashboardOperationRow[], selector: (item: DashboardOperationRow) => string) => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = selector(item).trim() || 'Sin dato';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
};

export const OperationsReportPanel: React.FC<OperationsReportPanelProps> = ({ open, onClose }) => {
  const { items, loading, error, refresh } = useDashboardOperations({ limit: 50 });

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const summary = useMemo(() => {
    const total = items.length;
    const typeBreakdown = buildCounts(items, (item) => item.typeLabel);
    const statusBreakdown = buildCounts(items, (item) => item.statusLabel);
    const clientBreakdown = buildCounts(items, (item) => item.clientName);

    const marginValues = items
      .map((item) => parseMargin(item.marginLabel))
      .filter((value): value is number => value !== null);

    const averageMargin =
      marginValues.length > 0
        ? marginValues.reduce((acc, value) => acc + value, 0) / marginValues.length
        : null;

    const marginRange =
      marginValues.length > 0
        ? { min: Math.min(...marginValues), max: Math.max(...marginValues) }
        : null;

    return {
      total,
      typeBreakdown,
      statusBreakdown,
      clientBreakdown,
      averageMargin,
      marginRange,
    };
  }, [items]);

  if (!open) return null;

  const totalForPercent = summary.total || 1;
  const topClients = summary.clientBreakdown.slice(0, 4);
  const recentActivity = items.slice(0, 6);

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      sampleSize: summary.total,
      averageMargin: summary.averageMargin,
      marginRange: summary.marginRange,
      typeBreakdown: summary.typeBreakdown,
      statusBreakdown: summary.statusBreakdown,
      topClients,
      recentActivity: recentActivity.map((op) => ({
        id: op.id,
        clientName: op.clientName,
        typeLabel: op.typeLabel,
        statusLabel: op.statusLabel,
        createdAt: op.createdAt,
        receivesText: op.receivesText,
        paysText: op.paysText,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-operaciones.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderBreakdown = (entries: SummaryEntry[], emptyLabel: string) => {
    if (!entries.length) {
      return <p className="text-sm text-gray-500">{emptyLabel}</p>;
    }

    return (
      <div className="space-y-3">
        {entries.map((entry, idx) => {
          const pct = Math.min(Math.round((entry.count / totalForPercent) * 100), 100);
          const accent = idx % 3 === 0 ? 'bg-primary' : idx % 3 === 1 ? 'bg-emerald-500' : 'bg-amber-500';
          return (
            <div key={entry.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm font-medium text-text-primary">
                <span>{entry.label}</span>
                <span className="text-gray-600">
                  {entry.count} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${accent}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 py-10 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">Reportes / Informacion operativa</p>
            <h2 className="text-2xl font-bold text-text-primary leading-tight">Resumen de operaciones</h2>
            <p className="text-sm text-gray-600">
              Ultimas {summary.total} operaciones analizadas para ofrecer una vista ejecutiva.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="fa-solid fa-arrows-rotate"
              onClick={() => {
                const promise = refresh();
                if (promise && typeof (promise as Promise<unknown>).catch === 'function') {
                  (promise as Promise<unknown>).catch(() => {});
                }
              }}
            >
              Actualizar
            </Button>
            <Button variant="primary" size="sm" icon="fa-solid fa-file-arrow-down" onClick={handleExport}>
              Exportar
            </Button>
            <Button variant="ghost" size="sm" icon="fa-solid fa-xmark" onClick={onClose} aria-label="Cerrar reporte" />
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
              <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-between bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl">
              <div>
                <p className="font-semibold text-sm">No pudimos cargar el reporte.</p>
                <p className="text-sm text-red-600">Reintenta o verifica la conexion.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon="fa-solid fa-rotate-right"
                onClick={() => {
                  const promise = refresh();
                  if (promise && typeof (promise as Promise<unknown>).catch === 'function') {
                    (promise as Promise<unknown>).catch(() => {});
                  }
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-white shadow-sm">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Total revisado</p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">{summary.total}</p>
                  <p className="text-sm text-gray-600 mt-1">Ultimas operaciones registradas</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo dominante</p>
                  <p className="mt-2 text-xl font-semibold text-text-primary">
                    {summary.typeBreakdown[0]?.label || 'Sin datos'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {summary.typeBreakdown[0]
                      ? `${summary.typeBreakdown[0].count} operaciones (${Math.round(
                          (summary.typeBreakdown[0].count / totalForPercent) * 100
                        )}%)`
                      : 'Se calculara al recibir datos'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Margen promedio</p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">
                    {summary.averageMargin !== null ? `${summary.averageMargin.toFixed(2)}%` : '--'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {summary.marginRange
                      ? `Rango ${summary.marginRange.min.toFixed(2)}% - ${summary.marginRange.max.toFixed(2)}%`
                      : 'Margenes no informados'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clientes activos</p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">{summary.clientBreakdown.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Con al menos una operacion en el periodo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Distribucion</p>
                      <h3 className="text-lg font-semibold text-text-primary">Por tipo de operacion</h3>
                    </div>
                    <span className="text-xs text-gray-500">Ultimas {summary.total} operaciones</span>
                  </div>
                  {renderBreakdown(summary.typeBreakdown, 'Sin operaciones para mostrar')}
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Riesgo y seguimiento</p>
                      <h3 className="text-lg font-semibold text-text-primary">Estados operativos</h3>
                    </div>
                    <span className="text-xs text-gray-500">Detalle rapido</span>
                  </div>
                  {renderBreakdown(summary.statusBreakdown, 'Sin estados registrados')}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Clientes</p>
                      <h3 className="text-lg font-semibold text-text-primary">Top relaciones</h3>
                    </div>
                    <span className="text-xs text-gray-500">Top 4</span>
                  </div>
                  {topClients.length === 0 ? (
                    <p className="text-sm text-gray-500">Aun no hay clientes con operaciones en este periodo.</p>
                  ) : (
                    <ul className="space-y-3">
                      {topClients.map((client, idx) => (
                        <li key={client.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                              {client.label
                                .split(' ')
                                .map((part) => part.charAt(0))
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{client.label}</p>
                              <p className="text-xs text-gray-600">Operaciones recientes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-text-primary">{client.count}</p>
                            <p className="text-xs text-gray-500">
                              {Math.round((client.count / totalForPercent) * 100)}% del total
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Actividad</p>
                      <h3 className="text-lg font-semibold text-text-primary">Linea de tiempo reciente</h3>
                    </div>
                    <span className="text-xs text-gray-500">Actualizado al momento</span>
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay actividad reciente para mostrar.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentActivity.map((op) => (
                        <div key={op.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <i className="fa-solid fa-chart-line" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                {op.typeLabel} - {op.clientName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {op.receivesText} / {op.paysText}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{formatRelativeTime(op.createdAt)}</p>
                            <span
                              className={`inline-flex items-center justify-center text-xs font-semibold px-2 py-1 rounded-full ${op.statusClassName || 'bg-gray-100 text-gray-700'}`}
                            >
                              {op.statusLabel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
