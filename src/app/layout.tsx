import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";
export const metadata: Metadata = { title: "ProofPath AI — Evidence to action", description: "Turn confusing consumer complaints into evidence-backed action plans." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
