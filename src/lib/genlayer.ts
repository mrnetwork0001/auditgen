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
  const hash = await client.writeContract({
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
  return hash;
}

export async function waitForReceipt(client: any, hash: string) {
  const receipt = await client.waitForTransactionReceipt({ hash });
  return receipt;
}

export async function getScreening(client: any, screeningId: string) {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_screening",
    args: [screeningId],
  });
  return result;
}
