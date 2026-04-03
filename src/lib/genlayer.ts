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
  let result: any = null;
  let retries = 3;

  while (retries > 0 && !result) {
    try {
      await sleep(1000);

      result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_screening",
        args: [screeningId],
      });

      if (result) {
        return normalizeResult(result);
      }
    } catch (e: any) {
      const message = typeof e?.message === "string" ? e.message.toLowerCase() : "";
      retries -= 1;

      if (!message.includes("execution failed") || retries === 0) {
        throw e;
      }

      console.warn(`get_screening retry ${3 - retries}: state not yet ready, retrying...`, e);
      await sleep(2000);
    }
  }

  throw new Error("Failed to fetch screening results after multiple retries.");
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
