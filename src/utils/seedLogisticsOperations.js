const LogisticsOperation = require('../models/LogisticsOperation');
const { logger } = require('./logger');

const buildTimeline = (steps) =>
  steps.map((step) => ({
    label: step.label,
    status: step.status,
    timestamp: step.timestamp ? new Date(step.timestamp) : null,
    author: step.author || null,
  }));

const seedLogisticsOperations = async () => {
  // Only seed when explicitly requested to avoid injecting mock data in shared envs
  const shouldSeed = process.env.SEED_LOGISTICS === 'true';
  if (!shouldSeed) {
    return;
  }

  const existing = await LogisticsOperation.estimatedDocumentCount();
  if (existing > 0) {
    return;
  }

  const sampleOperations = [
    {
      operationCode: 'FT-LOG-000345',
      scheduledAt: new Date('2025-10-17T14:30:00-03:00'),
      type: 'Entrega',
      state: 'en-curso',
      contactName: 'María González',
      origin: 'Sede Central',
      destination: 'Sucursal Norte',
      routeDescription: 'Sede Central → Sucursal Norte',
      responsibleName: 'Juan Pérez',
      amount: { value: 5250, currency: 'USD' },
      attachments: [
        {
          name: 'comprobante_entrega.pdf',
          size: '245 KB',
          icon: 'fa-file-pdf',
          color: 'text-red-500',
        },
        {
          name: 'foto_mercaderia.jpg',
          size: '1.2 MB',
          icon: 'fa-image',
          color: 'text-blue-500',
        },
      ],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-17T14:30:00-03:00',
          status: 'completed',
          author: 'Juan Pérez',
        },
        {
          label: 'En tránsito',
          timestamp: '2025-10-17T15:15:00-03:00',
          status: 'current',
        },
        { label: 'Recibida', status: 'pending' },
        { label: 'Confirmada', status: 'pending' },
      ]),
    },
    {
      operationCode: 'FT-LOG-000346',
      scheduledAt: new Date('2025-10-17T13:15:00-03:00'),
      type: 'Transferencia',
      state: 'completado',
      contactName: 'Empresa ABC',
      origin: 'Bóveda A',
      destination: 'Bóveda B',
      routeDescription: 'Bóveda A → Bóveda B',
      responsibleName: 'Ana López',
      amount: { value: 850000, currency: 'ARS' },
      attachments: [
        {
          name: 'acta_transferencia.pdf',
          size: '320 KB',
          icon: 'fa-file-pdf',
          color: 'text-red-500',
        },
      ],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-17T12:30:00-03:00',
          status: 'completed',
          author: 'Ana López',
        },
        {
          label: 'Verificación de valores',
          timestamp: '2025-10-17T12:50:00-03:00',
          status: 'completed',
        },
        {
          label: 'Traslado en curso',
          timestamp: '2025-10-17T13:05:00-03:00',
          status: 'completed',
        },
        {
          label: 'Confirmada',
          timestamp: '2025-10-17T13:15:00-03:00',
          status: 'completed',
        },
      ]),
    },
    {
      operationCode: 'FT-LOG-000347',
      scheduledAt: new Date('2025-10-17T11:45:00-03:00'),
      type: 'Retiro',
      state: 'pendiente',
      contactName: 'Carlos Mendoza',
      origin: 'Sucursal Oeste',
      destination: 'Caja Tesorería',
      routeDescription: 'Sucursal Oeste',
      responsibleName: 'Luis García',
      amount: { value: 2100, currency: 'USD' },
      attachments: [],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-17T11:10:00-03:00',
          status: 'completed',
          author: 'Luis García',
        },
        {
          label: 'Preparación de retiro',
          timestamp: '2025-10-17T11:35:00-03:00',
          status: 'current',
        },
        { label: 'Listo para despacho', status: 'pending' },
        { label: 'Confirmada', status: 'pending' },
      ]),
    },
    {
      operationCode: 'FT-LOG-000348',
      scheduledAt: new Date('2025-10-17T10:20:00-03:00'),
      type: 'Custodia',
      state: 'en-curso',
      contactName: 'Proveedor XYZ',
      origin: 'Recepción Tesorería',
      destination: 'Bóveda Principal',
      routeDescription: 'Ingreso a Bóveda Principal',
      responsibleName: 'María Torres',
      amount: { value: 1200000, currency: 'ARS' },
      attachments: [
        {
          name: 'lista_valores.xlsx',
          size: '84 KB',
          icon: 'fa-file-excel',
          color: 'text-green-500',
        },
      ],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-17T09:50:00-03:00',
          status: 'completed',
          author: 'María Torres',
        },
        {
          label: 'Ingreso verificado',
          timestamp: '2025-10-17T10:05:00-03:00',
          status: 'current',
        },
        { label: 'Custodiado', status: 'pending' },
        { label: 'Confirmación contable', status: 'pending' },
      ]),
    },
    {
      operationCode: 'FT-LOG-000349',
      scheduledAt: new Date('2025-10-16T18:05:00-03:00'),
      type: 'Entrega',
      state: 'completado',
      contactName: 'Laura Fernández',
      origin: 'Sucursal Norte',
      destination: 'Cliente Final',
      routeDescription: 'Sucursal Norte → Cliente Final',
      responsibleName: 'Laura Fernández',
      amount: null,
      attachments: [
        {
          name: 'recibo_cliente.pdf',
          size: '112 KB',
          icon: 'fa-file-pdf',
          color: 'text-red-500',
        },
      ],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-16T16:40:00-03:00',
          status: 'completed',
          author: 'Laura Fernández',
        },
        {
          label: 'En tránsito',
          timestamp: '2025-10-16T17:10:00-03:00',
          status: 'completed',
        },
        {
          label: 'Recibida',
          timestamp: '2025-10-16T17:45:00-03:00',
          status: 'completed',
        },
        {
          label: 'Confirmada',
          timestamp: '2025-10-16T18:05:00-03:00',
          status: 'completed',
        },
      ]),
    },
    {
      operationCode: 'FT-LOG-000350',
      scheduledAt: new Date('2025-10-16T09:25:00-03:00'),
      type: 'Transferencia',
      state: 'anulado',
      contactName: 'Equipo Comercial',
      origin: 'Sede Central',
      destination: 'Oficina Comercial',
      routeDescription: 'Sede Central → Oficina Comercial',
      responsibleName: 'Juan Pérez',
      amount: { value: 350000, currency: 'ARS' },
      attachments: [],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-16T09:00:00-03:00',
          status: 'completed',
          author: 'Juan Pérez',
        },
        {
          label: 'Anulada',
          timestamp: '2025-10-16T09:25:00-03:00',
          status: 'completed',
        },
      ]),
    },
    {
      operationCode: 'FT-LOG-000351',
      scheduledAt: new Date('2025-10-15T15:45:00-03:00'),
      type: 'Retiro',
      state: 'en-curso',
      contactName: 'Banco Asociado',
      origin: 'Bóveda Principal',
      destination: 'Banco Asociado',
      routeDescription: 'Bóveda Principal → Banco Asociado',
      responsibleName: 'Ana López',
      amount: { value: 950000, currency: 'ARS' },
      attachments: [],
      timeline: buildTimeline([
        {
          label: 'Operación creada',
          timestamp: '2025-10-15T14:55:00-03:00',
          status: 'completed',
          author: 'Ana López',
        },
        {
          label: 'Valores preparados',
          timestamp: '2025-10-15T15:20:00-03:00',
          status: 'completed',
        },
        {
          label: 'Retiro en transporte',
          timestamp: '2025-10-15T15:45:00-03:00',
          status: 'current',
        },
        { label: 'Recibido por banco', status: 'pending' },
      ]),
    },
    {
      operationCode: 'FT-LOG-000352',
      scheduledAt: new Date('2025-10-14T12:05:00-03:00'),
      type: 'Custodia',
      state: 'pendiente',
      contactName: 'Área Legal',
      origin: 'Área Legal',
      destination: 'Bóveda Documental',
      routeDescription: 'Documentos legales en bóveda',
      responsibleName: 'Laura Fernández',
      amount: null,
      attachments: [],
      timeline: buildTimeline([
        {
          label: 'Solicitud registrada',
          timestamp: '2025-10-14T11:35:00-03:00',
          status: 'completed',
          author: 'Laura Fernández',
        },
        {
          label: 'Documentación en revisión',
          status: 'current',
        },
        { label: 'Ingreso a bóveda', status: 'pending' },
        { label: 'Confirmada', status: 'pending' },
      ]),
    },
  ];

  await LogisticsOperation.insertMany(sampleOperations);
  logger.info('logistics_seeded');
};

module.exports = { seedLogisticsOperations };
