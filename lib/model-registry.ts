export const NVIDIA_BUILD_DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b" as const;
export const NVIDIA_BUILD_BASE_URL = "https://integrate.api.nvidia.com/v1" as const;
export const NVIDIA_BUILD_CHAT_ROUTE = "/chat/completions" as const;
export const NVIDIA_BUILD_CHAT_COMPLETIONS_URL = `${NVIDIA_BUILD_BASE_URL}${NVIDIA_BUILD_CHAT_ROUTE}` as const;
