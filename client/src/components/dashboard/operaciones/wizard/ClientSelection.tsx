import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClientSummary } from '../../../../types';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';

interface Props {
  value: string;
  onChange: (value: string) => void;
  selectedClient?: ClientSummary | null;
  clients: ClientSummary[];
  onNewClient: () => void;
  onEditClient?: (clientId: string) => void;
  marginInfo?: string;
  loading?: boolean;
  error?: string | null;
  onSearch?: (term: string) => void;
}

const renderOptionLabel = (client: ClientSummary) => {
  const cuit = client.cuit ? ` - CUIT: ${client.cuit}` : '';
  return `${client.fullName}${cuit}`;
};

export const ClientSelection: React.FC<Props> = ({
  value,
  onChange,
  clients,
  onNewClient,
  onEditClient,
  marginInfo,
  loading = false,
  error = null,
  onSearch,
  selectedClient: selectedClientProp = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [lastMarginDisplay, setLastMarginDisplay] = useState<string | null>(null);
  const [persistedSelection, setPersistedSelection] = useState<ClientSummary | null>(null);

  const selectedClient = useMemo(() => {
    const fromList = clients.find((client) => client.id === value);
    if (fromList) {
      return fromList;
    }
    if (selectedClientProp && selectedClientProp.id === value) {
      return selectedClientProp;
    }
    if (persistedSelection && persistedSelection.id === value) {
      return persistedSelection;
    }
    return null;
  }, [clients, value, selectedClientProp, persistedSelection]);

  const displayedClients = useMemo(() => {
    if (selectedClient && !clients.some((client) => client.id === selectedClient.id)) {
      return [selectedClient, ...clients];
    }
    return clients;
  }, [clients, selectedClient]);

  useEffect(() => {
    if (!value) {
      setPersistedSelection(null);
      return;
    }
    if (selectedClient) {
      setPersistedSelection(selectedClient);
    }
  }, [selectedClient, value]);

  useEffect(() => {
    if (!value) {
      setSearchTerm('');
    }
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    if (selectedClient && !dropdownOpen) {
      setSearchTerm(renderOptionLabel(selectedClient));
    }
  }, [selectedClient, dropdownOpen]);

  useEffect(() => {
    if (!onSearch) {
      return;
    }
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      onSearch(searchTerm.trim());
    }, 250);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, onSearch]);

  useEffect(() => {
    if (!dropdownOpen) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= displayedClients.length) {
      setActiveIndex(displayedClients.length > 0 ? 0 : -1);
    }
  }, [dropdownOpen, displayedClients.length, activeIndex]);

  useEffect(() => {
    if (!dropdownOpen || activeIndex < 0 || !listRef.current) {
      return;
    }
    const item = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (item) {
      const parent = listRef.current;
      const { offsetTop, offsetHeight } = item;
      const { scrollTop, clientHeight } = parent;
      if (offsetTop < scrollTop) {
        parent.scrollTop = offsetTop;
      } else if (offsetTop + offsetHeight > scrollTop + clientHeight) {
        parent.scrollTop = offsetTop + offsetHeight - clientHeight;
      }
    }
  }, [activeIndex, dropdownOpen, displayedClients.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (!dropdownOpen) {
      setDropdownOpen(true);
    }
  };

  const handleSelectClient = (client: ClientSummary) => {
    onChange(client.id);
    setSearchTerm(renderOptionLabel(client));
    setDropdownOpen(false);
    setActiveIndex(-1);
  };

  const handleBlur = () => {
    window.setTimeout(() => setDropdownOpen(false), 150);
  };

  useEffect(() => {
    if (selectedClient && marginInfo) {
      setLastMarginDisplay(marginInfo);
    }
    if (!selectedClient) {
      setLastMarginDisplay(null);
    }
  }, [selectedClient, marginInfo]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDropdownOpen(true);
      setActiveIndex((prev) => {
        const next = prev < clients.length - 1 ? prev + 1 : clients.length - 1;
        return next < 0 && clients.length > 0 ? 0 : next;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDropdownOpen(true);
      setActiveIndex((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
      return;
    }

    if (event.key === 'Enter' && dropdownOpen && activeIndex >= 0 && activeIndex < displayedClients.length) {
      event.preventDefault();
      handleSelectClient(displayedClients[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
  <div id="client-selection" className="mb-0">
    <label className="block text-sm font-medium text-text-primary mb-2">Cliente</label>
    <div className="flex flex-row flex-wrap items-stretch gap-2 sm:gap-3">
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setDropdownOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-4 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors truncate"
            placeholder="Buscar por nombre o CUIT"
            autoComplete="off"
          />
          {loading && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <LoadingSpinner size="sm" color="gray" />
            </div>
          )}
          {!loading && searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onChange('');
                setDropdownOpen(true);
              }}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 px-2 bg-white rounded-md"
              aria-label="Limpiar cliente seleccionado"
            >
              <i className="fa-solid fa-times" />
            </button>
          )}
          {dropdownOpen && (
            <div
              ref={listRef}
              className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {loading && (
                <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                  <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                  Buscando clientes…
                </div>
              )}
              {!loading && displayedClients.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No encontramos clientes con ese criterio.
                </div>
              )}
              {!loading &&
                displayedClients.map((client, index) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    data-index={index}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      index === activeIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="font-medium text-text-primary">
                      {client.fullName}
                    </div>
                    {client.cuit && (
                      <div className="text-xs text-gray-500">{client.cuit}</div>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-row sm:gap-2 sm:justify-start">
        <button
          type="button"
          onClick={onNewClient}
          className="px-4 py-3 bg-white border border-primary text-primary rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center w-full sm:w-auto"
        >
          <i className="fa-solid fa-plus mr-2" />
          Nuevo cliente
        </button>
        {onEditClient && (
          <button
            type="button"
            onClick={() => value && onEditClient(value)}
            disabled={!value}
            className="px-3 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            title={value ? 'Editar cliente seleccionado' : 'Selecciona un cliente para editar'}
          >
            <i className="fa-solid fa-pen" />
          </button>
        )}
      </div>
    </div>
    {error && (
      <div className="mt-2 text-sm text-danger flex items-center">
        <i className="fa-solid fa-circle-exclamation mr-2" />
        {error}
      </div>
    )}
    {marginInfo && lastMarginDisplay && !error && selectedClient && (
      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-800 text-xs font-medium px-3 py-1 border border-blue-100">
        <i className="fa-solid fa-chart-line text-[11px]" />
        <span>Último margen con este cliente: {lastMarginDisplay}</span>
      </div>
    )}
  </div>
  );
};
