import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const IconBase: React.FC<IconProps> = ({ className, children, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const XMarkIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </IconBase>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M11.25 4.5a6.75 6.75 0 1 0 4.263 11.991l4.247 4.246" />
    <path d="m19.5 19.5-4.24-4.24" />
  </IconBase>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 6v6h4.5" />
    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </IconBase>
);

export const TruckIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2.25 7.5h11.25a1.5 1.5 0 0 1 1.5 1.5V17.25H2.25z" />
    <path d="M15 10.5h3.75L21 13.5v3.75h-3" />
    <path d="M7.5 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
  </IconBase>
);

export const ArrowsRightLeftIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M7.5 21 3 16.5 7.5 12" />
    <path d="M3 16.5h18" />
    <path d="M16.5 3 21 7.5 16.5 12" />
    <path d="M21 7.5H3" />
  </IconBase>
);

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m9 12 2.25 2.25L15 10.5" />
    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </IconBase>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 4.5 15.75 12 9 19.5" />
  </IconBase>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 4.5v15m7.5-7.5h-15" />
  </IconBase>
);

export const PlusCircleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 8.25v7.5" />
    <path d="M8.25 12h7.5" />
    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </IconBase>
);

export const FunnelIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 4.5h18L14.25 12v5.25l-4.5 2.25V12z" />
  </IconBase>
);

export const EllipsisVerticalIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" stroke="none" fill="currentColor" />
  </IconBase>
);

export const PencilIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M16.862 3.488a2.25 2.25 0 1 1 3.182 3.182L8.122 18.592l-4.12 1.03 1.03-4.12 11.83-11.83Z" />
    <path d="M15 5.25 18.75 9" />
  </IconBase>
);

export const PencilSquareIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M16.5 3.75H7.5A2.25 2.25 0 0 0 5.25 6v12A2.25 2.25 0 0 0 7.5 20.25h9a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 16.5 3.75Z" />
    <path d="m9 15.75 6-6" />
    <path d="M9 15.75h3.75V12" />
  </IconBase>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M4.5 12.75 9 17.25 19.5 6.75" />
  </IconBase>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M15 4.5 8.25 12 15 19.5" />
  </IconBase>
);

export const DocumentIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 3.75h6l4.5 4.5v11.25A1.5 1.5 0 0 1 18 21H9a1.5 1.5 0 0 1-1.5-1.5V5.25A1.5 1.5 0 0 1 9 3.75Z" />
    <path d="M15 3.75V9h5.25" />
  </IconBase>
);

export const UserIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M15.75 8.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
  </IconBase>
);

export const ArrowTopRightOnSquareIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M13.5 6H18a1.5 1.5 0 0 1 1.5 1.5v4.5" />
    <path d="m9 15 9-9" />
    <path d="M13.5 6v4.5" />
    <path d="M6 7.5v12A1.5 1.5 0 0 0 7.5 21h9" />
  </IconBase>
);

export const ArrowDownTrayIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3.75 19.5h16.5" />
    <path d="M5.25 9.75v-3A1.5 1.5 0 0 1 6.75 5.25h10.5a1.5 1.5 0 0 1 1.5 1.5v3" />
    <path d="M8.25 11.25 12 15l3.75-3.75" />
    <path d="M12 5.25v9.75" />
  </IconBase>
);

export const CloudArrowUpIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 16.5V9.75m0 0 3 3m-3-3-3 3" />
    <path d="M6.75 19.5a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.75 3.75 0 0 1 4.094 5.28 2.25 2.25 0 0 1-.659 4.281H6.75Z" />
  </IconBase>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M19.5 9 12 16.5 4.5 9" />
  </IconBase>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 9v3.75" />
    <path d="M12 15.75h.008v.008H12z" stroke="none" fill="currentColor" />
    <path d="M2.988 18.75h18.024a1.5 1.5 0 0 0 1.299-2.25L13.299 4.5a1.5 1.5 0 0 0-2.598 0L1.689 16.5a1.5 1.5 0 0 0 1.299 2.25Z" />
  </IconBase>
);

export const FireIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3c2.25 3 6 4.5 6 9a6 6 0 1 1-12 0c0-2.67 1.56-4.87 3.27-6.59" />
    <path d="M9.75 14.25c0 1.24 1.01 2.25 2.25 2.25s2.25-1.01 2.25-2.25c0-.93-.51-1.74-1.26-2.1" />
  </IconBase>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </IconBase>
);

export const CurrencyDollarIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3.75v16.5" />
    <path d="M15.75 7.5c0-2.07-1.79-3.75-3.75-3.75h-1.5c-1.96 0-3.75 1.68-3.75 3.75s1.79 3.75 3.75 3.75h1.5c1.96 0 3.75 1.68 3.75 3.75s-1.79 3.75-3.75 3.75h-1.5c-1.96 0-3.75-1.68-3.75-3.75" />
  </IconBase>
);

export const ShieldCheckIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3.75 4.5 6v6.75c0 4.284 3.214 7.955 7.5 8.25 4.286-.295 7.5-3.966 7.5-8.25V6L12 3.75Z" />
    <path d="m9 12 2.25 2.25L15 10.5" />
  </IconBase>
);

export const ShieldExclamationIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3.75 4.5 6v6.75c0 4.284 3.214 7.955 7.5 8.25 4.286-.295 7.5-3.966 7.5-8.25V6L12 3.75Z" />
    <path d="M12 8.25v4.5" />
    <path d="M12 15.75h.008v.008H12z" stroke="none" fill="currentColor" />
  </IconBase>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </IconBase>
);

export const DocumentTextIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 3.75h6l4.5 4.5v11.25A1.5 1.5 0 0 1 18 21H9a1.5 1.5 0 0 1-1.5-1.5V5.25A1.5 1.5 0 0 1 9 3.75Z" />
    <path d="M15 3.75V9h5.25" />
    <path d="M9.75 12.75h4.5" />
    <path d="M9.75 15.75h4.5" />
    <path d="M9.75 18.75H12" />
  </IconBase>
);

export const DocumentChartBarIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 3.75h6l4.5 4.5v11.25A1.5 1.5 0 0 1 18 21H9a1.5 1.5 0 0 1-1.5-1.5V5.25A1.5 1.5 0 0 1 9 3.75Z" />
    <path d="M15 3.75V9h5.25" />
    <path d="M10.5 18v-4.5" />
    <path d="M13.5 18v-6" />
    <path d="M16.5 18v-3" />
  </IconBase>
);

export const ClipboardDocumentListIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M8.25 7.5h9a1.5 1.5 0 0 1 1.5 1.5v9.75A1.5 1.5 0 0 1 17.25 21h-9A1.5 1.5 0 0 1 6.75 18.75V9a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="M13.5 4.5h1.125A1.125 1.125 0 0 1 15.75 5.625V7.5h-7.5V5.625A1.125 1.125 0 0 1 9.375 4.5H10.5" />
    <path d="M12 4.5h.008" />
    <path d="M9.75 12h4.5" />
    <path d="M9.75 15h4.5" />
  </IconBase>
);

export const ChartBarIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3.75 19.5h16.5" />
    <path d="M6 16.5V10.5" />
    <path d="M10.5 16.5V6" />
    <path d="M15 16.5v-6" />
    <path d="M19.5 16.5V8.25" />
  </IconBase>
);

export const CogIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M10.325 4.317a1.5 1.5 0 0 1 3.35 0l.213 1.278a1.5 1.5 0 0 0 1.115 1.183l1.239.31a1.5 1.5 0 0 1 .856 2.325l-.763 1.065a1.5 1.5 0 0 0 0 1.74l.763 1.065a1.5 1.5 0 0 1-.856 2.325l-1.239.31a1.5 1.5 0 0 0-1.115 1.183l-.213 1.278a1.5 1.5 0 0 1-3.35 0l-.213-1.278a1.5 1.5 0 0 0-1.115-1.183l-1.239-.31a1.5 1.5 0 0 1-.856-2.325l.763-1.065a1.5 1.5 0 0 0 0-1.74l-.763-1.065a1.5 1.5 0 0 1 .856-2.325l1.239-.31a1.5 1.5 0 0 0 1.115-1.183Z" />
    <path d="M12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
  </IconBase>
);

export const UserGroupIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 12.75A3.75 3.75 0 1 1 9 5.25a3.75 3.75 0 0 1 0 7.5Z" />
    <path d="M9 14.25c-3.97 0-7.5 2.02-7.5 4.5v.75h15v-.75c0-2.48-3.53-4.5-7.5-4.5Z" />
    <path d="M16.5 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
    <path d="M18.75 19.5h3v-.75c0-1.68-1.56-3.09-3.75-3.99" />
  </IconBase>
);

export const XCircleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9.75 9.75 14.25 14.25" />
    <path d="M14.25 9.75 9.75 14.25" />
    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </IconBase>
);
