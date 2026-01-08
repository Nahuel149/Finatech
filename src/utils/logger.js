const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const resolveLevel = () => {
  const envLevel = String(process.env.LOG_LEVEL || '').toLowerCase();
  if (LEVELS[envLevel]) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

let currentLevel = resolveLevel();

const shouldLog = (level) => LEVELS[level] >= LEVELS[currentLevel];

const formatMeta = (meta) => {
  if (!meta || typeof meta !== 'object' || Object.keys(meta).length === 0) {
    return '';
  }
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch (_error) {
    return '';
  }
};

const log = (level, message, meta) => {
  if (!shouldLog(level)) {
    return;
  }
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${formatMeta(meta)}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

const logger = {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  setLevel: (level) => {
    if (LEVELS[level]) {
      currentLevel = level;
    }
  },
};

module.exports = { logger };
