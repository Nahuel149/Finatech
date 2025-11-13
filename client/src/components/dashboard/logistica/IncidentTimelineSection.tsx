import React from 'react';
import { 
  PlusCircleIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon 
} from '../../icons/HeroiconsOutline';
import { LogisticsIncidentHistoryEntry } from '../../../types';

interface IncidentTimelineSectionProps {
  history: LogisticsIncidentHistoryEntry[];
}

export const IncidentTimelineSection: React.FC<IncidentTimelineSectionProps> = ({ history }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimelineIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'created':
        return <PlusCircleIcon className={`${iconClass} text-blue-600`} />;
      case 'updated':
        return <PencilSquareIcon className={`${iconClass} text-yellow-600`} />;
      case 'in_review':
        return <ClockIcon className={`${iconClass} text-orange-500`} />;
      case 'comment':
        return <PencilSquareIcon className={`${iconClass} text-indigo-600`} />;
      case 'resolved':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'cancelled':
        return <XCircleIcon className={`${iconClass} text-red-600`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-blue-600';
      case 'updated':
        return 'bg-yellow-600';
      case 'in_review':
        return 'bg-orange-500';
      case 'comment':
        return 'bg-indigo-500';
      case 'resolved':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Historial de cambios</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {history.map((event, eventIdx) => (
            <li key={event.id || `${event.action}-${eventIdx}` }>
              <div className="relative pb-8">
                {eventIdx !== history.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${getTimelineColor(event.type)}`}>
                      {getTimelineIcon(event.type)}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.action}</p>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-500">{event.description}</p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <div>{formatDate(event.date)}</div>
                      <div className="mt-1 text-xs text-gray-400">por {event.user}</div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
