import { ProviderSettings } from "@/components/providers/ProviderSettings";

export default function ProvidersPage() {
  return <ProviderSettings publicDemo={process.env.PUBLIC_DEMO === "true"} />;
}
