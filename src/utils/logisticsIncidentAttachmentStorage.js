const fs = require('fs');
const path = require('path');

const ensureDir = async (dirPath) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const sanitizeFileName = (fileName = 'attachment.bin') =>
  fileName
    .normalize()
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(-120);

const formatFileSize = (bytes) => {
  const safe = Number(bytes);
  if (!Number.isFinite(safe) || safe <= 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(safe) / Math.log(k));
  return `${parseFloat((safe / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const resolveDocumentType = (fileName, mimeType) => {
  const ext = path.extname(fileName || '').replace('.', '').trim().toLowerCase();
  if (ext) {
    return ext;
  }
  const normalizedMime = String(mimeType || '').toLowerCase();
  if (normalizedMime.includes('pdf')) return 'pdf';
  if (normalizedMime.includes('image')) return 'img';
  if (normalizedMime.includes('excel') || normalizedMime.includes('sheet')) return 'xls';
  if (normalizedMime.includes('word')) return 'doc';
  return 'documento';
};

const sanitizePrefix = (value) => String(value || 'incident').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'incident';

const storeLogisticsIncidentAttachments = async (movementId, files = [], uploadedBy = null) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', 'logistics', 'incidents');
  await ensureDir(uploadsDir);

  const now = Date.now();
  const prefix = sanitizePrefix(movementId);
  const stored = [];

  for (const file of files) {
    if (!file) continue;

    const originalName = sanitizeFileName(file.originalname || 'attachment.bin');
    const ext = path.extname(originalName);
    const generatedName = `incident-${prefix}-${now}-${Math.round(Math.random() * 1e6)}${ext || ''}`;
    const targetPath = path.join(uploadsDir, generatedName);
    const buffer = file.buffer || file.data || null;
    if (!buffer) {
      // eslint-disable-next-line no-continue
      continue;
    }

    await fs.promises.writeFile(targetPath, buffer);
    stored.push({
      name: originalName,
      type: resolveDocumentType(originalName, file.mimetype),
      size: formatFileSize(file.size || buffer.length),
      url: `/uploads/logistics/incidents/${generatedName}`,
      uploadedBy: uploadedBy ? String(uploadedBy).trim() : null,
    });
  }

  return stored;
};

module.exports = {
  storeLogisticsIncidentAttachments,
};

