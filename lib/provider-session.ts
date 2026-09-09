import type { ProviderConfig } from "@/lib/buildwise";

const providerMetadata = new Map<string, ProviderConfig>();
const providerSecrets = new Map<string, string>();

export function readSessionProviderSettings(): ProviderConfig[] {
  return [...providerMetadata.values()].map((provider) => ({ ...provider, apiKey: "" }));
}

export function writeSessionProviderSettings(providers: ProviderConfig[]) {
  for (const provider of providers) {
    providerMetadata.set(provider.id, { ...provider, apiKey: "" });
  }
}

export function setSessionProviderSecret(providerId: string, apiKey: string) {
  if (apiKey) providerSecrets.set(providerId, apiKey);
  else providerSecrets.delete(providerId);
}

export function getSessionProviderSecret(providerId: string): string {
  return providerSecrets.get(providerId) ?? "";
}

export function getSessionProvider(providerId: string): ProviderConfig | null {
  const metadata = providerMetadata.get(providerId);
  if (!metadata) return null;
  return { ...metadata, apiKey: getSessionProviderSecret(providerId) };
}

export function clearSessionProvider(providerId: string) {
  providerMetadata.delete(providerId);
  providerSecrets.delete(providerId);
}

export function clearAllSessionProviderSettings() {
  providerMetadata.clear();
  providerSecrets.clear();
}
