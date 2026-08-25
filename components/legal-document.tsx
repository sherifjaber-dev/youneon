import type { LegalDocument } from "@/lib/legal-copy";

const SUPPORT_EMAIL = "support@youneon.pi";

function withSupportLink(text: string) {
  const idx = text.indexOf(SUPPORT_EMAIL);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="font-medium text-yn-accent underline decoration-yn-accent/30 underline-offset-2"
      >
        {SUPPORT_EMAIL}
      </a>
      {text.slice(idx + SUPPORT_EMAIL.length)}
    </>
  );
}

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="text-yn-text">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">{doc.title}</h1>
      <p className="mt-2 text-[13px] text-yn-muted">Last updated: {doc.lastUpdated}</p>
      <p className="mt-6 text-[16px] leading-7">{doc.intro}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-9">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-[15px] leading-7 text-yn-text">
              {withSupportLink(paragraph)}
            </p>
          ))}
          {section.bullets?.length ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
