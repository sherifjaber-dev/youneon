export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy – YouNeon",
  lastUpdated: "August 25, 2026",
  intro:
    "YouNeon (“we”, “our”, or “us”) is a live random video chat application built for the Pi Network community. This Privacy Policy explains how we collect, use, and protect your information.",
  sections: [
    {
      heading: "1. Information We Collect",
      bullets: [
        "Pi Network username and user ID when you sign in with Pi",
        "Profile information you choose to provide (name, age, gender, country, photos, bio, interests)",
        "Usage data (matches, messages, gifts sent/received, reports)",
        "Device and technical information needed to run the service",
      ],
    },
    {
      heading: "2. How We Use Your Information",
      bullets: [
        "To create and manage your account",
        "To match you with other users for video chat",
        "To enable messaging, gifts, and in-app features",
        "To process Pi payments and subscriptions",
        "To improve safety, prevent abuse, and enforce our Community Guidelines",
        "To communicate important updates about the service",
      ],
    },
    {
      heading: "3. Sharing of Information",
      paragraphs: ["We do not sell your personal data. We may share limited information with:"],
      bullets: [
        "Pi Network (for authentication and payments)",
        "Service providers that help us operate the app (hosting, analytics, moderation)",
        "Authorities when required by law or to protect users",
      ],
    },
    {
      heading: "4. Video and Chat Content",
      paragraphs: [
        "Video calls are live and are not permanently stored by us under normal circumstances. When a user submits a report, limited evidence may be temporarily retained to review the report.",
      ],
    },
    {
      heading: "5. Data Retention",
      paragraphs: [
        "We keep your account data while your account is active. You can request deletion of your account at any time in Settings → Manage Account.",
      ],
    },
    {
      heading: "6. Security",
      paragraphs: [
        "We take reasonable measures to protect your data. However, no method of transmission over the internet is 100% secure.",
      ],
    },
    {
      heading: "7. Children’s Privacy",
      paragraphs: [
        "YouNeon is only for users 18 years and older. We do not knowingly collect data from anyone under 18.",
      ],
    },
    {
      heading: "8. Your Rights",
      paragraphs: [
        "Depending on your location you may have the right to access, correct, or delete your personal data. Contact us to make a request.",
      ],
    },
    {
      heading: "9. Changes",
      paragraphs: ["We may update this Privacy Policy. We will post the new version on this page."],
    },
    {
      heading: "10. Contact",
      paragraphs: ["For privacy questions: Sherif.Jaber@icloud.com"],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service – YouNeon",
  lastUpdated: "August 25, 2026",
  intro: "By using YouNeon you agree to these Terms of Service.",
  sections: [
    {
      heading: "1. Eligibility",
      paragraphs: [
        "You must be at least 18 years old to use YouNeon. By creating an account you confirm that you are 18 or older.",
      ],
    },
    {
      heading: "2. Account",
      paragraphs: [
        "You are responsible for your account and for all activity that happens under it. You must sign in only with your own Pi Network account.",
      ],
    },
    {
      heading: "3. Acceptable Use",
      paragraphs: ["You agree to follow our Community Guidelines. You must not:"],
      bullets: [
        "Share nudity, sexual content, or pornography",
        "Harass, threaten, or bully others",
        "Impersonate anyone",
        "Use the app for scams, spam, or illegal activity",
        "Record or share another user’s video or personal information without consent",
        "Attempt to harm minors or engage with anyone under 18",
      ],
    },
    {
      heading: "4. Video Chat and Messaging",
      paragraphs: [
        "YouNeon provides random and direct video chat and messaging. We do not control what other users say or do. You can skip, block, and report users at any time.",
      ],
    },
    {
      heading: "5. Virtual Items and Payments",
      paragraphs: [
        "Neon, gifts, unlocks, and Premium subscriptions are virtual items. All payments are processed through Pi Network. Virtual items have no real-world cash value and are non-refundable except where required by law.",
      ],
    },
    {
      heading: "6. Termination",
      paragraphs: [
        "We may suspend or permanently ban accounts that violate these Terms or our Community Guidelines.",
      ],
    },
    {
      heading: "7. Disclaimers",
      paragraphs: [
        "YouNeon is provided “as is”. We do not guarantee uninterrupted service or that every match will be positive.",
      ],
    },
    {
      heading: "8. Limitation of Liability",
      paragraphs: [
        "To the maximum extent allowed by law, YouNeon is not liable for any indirect or consequential damages arising from your use of the app.",
      ],
    },
    {
      heading: "9. Changes",
      paragraphs: ["We may update these Terms. Continued use of the app means you accept the updated Terms."],
    },
    {
      heading: "10. Contact",
      paragraphs: ["For questions about these Terms: Sherif.Jaber@icloud.com"],
    },
  ],
};
