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

const numberToInputValue = (value: number) => (Number.isNaN(value) ? '' : value);

export const ExchangeRatesSection: React.FC<Props> = ({
  arsRate,
  onArsRateChange,
  arsMarketRate,
  onArsMarketRateChange,
  assetRate,
  onAssetRateChange,
  assetMarketRate,
  assetLabel,
  showSecondaryRates = true,
  canEditMarketRate = false,
  useCustomMarketRate = false,
  onToggleMarketRateMode,
  disabled = false,
}) => (
  <div id="exchange-rates" className="mb-6">
    {canEditMarketRate && (
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Tasa de mercado</p>
          <p className="text-xs text-gray-600">
            {useCustomMarketRate
              ? 'Ingresá una tasa personalizada para esta operación.'
              : 'Usar tasa de mercado vigente registrada por Tesorería.'}
          </p>
        </div>
        <label className="inline-flex items-center space-x-2">
          <span className="text-xs text-gray-600">Usar tasa personalizada</span>
          <input
            type="checkbox"
            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            checked={useCustomMarketRate}
            onChange={(event) => onToggleMarketRateMode?.(event.target.checked)}
            autoComplete="off"
          />
        </label>
      </div>
    )}
    


    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC operación USD→ARS
        </label>
        <input
          type="number"
          step="0.01"
          value={numberToInputValue(arsRate)}
          onChange={(event) => onArsRateChange(parseFloat(event.target.value) || 0)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC mercado USD→ARS
        </label>
        <input
          type="number"
          step="0.01"
          value={numberToInputValue(arsMarketRate)}
          onChange={(event) => onArsMarketRateChange(parseFloat(event.target.value) || 0)}
          readOnly={!canEditMarketRate || !useCustomMarketRate}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
            canEditMarketRate && useCustomMarketRate
              ? 'border-gray-300'
              : 'border-gray-300 bg-gray-50 cursor-not-allowed'
          }`}
          disabled={disabled || (!canEditMarketRate && !useCustomMarketRate)}
          autoComplete="off"
        />
      </div>
    </div>
    {showSecondaryRates && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <div className="flex items-center">
              TC operación {assetLabel}→USD
              <i 
                className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help" 
                title={`Doble cambio vía USD - Como ${assetLabel} ≠ USD, se requiere puente USD. Se muestran las tasas: ${assetLabel}→USD y USD→ARS mercado.`}
              />
            </div>
          </label>
          <input
            type="number"
            step="0.00000001"
            value={numberToInputValue(assetRate)}
            onChange={(event) => onAssetRateChange(parseFloat(event.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <div className="flex items-center">
              TC mercado {assetLabel}→USD
              <i 
                 className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help" 
                 title={`Doble cambio vía USD - Como ${assetLabel} ≠ USD, se requiere puente USD. Se muestran las tasas: ${assetLabel}→USD y USD→ARS mercado.`}
               />
            </div>
          </label>
          <input
            type="number"
            step="0.00000001"
            value={numberToInputValue(assetMarketRate)}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none cursor-not-allowed"
            autoComplete="off"
          />
        </div>
      </div>
    )}
  </div>
);
