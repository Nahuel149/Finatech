import React, { useEffect, useRef, useState } from 'react';

export interface AssetOption {
  code: string;
  label: string;
}

interface Props {
  enterValue: string;
  exitValue: string;
  enterOptions: AssetOption[];
  exitOptions: AssetOption[];
  onEnterChange: (value: string) => void;
  onExitChange: (value: string) => void;
  enterLabel?: string;
  exitLabel?: string;
  disabled?: boolean;
}

export const AssetSelection: React.FC<Props> = ({
  enterValue,
  exitValue,
  enterOptions,
  exitOptions,
  onEnterChange,
  onExitChange,
  enterLabel = 'Cliente recibe',
  exitLabel = 'Cliente paga',
  disabled = false,
}) => {
  const [enterOpen, setEnterOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const enterRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (enterOpen && enterRef.current && !enterRef.current.contains(target)) {
        setEnterOpen(false);
      }
      if (exitOpen && exitRef.current && !exitRef.current.contains(target)) {
        setExitOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enterOpen, exitOpen]);

  const renderFlag = (code: string, extraClasses = '') => {
    const normalized = code.trim().toUpperCase();
    const map: Record<string, string> = {
      ARS: 'ar',
      USD: 'us',
      EUR: 'eu',
      BRL: 'br',
    };
    if (normalized === 'XAU') {
      return <span className={`w-5 h-5 rounded-sm bg-amber-300 border border-amber-400 ${extraClasses}`} />;
    }
    if (normalized === 'XME') {
      return <span className={`w-5 h-5 rounded-sm bg-gray-300 border border-gray-400 ${extraClasses}`} />;
    }
    const country = map[normalized] || normalized.slice(0, 2).toLowerCase();
    const url = `https://flagcdn.com/w40/${country}.png`;
    return (
      <img
        src={url}
        alt={normalized}
        className={`w-5 h-5 rounded-sm object-cover border border-gray-200 ${extraClasses}`}
        onError={(event) => {
          const target = event.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  };

  const EnterSelect: React.FC = () => {
    const selected = enterOptions.find((option) => option.code === enterValue) || enterOptions[0];
    return (
      <div className="relative" ref={enterRef}>
        <label className="block text-sm font-medium text-text-primary mb-2">{enterLabel}</label>
        <button
          type="button"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white flex items-center justify-between"
          disabled={disabled}
          onClick={() => setEnterOpen(!enterOpen)}
        >
          <span className="flex items-center gap-2">
            {selected && renderFlag(selected.code)}
            <span className="text-sm text-text-primary">{selected?.label || 'Seleccionar'}</span>
          </span>
          <i className={`fa-solid fa-chevron-${enterOpen ? 'up' : 'down'} text-gray-500 text-xs`} />
        </button>
        {enterOpen && (
          <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
            {enterOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  onEnterChange(option.code);
                  setEnterOpen(false);
                }}
              >
                {renderFlag(option.code)}
                <span className="text-text-primary">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ExitSelect: React.FC = () => {
    const selected = exitOptions.find((option) => option.code === exitValue) || exitOptions[0];
    return (
      <div className="relative" ref={exitRef}>
        <label className="block text-sm font-medium text-text-primary mb-2">{exitLabel}</label>
        <button
          type="button"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white flex items-center justify-between"
          disabled={disabled}
          onClick={() => setExitOpen(!exitOpen)}
        >
          <span className="flex items-center gap-2">
            {selected && renderFlag(selected.code)}
            <span className="text-sm text-text-primary">{selected?.label || 'Seleccionar'}</span>
          </span>
          <i className={`fa-solid fa-chevron-${exitOpen ? 'up' : 'down'} text-gray-500 text-xs`} />
        </button>
        {exitOpen && (
          <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
            {exitOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  onExitChange(option.code);
                  setExitOpen(false);
                }}
              >
                {renderFlag(option.code)}
                <span className="text-text-primary">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="asset-selection" className="mb-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EnterSelect />
        <ExitSelect />
      </div>
    </div>
  );
};
