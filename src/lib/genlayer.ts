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
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: "FINALIZED",
    retries: 100,
    interval: 5000,
  });
  return receipt;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getScreening(client: any, screeningId: string) {
  // Retry a few times in case state isn't immediately available after finalization
  let lastError: any;
  for (let i = 0; i < 5; i++) {
    try {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_screening",
        args: [screeningId],
      });
      return normalizeResult(result);
    } catch (e) {
      lastError = e;
      console.warn(`get_screening attempt ${i + 1} failed, retrying...`, e);
      await sleep(3000);
    }
  }
  throw lastError;
}

function normalizeResult(raw: any) {
  // Map contract response fields to UI-expected fields
  if (raw && typeof raw === "object") {
    return {
      match_score: raw.score ?? raw.match_score ?? 0,
      verdict: raw.verdict ?? "Unknown",
      seniority: raw.seniority_estimate ?? raw.seniority ?? "Unknown",
      matched_skills: raw.matched_skills ?? [],
      missing_skills: raw.missing_skills ?? [],
      explanation: raw.explanation ?? raw.key_highlight ?? "",
    };
  }
  // If raw is a JSON string, parse it
  if (typeof raw === "string") {
    try {
      return normalizeResult(JSON.parse(raw));
    } catch {
      return { match_score: 0, verdict: "Unknown", seniority: "Unknown", matched_skills: [], missing_skills: [], explanation: raw };
    }
  }
  return raw;
}
