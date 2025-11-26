export type SearchEngineDTO = {
  id: number;
  shortcut: string;
  displayName: string;
  description: string | null;
  urlTemplate: string;
  isDefault: boolean;
};

export type SearchEnginePayload = {
  shortcut: string;
  displayName: string;
  description?: string | null;
  urlTemplate: string;
  isDefault?: boolean;
};
