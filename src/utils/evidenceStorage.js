const fs = require('fs');
const path = require('path');

const ensureDir = async (dirPath) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const sanitizeFileName = (fileName) =>
  fileName
    .normalize()
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(-120);

const storeEvidenceFiles = async (orderId, files = []) => {
  if (!Array.isArray(files) || !files.length) {
    return [];
  }
  const uploadsDir = path.join(process.cwd(), 'uploads', 'logistics');
  await ensureDir(uploadsDir);

  const now = Date.now();
  const stored = [];

  for (const file of files) {
    if (!file) {
      continue;
    }
    const originalName = file.originalname || 'evidence.bin';
    const safeName = sanitizeFileName(originalName);
    const ext = path.extname(safeName);
    const generatedName = `${orderId}-${now}-${Math.round(Math.random() * 1e6)}${ext || ''}`;
    const targetPath = path.join(uploadsDir, generatedName);
    const buffer = file.buffer || file.data || null;
    if (!buffer) {
      continue;
    }
    await fs.promises.writeFile(targetPath, buffer);
    stored.push({
      url: `/uploads/logistics/${generatedName}`,
      metadata: {
        fileName: safeName,
        mimeType: file.mimetype || 'application/octet-stream',
        size: file.size || buffer.length,
      },
    });
  }

  return stored;
};

module.exports = {
  storeEvidenceFiles,
};

