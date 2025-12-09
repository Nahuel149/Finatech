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

const storeTreasuryAttachments = async (files = []) => {
  if (!Array.isArray(files) || !files.length) {
    return [];
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', 'treasury');
  await ensureDir(uploadsDir);

  const now = Date.now();
  const stored = [];

  for (const file of files) {
    if (!file) continue;
    const originalName = sanitizeFileName(file.originalname || 'attachment.bin');
    const ext = path.extname(originalName);
    const generatedName = `treasury-${now}-${Math.round(Math.random() * 1e6)}${ext || ''}`;
    const targetPath = path.join(uploadsDir, generatedName);
    const buffer = file.buffer || file.data || null;
    if (!buffer) {
      // eslint-disable-next-line no-continue
      continue;
    }

    await fs.promises.writeFile(targetPath, buffer);
    stored.push({
      url: `/uploads/treasury/${generatedName}`,
      name: originalName,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size || buffer.length,
    });
  }

  return stored;
};

module.exports = {
  storeTreasuryAttachments,
};
