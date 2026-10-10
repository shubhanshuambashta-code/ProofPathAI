export const categories = [
  "Damaged or defective product", "Incorrect or missing delivery", "Refund or cancellation dispute",
  "Billing or duplicate-charge issue", "Warranty or repair dispute", "Other consumer issue",
] as const;
export type Category = typeof categories[number];
export type SourceRef = { documentId: string; excerpt: string };
export type Fact = { id: string; claim: string; factType: string; status: "supported_by_source" | "reported_by_user" | "unverified" | "contradicted"; sourceReferences: SourceRef[]; date: string | null; confidence: number; notes: string | null };
export type TimelineEvent = { id: string; description: string; date: string | null; datePrecision: string; sourceReferences: SourceRef[]; status: Fact["status"] };
export type Contradiction = { id: string; claims: { claim: string; sourceReferences: SourceRef[] }[]; explanation: string; clarification: string };
export type Gap = { missingInformation: string; whyItMatters: string; essential: boolean; action: string };
export type Action = { title: string; explanation: string; supportingFactIds: string[]; prerequisites: string[]; priority: "high" | "medium" | "low"; verification: string };
export type Analysis = { summary: string; facts: Fact[]; timeline: TimelineEvent[]; contradictions: Contradiction[]; gaps: Gap[]; actions: Action[]; complaint: string; analyzedAt: string; validationNotes: string[] };
export type EvidenceDoc = { id: string; filename: string; mimeType: string; status: "processed" | "failed"; text: string; createdAt: string; error?: string };
export type CaseRecord = { id: string; title: string; category: Category; description: string; desiredOutcome: string; orderDetails: string; status: "draft" | "analyzed"; documents: EvidenceDoc[]; analysis: Analysis | null; createdAt: string; updatedAt: string };
