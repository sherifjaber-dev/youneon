import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal-document";
import { TERMS_OF_SERVICE } from "@/lib/legal-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://youneonwtce7005.pinet.com";

export const metadata: Metadata = {
  title: "Terms of Service – YouNeon",
  description: "Terms of Service for using YouNeon, the Pi Network live video chat app.",
  alternates: { canonical: `${APP_URL}/terms` },
};

export default function TermsPage() {
  return <LegalDocumentView doc={TERMS_OF_SERVICE} />;
}
