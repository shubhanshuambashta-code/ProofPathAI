import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { CaseRecord } from "./types";
const filePath = path.join(process.cwd(), "data", "cases.json");
async function readAll(): Promise<CaseRecord[]> { try { return JSON.parse(await readFile(filePath, "utf8")) as CaseRecord[]; } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return []; throw e; } }
async function writeAll(cases: CaseRecord[]) { await mkdir(path.dirname(filePath), { recursive: true }); const temp = `${filePath}.tmp`; await writeFile(temp, JSON.stringify(cases, null, 2), "utf8"); await rename(temp, filePath); }
export const store = {
  list: async () => (await readAll()).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)),
  get: async (id: string) => (await readAll()).find(c => c.id === id) ?? null,
  save: async (record: CaseRecord) => { const all = await readAll(); const i = all.findIndex(c => c.id === record.id); if (i < 0) all.push(record); else all[i] = record; await writeAll(all); return record; },
  delete: async (id: string) => { const all = await readAll(); await writeAll(all.filter(c => c.id !== id)); }
};
