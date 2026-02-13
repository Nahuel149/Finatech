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

const resolveVisual = (fileName, mimeType) => {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const ext = path.extname(fileName || '').toLowerCase();

  if (normalizedMime.includes('pdf') || ext === '.pdf') {
    return { icon: 'fa-file-pdf', color: 'text-red-500' };
  }
  if (normalizedMime.includes('image') || ['.jpg', '.jpeg', '.png'].includes(ext)) {
    return { icon: 'fa-file-image', color: 'text-green-600' };
  }
  if (normalizedMime.includes('excel') || normalizedMime.includes('sheet') || ['.xls', '.xlsx'].includes(ext)) {
    return { icon: 'fa-file-excel', color: 'text-emerald-600' };
  }
  if (normalizedMime.includes('word') || ['.doc', '.docx'].includes(ext)) {
    return { icon: 'fa-file-word', color: 'text-blue-600' };
  }
  return { icon: 'fa-file', color: 'text-gray-600' };
};

const sanitizePrefix = (value) => String(value || 'operation').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'operation';

const storeLogisticsOperationAttachments = async (operationId, files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', 'logistics', 'operations');
  await ensureDir(uploadsDir);

  const now = Date.now();
  const prefix = sanitizePrefix(operationId);
  const stored = [];

  for (const file of files) {
    if (!file) continue;

    const originalName = sanitizeFileName(file.originalname || 'attachment.bin');
    const ext = path.extname(originalName);
    const generatedName = `operation-${prefix}-${now}-${Math.round(Math.random() * 1e6)}${ext || ''}`;
    const targetPath = path.join(uploadsDir, generatedName);
    const buffer = file.buffer || file.data || null;
    if (!buffer) {
      // eslint-disable-next-line no-continue
      continue;
    }

    await fs.promises.writeFile(targetPath, buffer);
    const visual = resolveVisual(originalName, file.mimetype);
    stored.push({
      name: originalName,
      size: formatFileSize(file.size || buffer.length),
      url: `/uploads/logistics/operations/${generatedName}`,
      icon: visual.icon,
      color: visual.color,
    });
  }

  return stored;
};

module.exports = {
  storeLogisticsOperationAttachments,
};

