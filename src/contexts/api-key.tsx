import { createContext, useContext } from 'react';

type ApiKeyContextType = {
  apiKey: string;
  setApiKey: (key: string) => void;
  apiKeyError: boolean;
  setApiKeyError: (error: boolean) => void;
};

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(
  undefined,
);

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
