import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
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
    value: 0n,
  });
  return hash;
}

export async function waitForReceipt(client: any, hash: string) {
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 100,
    interval: 5000,
    fullTransaction: true,
  });

  if (receipt?.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error("The audit was finalized, but contract execution failed. Check the GenLayer Explorer for details.");
  }

  return receipt;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function coerceScreeningId(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = coerceScreeningId(item);
      if (candidate) {
        return candidate;
      }
    }
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    for (const key of ["screening_id", "screeningId", "payload", "value"]) {
      const candidate = coerceScreeningId(obj[key]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

export function getScreeningIdFromReceipt(receipt: any) {
  const leaderReceipts = Array.isArray(receipt?.consensus_data?.leader_receipt)
    ? receipt.consensus_data.leader_receipt
    : receipt?.consensus_data?.leader_receipt
      ? [receipt.consensus_data.leader_receipt]
      : [];

  const candidates = [
    receipt?.screening_id,
    receipt?.screeningId,
    ...leaderReceipts.map((entry: any) => entry?.result?.payload),
    receipt?.result?.payload,
    receipt?.data?.result?.payload,
    typeof receipt?.value === "string" ? receipt.value : null,
  ];

  for (const candidate of candidates) {
    const screeningId = coerceScreeningId(candidate);
    if (screeningId) {
      return screeningId;
    }
  }

  throw new Error("Could not determine the screening ID from the finalized transaction receipt.");
}

export async function getScreening(client: any, screeningId: string) {
  let result: any = null;
  let retries = 3;

  while (retries > 0 && !result) {
    try {
      await sleep(1500);

      result = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_screening",
        args: [screeningId],
        transactionHashVariant: "latest-final",
      });

      if (result) {
        return normalizeResult(result);
      }
    } catch (e: any) {
      const message = typeof e?.message === "string" ? e.message.toLowerCase() : "";
      retries -= 1;

      if ((!message.includes("execution failed") && !message.includes("missing or invalid parameters")) || retries === 0) {
        throw e;
      }

      console.warn(`get_screening retry ${3 - retries}: finalized state not ready yet, retrying...`, e);
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
