import { afterEach, describe, expect, it } from "vitest";
import { processFiles } from "./documents";
describe("evidence ingestion",()=>{
  it("extracts pasted TXT file content",async()=>{const text="Order total: ₹2,499\nDelivered 5 October 2026";const data=Buffer.from(text).toString("base64");const docs=await processFiles([{name:"order.txt",type:"text/plain",data}]);expect(docs).toHaveLength(1);expect(docs[0].status).toBe("processed");expect(docs[0].text).toContain("₹2,499");});
  it("rejects an unsupported extension or MIME type",async()=>{await expect(processFiles([{name:"script.exe",type:"application/octet-stream",data:"YQ=="}])).rejects.toThrow("Unsupported file type");});
  it("rejects a corrupt PDF without crashing the application",async()=>{await expect(processFiles([{name:"broken.pdf",type:"application/pdf",data:Buffer.from("not a PDF").toString("base64")}])).rejects.toThrow("does not match its declared file type");});
  it("enforces the five-file limit",async()=>{const files=Array.from({length:6},(_,i)=>({name:`${i}.txt`,type:"text/plain",data:Buffer.from("text").toString("base64")}));await expect(processFiles(files)).rejects.toThrow("up to five files");});
  it("enforces the configured file-size limit",async()=>{process.env.MAX_UPLOAD_MB="0.00001";await expect(processFiles([{name:"large.txt",type:"text/plain",data:Buffer.from("This file is over the configured limit.").toString("base64")}])).rejects.toThrow("exceeds");});
});
afterEach(()=>{delete process.env.MAX_UPLOAD_MB;});
