import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const genlayerStudioNet = defineChain({
  id: 61999,
  name: "GenLayer StudioNet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://genlayer-explorer.vercel.app" },
  },
});

export const CONTRACT_ADDRESS = "0x9CE0d2626753e4C7729C70feeB41eAaB8Ecc189b" as const;

export const wagmiConfig = getDefaultConfig({
  appName: "GenHire AI",
  projectId: "genhire-ai-resume-screening",
  chains: [genlayerStudioNet],
});
