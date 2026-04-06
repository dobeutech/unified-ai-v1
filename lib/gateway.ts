import { createGatewayProvider } from "@ai-sdk/gateway";

/** When `AI_GATEWAY_BASE_URL` is unset, the SDK uses its default gateway URL + OIDC/API key auth. */
export const gateway = createGatewayProvider({
  baseURL: process.env.AI_GATEWAY_BASE_URL,
});
