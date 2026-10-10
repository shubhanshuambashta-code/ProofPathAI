import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { CaseRecord } from "./types";

const filePath = path.join(process.cwd(), "data", "cases.json");
const redisHash = "proofpath:cases";

type RedisResponse = { result?: unknown; error?: string };

function redisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

function requiresRemoteStorage() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

async function redisCommand(args: string[]) {
  const credentials = redisCredentials();
  if (!credentials) {
    throw new Error("Case storage is not configured. Connect an Upstash Redis database to this Vercel project and redeploy.");
  }

  const response = await fetch(credentials.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const payload = (await response.json()) as RedisResponse;
  if (!response.ok || payload.error) {
    throw new Error("Could not access the case database. Check the Upstash Redis integration and environment variables.");
  }
  return payload.result;
}

async function readLocal(): Promise<CaseRecord[]> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as CaseRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocal(cases: CaseRecord[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp`;
  await writeFile(temp, JSON.stringify(cases, null, 2), "utf8");
  await rename(temp, filePath);
}

async function readRemoteRecords(): Promise<CaseRecord[]> {
  const result = await redisCommand(["HGETALL", redisHash]);
  if (!result) return [];

  const entries: [string, unknown][] = Array.isArray(result)
    ? Array.from({ length: Math.floor(result.length / 2) }, (_, index) => [
        String(result[index * 2]),
        result[index * 2 + 1],
      ])
    : Object.entries(result as Record<string, unknown>);

  return entries
    .map(([, value]) => typeof value === "string" ? JSON.parse(value) as CaseRecord : value as CaseRecord)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const store = {
  list: async () => {
    if (redisCredentials() || requiresRemoteStorage()) return readRemoteRecords();
    return (await readLocal()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get: async (id: string) => {
    if (redisCredentials() || requiresRemoteStorage()) {
      const result = await redisCommand(["HGET", redisHash, id]);
      return typeof result === "string" ? JSON.parse(result) as CaseRecord : null;
    }
    return (await readLocal()).find((record) => record.id === id) ?? null;
  },
  save: async (record: CaseRecord) => {
    if (redisCredentials() || requiresRemoteStorage()) {
      await redisCommand(["HSET", redisHash, record.id, JSON.stringify(record)]);
      return record;
    }
    const all = await readLocal();
    const index = all.findIndex((item) => item.id === record.id);
    if (index < 0) all.push(record);
    else all[index] = record;
    await writeLocal(all);
    return record;
  },
  delete: async (id: string) => {
    if (redisCredentials() || requiresRemoteStorage()) {
      await redisCommand(["HDEL", redisHash, id]);
      return;
    }
    const all = await readLocal();
    await writeLocal(all.filter((record) => record.id !== id));
  },
};

