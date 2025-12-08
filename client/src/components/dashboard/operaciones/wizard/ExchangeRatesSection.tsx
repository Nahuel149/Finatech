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
  disabled = false,
}) => (
  <div id="exchange-rates" className="mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC operacion USD->ARS
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
          TC mercado USD->ARS
        </label>
        <input
          type="number"
          step="0.01"
          value={numberToInputValue(arsMarketRate)}
          onChange={(event) => onArsMarketRateChange(parseFloat(event.target.value) || 0)}
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
            <div className="flex items-center">
              TC operacion {assetLabel}->USD
              <i
                className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help"
                title={`Doble cambio via USD - Como ${assetLabel} no es USD, se requiere puente USD. Se muestran las tasas: ${assetLabel}->USD y USD->ARS mercado.`}
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
              TC mercado {assetLabel}->USD
              <i
                className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help"
                title={`Doble cambio via USD - Como ${assetLabel} no es USD, se requiere puente USD. Se muestran las tasas: ${assetLabel}->USD y USD->ARS mercado.`}
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
