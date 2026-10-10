import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { analyzeCase } from "@/lib/ai";
export const runtime = "nodejs";
export async function POST(_: Request, context: { params: Promise<{ id:string }> }) { const {id}=await context.params; const record=await store.get(id); if(!record) return NextResponse.json({error:"Case not found."},{status:404}); record.analysis=null; record.status="draft"; record.updatedAt=new Date().toISOString(); await store.save(record); try { const analysis=await analyzeCase(record); record.analysis=analysis; record.status="analyzed"; record.updatedAt=new Date().toISOString(); await store.save(record); return NextResponse.json(record); } catch(e) { const message=e instanceof Error?e.message:"Analysis failed. Please retry."; return NextResponse.json({error:message},{status:message.includes("not configured")?503:502}); } }
