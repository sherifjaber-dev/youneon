import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal-document";
import { PRIVACY_POLICY } from "@/lib/legal-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

export const metadata: Metadata = {
  title: "Privacy Policy – YouNeon",
  description:
    "How YouNeon collects, uses, and protects information for the Pi Network community.",
  alternates: { canonical: `${APP_URL}/privacy` },
};

export default function PrivacyPage() {
  return <LegalDocumentView doc={PRIVACY_POLICY} />;
}
