const IS_DEV = process.env.NODE_ENV !== 'production';

export const devLog = (...args: unknown[]) => {
  if (!IS_DEV) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(...args);
};
