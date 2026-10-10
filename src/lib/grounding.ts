import type { Analysis, CaseRecord, EvidenceDoc, Fact } from "./types";
export function validateGrounding(a: Analysis, docs: EvidenceDoc[]): Analysis {
  const byId = new Map(docs.map(d => [d.id, d]));
  const notes = [...a.validationNotes];
  const facts = a.facts.map((fact: Fact) => {
    if (fact.status !== "supported_by_source") return fact;
    const valid = fact.sourceReferences.filter(ref => {
      const doc = byId.get(ref.documentId);
      if (!doc || doc.status !== "processed" || !ref.excerpt.trim() || !doc.text.toLocaleLowerCase().includes(ref.excerpt.trim().toLocaleLowerCase())) return false;
      const excerptNumbers = new Set((ref.excerpt.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(n => n.replace(/,/g, "")));
      const claimNumbers = (fact.claim.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(n => n.replace(/,/g, ""));
      return claimNumbers.every(n => excerptNumbers.has(n));
    });
    if (valid.length) return { ...fact, sourceReferences: valid };
    notes.push(`Claim downgraded because its source excerpt could not be matched: ${fact.claim}`);
    return { ...fact, status: "unverified" as const, sourceReferences: [], notes: "Source excerpt could not be verified against extracted document text." };
  });
  const timeline = a.timeline.map(event => {
    const sourceReferences = event.sourceReferences.filter(ref => { const d=byId.get(ref.documentId); return !!d && !!ref.excerpt.trim() && d.text.toLowerCase().includes(ref.excerpt.trim().toLowerCase()); });
    return { ...event, sourceReferences, status: event.status === "supported_by_source" && !sourceReferences.length ? "unverified" as const : event.status };
  });
  const contradictions = a.contradictions.map(item => ({ ...item, claims: item.claims.map(claim => ({ ...claim, sourceReferences: claim.sourceReferences.filter(ref => { const d=byId.get(ref.documentId); return !!d && !!ref.excerpt.trim() && d.text.toLowerCase().includes(ref.excerpt.trim().toLowerCase()); }) })) }));
  const factIds = new Set(facts.map(fact => fact.id));
  const actions = a.actions.map(action => ({ ...action, supportingFactIds: action.supportingFactIds.filter(id => factIds.has(id)) }));
  return { ...a, facts, timeline, contradictions, actions, validationNotes: notes };
}
export function userReportedFacts(c: CaseRecord): Fact[] {
  return [{ id: "reported-problem", claim: c.description, factType: "user_report", status: "reported_by_user", sourceReferences: [], date: null, confidence: 1, notes: "Provided directly by the user; not independently verified." }, ...(c.orderDetails ? [{ id: "reported-order-details", claim: c.orderDetails, factType: "user_report", status: "reported_by_user" as const, sourceReferences: [], date: null, confidence: 1, notes: "Provided directly by the user; not independently verified." }] : [])];
}
