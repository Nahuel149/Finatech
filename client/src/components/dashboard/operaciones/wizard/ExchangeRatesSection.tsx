import React from 'react';

interface Props {
  arsRate: number;
  onArsRateChange: (value: number) => void;
  arsMarketRate: number;
  onArsMarketRateChange: (value: number) => void;
  assetRate: number;
  onAssetRateChange: (value: number) => void;
  assetMarketRate: number;
  onAssetMarketRateChange: (value: number) => void;
  assetLabel: string;
  showSecondaryRates?: boolean;
  disabled?: boolean;
}

const twoDecimals = (value: number) =>
  Number.isFinite(value) ? Number(value).toFixed(2) : '';

export const ExchangeRatesSection: React.FC<Props> = ({
  arsRate,
  onArsRateChange,
  arsMarketRate,
  onArsMarketRateChange,
  assetRate,
  onAssetRateChange,
  assetMarketRate,
  onAssetMarketRateChange,
  assetLabel,
  showSecondaryRates = true,
  disabled = false,
}) => (
  <div id="exchange-rates" className="mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <span className="break-words leading-tight block">TC operacion USD a ARS</span>
        </label>
          <input
            type="number"
            step="0.01"
            value={twoDecimals(arsRate)}
            onChange={(event) => {
              const parsed = parseFloat(event.target.value.replace(',', '.'));
              onArsRateChange(Number.isFinite(parsed) ? parsed : 0);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <span className="break-words leading-tight block">TC mercado USD a ARS</span>
        </label>
          <input
            type="number"
            step="0.01"
            value={twoDecimals(arsMarketRate)}
            onChange={(event) => {
              const parsed = parseFloat(event.target.value.replace(',', '.'));
              onArsMarketRateChange(Number.isFinite(parsed) ? parsed : 0);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
    {showSecondaryRates && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="break-words leading-tight">TC operacion {assetLabel} a USD</span>
              <i
                className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help"
                title={`Doble cambio via USD - Como ${assetLabel} no es USD, se requiere puente USD. Se muestran las tasas: ${assetLabel} a USD y USD a ARS mercado.`}
              />
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            value={twoDecimals(assetRate)}
            onChange={(event) => {
              const parsed = parseFloat(event.target.value.replace(',', '.'));
              onAssetRateChange(Number.isFinite(parsed) ? parsed : 0);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="break-words leading-tight">TC mercado {assetLabel} a USD</span>
              <i
                className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help"
                title={`Doble cambio via USD - Como ${assetLabel} no es USD, se requiere puente USD. Se muestran las tasas: ${assetLabel} a USD y USD a ARS mercado.`}
              />
            </div>
          </label>
          <input
            type="number"
            step="0.01"
            value={twoDecimals(assetMarketRate)}
            onChange={(event) => {
              const parsed = parseFloat(event.target.value.replace(',', '.'));
              onAssetMarketRateChange(Number.isFinite(parsed) ? parsed : 0);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </div>
    )}
  </div>
);
