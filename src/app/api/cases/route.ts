import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { caseInputSchema } from "@/lib/schema";
import { processFiles } from "@/lib/documents";
import { extractImageText } from "@/lib/ai";
import { store } from "@/lib/store";
import { readJsonLimited } from "@/lib/requestBody";
import type { CaseRecord } from "@/lib/types";
export const runtime = "nodejs";
export async function GET() { try { return NextResponse.json(await store.list()); } catch { return NextResponse.json({ error: "Could not read local case storage." }, { status: 500 }); } }
export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") || 0); if (length > 70 * 1024 * 1024) return NextResponse.json({ error: "Request exceeds the 70 MB total upload limit." }, { status: 413 });
    const input = caseInputSchema.parse(await readJsonLimited(request, 70 * 1024 * 1024));
    const docs = await processFiles(input.files);
    const images = input.files.flatMap((f, i) => { const doc = docs[i]; return doc?.mimeType.startsWith("image/") ? [{ f, doc }] : []; });
    if (images.length && process.env.AI_API_KEY) {
      const extracted = await extractImageText(images.map(x => ({ id: x.doc.id, name: x.doc.filename, mime: x.doc.mimeType, base64: x.f.data })));
      for (const { doc } of images) { doc.text = extracted.get(doc.id) || ""; if (!doc.text.trim()) { doc.status = "failed"; doc.error = "No readable text was detected in this image."; } }
    } else for (const { doc } of images) { doc.status = "failed"; doc.error = "Image reading needs AI_API_KEY. The image was not retained; configure AI and upload it again."; }
    if (input.evidenceText.trim()) docs.unshift({ id: randomUUID(), filename: "Pasted evidence.txt", mimeType: "text/plain", status: "processed", text: input.evidenceText.trim(), createdAt: new Date().toISOString() });
    const now = new Date().toISOString();
    const record: CaseRecord = { id: randomUUID(), title: input.title, category: input.category, description: input.description, desiredOutcome: input.desiredOutcome, orderDetails: input.orderDetails, status: "draft", documents: docs, analysis: null, createdAt: now, updatedAt: now };
    await store.save(record); return NextResponse.json(record, { status: 201 });
  } catch (e) { const message = e instanceof Error ? e.message : "Could not create case."; const status = message.includes("total upload limit") ? 413 : e instanceof ZodError || e instanceof SyntaxError || message.includes("Unsupported") || message.includes("Upload") || message.includes("exceeds") || message.includes("file type") || message.includes("valid upload") || message.includes("corrupt") || message.includes("empty") ? 400 : 500; return NextResponse.json({ error: message }, { status }); }
}
