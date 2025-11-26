export const normalizeShortcut = (value: string) =>
  value.trim().replace(/^@+/, "").toLowerCase();
