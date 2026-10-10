export async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is empty.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new Error("Request exceeds the 70 MB total upload limit."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
  return JSON.parse(data.toString("utf8")) as unknown;
}
