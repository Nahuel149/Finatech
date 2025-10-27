import React from 'react';

interface Props {
  arsRate: number;
  onArsRateChange: (value: number) => void;
  arsMarketRate: number;
  assetRate: number;
  onAssetRateChange: (value: number) => void;
  assetMarketRate: number;
  assetLabel: string;
  disabled?: boolean;
}

const numberToInputValue = (value: number) => (Number.isNaN(value) ? '' : value);

export const ExchangeRatesSection: React.FC<Props> = ({
  arsRate,
  onArsRateChange,
  arsMarketRate,
  assetRate,
  onAssetRateChange,
  assetMarketRate,
  assetLabel,
  disabled = false,
}) => (
  <div id="exchange-rates" className="mb-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC contra USD (ARS)
        </label>
        <input
          type="number"
          step="0.01"
          value={numberToInputValue(arsRate)}
          onChange={(event) => onArsRateChange(parseFloat(event.target.value) || 0)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC de mercado contra USD (ARS)
        </label>
        <input
          type="number"
          step="0.01"
          value={numberToInputValue(arsMarketRate)}
          readOnly
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none cursor-not-allowed"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC contra USD ({assetLabel})
        </label>
        <input
          type="number"
          step="0.00000001"
          value={numberToInputValue(assetRate)}
          onChange={(event) => onAssetRateChange(parseFloat(event.target.value) || 0)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          TC de mercado contra USD ({assetLabel})
        </label>
        <input
          type="number"
          step="0.00000001"
          value={numberToInputValue(assetMarketRate)}
          readOnly
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none cursor-not-allowed"
        />
      </div>
    </div>
  </div>
);
