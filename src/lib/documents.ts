import { randomUUID } from "node:crypto";
import type { EvidenceDoc } from "./types";
const MAX_FILES = 5;
const ALLOWED = new Set(["application/pdf", "text/plain", "image/png", "image/jpeg", "image/webp"]);
export type IncomingFile = { name: string; type: string; data: string };
export async function processFiles(files: IncomingFile[]): Promise<EvidenceDoc[]> {
  if (files.length > MAX_FILES) throw new Error("Upload up to five files per case.");
  const max = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;
  const out: EvidenceDoc[] = [];
  for (const file of files) {
    const mime = file.type.toLowerCase();
    if (!ALLOWED.has(mime)) throw new Error(`Unsupported file type for ${file.name}. Use PDF, TXT, PNG, JPG, or WEBP.`);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.data) || file.data.length % 4 !== 0) throw new Error(`${file.name} is not a valid upload.`);
    const buffer = Buffer.from(file.data, "base64");
    if (!buffer.length || buffer.length > max) throw new Error(`${file.name} is empty or exceeds the ${process.env.MAX_UPLOAD_MB || 10} MB limit.`);
    const signatureOk = mime === "text/plain" || (mime === "application/pdf" && buffer.subarray(0, 5).toString("ascii") === "%PDF-") || (mime === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) || (mime === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) || (mime === "image/webp" && buffer.subarray(0,4).toString("ascii") === "RIFF" && buffer.subarray(8,12).toString("ascii") === "WEBP");
    if (!signatureOk) throw new Error(`${file.name} does not match its declared file type or is corrupt.`);
    const doc: EvidenceDoc = { id: randomUUID(), filename: file.name.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 180), mimeType: mime, status: "processed", text: "", createdAt: new Date().toISOString() };
    try {
      if (mime === "text/plain") doc.text = buffer.toString("utf8").slice(0, 30000);
      else if (mime === "application/pdf") {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        doc.text = result.text.slice(0, 30000);
        await parser.destroy();
        if (!doc.text.trim()) { doc.status = "failed"; doc.error = "No selectable text found. This scanned PDF needs to be supplied as an image or with OCR text."; }
      }
    } catch { doc.status = "failed"; doc.error = "This document could not be read. Try a text PDF, TXT file, or image."; }
    out.push(doc);
  }
  return out;
}
