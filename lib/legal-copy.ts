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

const CONTACT = "Sherif.Jaber@icloud.com";
const APP_NAME = "YouNeon";

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy – YouNeon",
  lastUpdated: "August 29, 2026",
  intro:
    "YouNeon (“we”, “our”, or “us”) is a live video chat app for the Pi Network community, operated by Sherif Jaber. This Privacy Policy explains what we collect, why we collect it, who we share it with, and the rights you have. It applies when you sign in with Pi and use matching, Lounge, chat, gifts, Premium, or related features.",
  sections: [
    {
      heading: "1. Who is responsible",
      paragraphs: [
        `The data controller for YouNeon is Sherif Jaber. Privacy requests: ${CONTACT}. If we register a company office, the legal name and postal address will be added here. Pi Network, Google Firebase, Daily.co, and Vercel process some data on our instructions so the app can run.`,
      ],
    },
    {
      heading: "2. Information we collect",
      paragraphs: ["We collect only what we need to run a live social product and keep people safer."],
      bullets: [
        "Pi Network username and user ID when you sign in with Pi",
        "Profile you choose to give: name, age, gender, country, languages, bio, interests, and photos",
        "Account flags we store to run the product: Neon balance, Premium period, unlocks, blocked users, YouNeon Badge signals, and items you bought",
        "Activity inside the app: matches, call duration, follows, messages, stickers, gifts, reports, and (if you send one) a chat image",
        "Technical data needed to connect a call: device permissions for camera and microphone, and basic connection logs",
        "Optional privacy choices you set in Settings (analytics, advertising, marketing)",
      ],
    },
    {
      heading: "3. Information we do not collect as a recording",
      paragraphs: [
        "Live video and audio are carried by Daily.co so you can see and hear each other. We do not secretly record calls. We do not keep a video file of a normal chat.",
        "The on-device safety filter (nudity, weapons, drugs) looks at incoming video on your device to blur it. Those frames are not uploaded to YouNeon for that check. The filter can be wrong. It is a safeguard, not surveillance.",
      ],
    },
    {
      heading: "4. How we use your information",
      bullets: [
        "To create and manage your account after Pi sign-in",
        "To match you for random or direct video chat and to show Lounge, History, and Messages",
        "To send in-app chat, stickers, gifts, and notifications you choose to receive",
        "To process Pi payments for Neon packs and Premium, and to credit what you bought",
        "To enforce Community Guidelines, review reports, block users, and operate the YouNeon Badge",
        "To keep the service working (hosting, errors, abuse prevention)",
        "With your consent: optional analytics or advertising preferences you control in Settings",
      ],
    },
    {
      heading: "5. Legal bases (EEA / UK)",
      paragraphs: [
        "Where GDPR or UK GDPR applies, we use: (a) performance of our contract with you to run the app and payments; (b) legitimate interests for safety, fraud, and keeping the community usable; (c) consent where you turn on optional analytics, advertising, or marketing; (d) legal obligation when the law requires us to keep or disclose information.",
      ],
    },
    {
      heading: "6. Sharing",
      paragraphs: ["We do not sell your personal data. We share only what is needed:"],
      bullets: [
        "Pi Network — sign-in and Pi payments",
        "Google Firebase (Firestore) — profiles, chats, reports, and account state",
        "Daily.co — live video and audio rooms",
        "Vercel — hosting the app",
        "Authorities when required by law, or to protect a person from serious harm",
      ],
    },
    {
      heading: "7. Reports and safety evidence",
      paragraphs: [
        "If you tap Report, we store the reason you chose, an optional note, a short snippet of in-call chat, gift events, a Daily room id, and a time. We use that to review Community Guidelines. We do not attach a hidden video recording. False reports can lead to limits on your account.",
      ],
    },
    {
      heading: "8. International transfers",
      paragraphs: [
        "Some processors are in the United States (including Google, Daily.co, and Vercel). When we transfer personal data out of the EEA or UK, we rely on the processor’s appropriate safeguards (such as Standard Contractual Clauses) plus the fact that you asked us to provide a global live chat service.",
      ],
    },
    {
      heading: "9. How long we keep data",
      paragraphs: [
        "Account and profile data stay while your account is active. After you delete your account in Settings → Manage Account, we remove or anonymise personal profile data we control, except records we must keep for payments, disputes, or safety (for example a report about a minor). Chat images and messages are kept to deliver the conversation and may be removed when the thread is deleted or after a period of inactivity. Live video is not stored by us as a library of calls.",
      ],
    },
    {
      heading: "10. Security",
      paragraphs: [
        "Pi sign-in and Pi payments use Pi Network’s systems. Our servers keep payment API keys on the server, not in the app. Admin tools require a verified Pi account. We use HTTPS. No live internet service is perfectly secure. You can reduce risk by never showing documents or wallet secrets on camera, and by using Report and Block.",
      ],
    },
    {
      heading: "11. Children",
      paragraphs: [
        `YouNeon is only for people 18 years or older. We do not knowingly collect data from children. If we learn that a user is under 18, we will block the account and delete personal data we do not need to keep for a legal investigation. If you believe a minor is using YouNeon, report them in the app and email ${CONTACT}.`,
      ],
    },
    {
      heading: "12. Your rights",
      paragraphs: [
        `Depending on where you live (including the EEA, UK, and similar laws), you may ask to access, correct, delete, or export your personal data, or to object to or restrict certain processing. You may withdraw optional consent in Settings. To make a request, email ${CONTACT} from the Pi account you use. You may also complain to your local data protection authority. California residents can ask us not to “sell” or “share” personal information — we do not sell it.`,
      ],
    },
    {
      heading: "13. Cookies and similar technology",
      paragraphs: [
        "The app needs technical storage to keep you signed in and to remember settings. Optional analytics, advertising, and marketing are off unless you allow them in Settings. We do not use a third-party ad network to auction your video. Necessary storage cannot be turned off if you want to use YouNeon.",
      ],
    },
    {
      heading: "14. Changes",
      paragraphs: [
        "We may update this Privacy Policy. The new version will be posted on this page with a new “Last updated” date. Material changes may also be flagged in the app.",
      ],
    },
    {
      heading: "15. Contact",
      paragraphs: [`Privacy questions: ${CONTACT}`],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service – YouNeon",
  lastUpdated: "August 29, 2026",
  intro:
    "These Terms of Service are a contract between you and YouNeon, operated by Sherif Jaber. By signing in with Pi Network or using YouNeon, you agree to these Terms, our Community Guidelines, and our Privacy Policy. If you do not agree, do not use the app.",
  sections: [
    {
      heading: "1. Eligibility",
      paragraphs: [
        "You must be at least 18 years old. You confirm that the age on your profile is true. YouNeon is not for children. We may ask you to confirm your age and may remove accounts we believe belong to minors.",
      ],
    },
    {
      heading: "2. Account and Pi Network",
      paragraphs: [
        "You sign in with your own Pi Network account. You are responsible for that account and for what happens on YouNeon while you are signed in. Do not share your Pi passphrase or let someone else use your session. Pi Network’s own terms also apply to sign-in and Pi payments. YouNeon does not custody your Pi wallet.",
      ],
    },
    {
      heading: "3. The service",
      paragraphs: [
        "YouNeon offers random live video matching, direct video calls from chat, Lounge, History, Messages, stickers, gifts, Neon, and Premium. Features can change. We do not promise a particular person, a particular number of matches, or uninterrupted uptime.",
        "Chat from a private conversation rings that person. It is not a random match. After unlock, you may send up to three messages until the other person replies. That limit is a safety and anti-spam rule, not a defect.",
      ],
    },
    {
      heading: "4. Community Guidelines and safety tools",
      paragraphs: [
        "You must follow the Community Guidelines in the app. In short: 18+ only; no nudity or sexual content on camera; no weapons or illegal drugs; no hate, threats, scams, prostitution, or recording others without consent.",
        "We may blur incoming video on your device if it looks like nudity, weapons, or drugs. That filter is imperfect. You must still skip, end, block, or report. YouNeon is not law enforcement and does not guarantee that every call is safe.",
      ],
    },
    {
      heading: "5. What you must not do",
      bullets: [
        "Use YouNeon if you are under 18, or lie about your age",
        "Show nudity, sexual acts, weapons, or illegal drugs",
        "Harass, threaten, dox, or bully anyone",
        "Scam, spam, impersonate YouNeon or Pi Network, or ask for wallet secrets",
        "Record, screenshot, or stream another person without clear consent",
        "Try to break, scrape, or overload the app, or bypass chat and payment limits",
        "File false reports",
      ],
    },
    {
      heading: "6. Your content",
      paragraphs: [
        "You keep the rights in your photos, bio, and messages. You grant YouNeon a worldwide, non-exclusive licence to host and display that content inside the app so other users can see your profile and chats. You promise you have the right to post it, and that it does not break the law or these Terms. We may remove content that violates the Guidelines.",
      ],
    },
    {
      heading: "7. Virtual items and Pi payments",
      paragraphs: [
        "Neon, gifts, chat unlocks, and Premium are virtual items for use in YouNeon. They have no cash value outside the app. Payments are processed by Pi Network in Pi. Except where consumer law requires otherwise, virtual items are non-refundable once delivered.",
        "If you live in the EEA/UK, you may have a 14-day withdrawal right for digital content. By starting a paid feature immediately after payment (Premium or Neon credited to your account), you ask us to begin at once and you acknowledge you may lose that withdrawal right for that purchase. If a payment fails or is reversed by Pi, we may remove the items.",
      ],
    },
    {
      heading: "8. Reports, blocks, and enforcement",
      paragraphs: [
        "You can report and block from a call, a profile, and Settings. We may review reports, remove the YouNeon Badge, warn, suspend, or permanently ban accounts. We may keep limited report records to protect others. We do not have to give a detailed explanation where doing so would harm an investigation or another user.",
      ],
    },
    {
      heading: "9. Disclaimers",
      paragraphs: [
        "YouNeon is provided “as is”. Other users are strangers. We do not control what they say or show. We do not verify identity beyond Pi sign-in and the information you put on a profile. The safety filter, badge, and report tools reduce risk; they do not eliminate it. To the fullest extent allowed by law, we disclaim implied warranties of merchantability, fitness, and non-infringement.",
      ],
    },
    {
      heading: "10. Limitation of liability",
      paragraphs: [
        "Nothing in these Terms limits liability that cannot be limited under applicable law (including liability for death or personal injury caused by negligence, or for fraud). Apart from that, YouNeon and Sherif Jaber are not liable for lost Pi, lost virtual items, missed matches, or indirect, incidental, or consequential damages arising from the app. Our total liability for a claim is limited to the amount of Pi you paid to YouNeon in the 12 months before the claim, or EUR 50, whichever is greater.",
      ],
    },
    {
      heading: "11. Termination",
      paragraphs: [
        "You may stop using YouNeon and delete your account in Settings → Manage Account. We may suspend or ban accounts that break these Terms or the law. After termination, licences you granted end except that we may keep records required for payments, disputes, or safety.",
      ],
    },
    {
      heading: "12. Governing law",
      paragraphs: [
        "These Terms are governed by the laws of Denmark, without regard to conflict-of-law rules. If you are a consumer, mandatory protections of the country where you live still apply. Courts of Denmark have jurisdiction, except that consumers may also bring claims in their home courts where the law gives them that right.",
      ],
    },
    {
      heading: "13. Changes",
      paragraphs: [
        "We may update these Terms. The new version is posted on this page. If you continue to use YouNeon after the update, you accept the new Terms. If you do not, delete your account.",
      ],
    },
    {
      heading: "14. Contact",
      paragraphs: [`Questions about these Terms: ${CONTACT}`],
    },
  ],
};
