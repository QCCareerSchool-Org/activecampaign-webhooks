export const stringify = (rawJson: unknown): string => {
  return JSON.stringify(rawJson, (key, value: unknown) => {
    if (typeof value === 'bigint') {
      return String(value);
    }
    return value;
  });
};
