import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "@/config/wagmi";

export function getGenLayerClient(account: `0x${string}`) {
  return createClient({
    chain: studionet,
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
