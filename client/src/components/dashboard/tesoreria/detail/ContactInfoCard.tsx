import React from 'react';
import { ClientSummary } from '../../../../types';

interface ContactInfoCardProps {
  contact: {
    name?: string | null;
    type?: string | null;
    status?: string | null;
  };
  clientDetail: ClientSummary | null;
  onViewAccount: () => void;
}

const contactTypeLabel = (type?: string | null) => {
  if (!type) return 'Contacto';
  return type === 'provider' ? 'Proveedor' : 'Cliente';
};

export const ContactInfoCard: React.FC<ContactInfoCardProps> = ({
  contact,
  clientDetail,
  onViewAccount,
}) => {
  const displayName = contact.name || clientDetail?.fullName || clientDetail?.shortName || '—';
  const cuit = clientDetail?.cuit || '—';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h4 className="text-lg font-semibold text-text-primary mb-4">Contacto asociado</h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Nombre</div>
            <div className="font-medium text-text-primary">{displayName}</div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {contactTypeLabel(contact.type || clientDetail?.contactType)}
          </span>
        </div>

        <div>
          <div className="text-sm text-gray-600">CUIT</div>
          <div className="text-sm font-mono text-text-primary">{cuit}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Saldo actual</div>
          <div className="text-lg font-semibold positive-amount">—</div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <button
            type="button"
            className="text-primary hover:text-blue-700 text-sm font-medium"
            onClick={onViewAccount}
          >
            <i className="fa-solid fa-external-link-alt mr-1" />
            Ver cuenta corriente
          </button>
        </div>
      </div>
    </div>
  );
};
