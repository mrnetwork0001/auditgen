import { createClient } from "@genlayer/js-client";
import { CONTRACT_ADDRESS } from "@/config/wagmi";

export function getGenLayerClient(account: `0x${string}`) {
  return createClient({
    endpoint: "https://studio.genlayer.com/api",
    chain: {
      id: 61999,
      name: "GenLayer StudioNet",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: {
        default: { http: ["https://studio.genlayer.com/api"] },
      },
    } as any,
    account,
  });
}

export async function submitScreening(
  client: any,
  args: {
    jobTitle: string;
    jobDescription: string;
    mustHaveSkills: string;
    resumeText: string;
    userWalletAddress: string;
  }
) {
  const tx = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "submit_screening",
    args: [
      args.jobTitle,
      args.jobDescription,
      args.mustHaveSkills,
      args.resumeText,
      args.userWalletAddress,
    ],
  });
  return tx;
}

export async function getScreening(client: any, userAddress: string) {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_screening",
    args: [userAddress],
  });
  return result;
}
