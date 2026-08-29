export const SAFETY_TIPS_SECTIONS = [
  {
    id: "badge",
    title: "Check the YouNeon Badge",
    body: `The YouNeon Badge is a small signal that someone has put real work into their profile and has not been reported recently. It fills as they add a photo, name, age (18+), bio, country, languages, and interests. After that they also need a little history on YouNeon — either an account that is at least a day old, or at least one video chat that lasted more than a few seconds — and no reports against them in the last two weeks.

Premium members can reach the badge faster because their profile completeness is treated as complete, but Premium is not a background check. A badge does not prove identity, age, or good intentions. Treat it as one extra glance, then use report and block if anything feels wrong.`,
  },
  {
    id: "skip-questions",
    title: "You do not have to answer uncomfortable questions",
    body: `You never owe a stranger your story. If someone asks for your number, socials, workplace, school, or anything that makes you tense, you can change the subject, stay silent, turn off your camera, or leave.

On a live match, Skip (the next-person control on the call bar) moves you to someone else. End (the red hang-up) leaves the call immediately. Both are meant to be instant. You do not need a reason, and you do not need to be polite to stay safe.`,
  },
  {
    id: "personal-info",
    title: "Never share personal information",
    body: `Keep your phone number, home or work address, social media handles, email, government IDs, and Pi wallet details off camera and out of chat. Do not hold documents up to the camera. Do not confirm where you live “just to prove you are real.”

If someone pushes for personal information, that is a warning sign. Skip or end, then report them. YouNeon cannot recover Pi, reverse a private transfer, or unsay something you showed on video.`,
  },
  {
    id: "report-block",
    title: "How to report and block",
    body: `During a video chat, tap the shield on the call screen to open Report. Choose the reason that matches YouNeon Community Guidelines — underage, sexual content, hate, violence or weapons, privacy, scams, drugs, recording, or other. You can add a short note. We attach a snippet of the in-call chat, gift events, the Daily room id, and a timestamp. We do not secretly record video or audio.

Block is available from the same flow, from the in-call profile overlay, and from Settings → Blocked Users. Blocking saves them on your account so they should not appear again in matching, Lounge, History, or Messages as far as YouNeon can enforce. After you block someone on a call, YouNeon ends or skips that call so you are not left on screen with them.`,
  },
  {
    id: "inside-app",
    title: "Keep conversations inside the app",
    body: `Stay on YouNeon until you independently trust someone. Moving to WhatsApp, Telegram, Instagram, or a “payment page” is how most scams leave the safety tools behind. In-app chat, gifts, and Pi payments (Neon packs and Premium) are the only money flows YouNeon actually operates.

Nobody from YouNeon will ask you to send Pi to a personal wallet, share a passphrase, or “verify” an account in a private chat. If they say they work here, they do not.`,
  },
  {
    id: "detected",
    title: "What happens when unsafe video is detected",
    body: `During a live call, YouNeon can run an on-device safety filter on the incoming video. If it looks like nudity, weapons, or drugs, the picture is blurred. You can Block and skip, or briefly tap See anyway (30 seconds). The check runs on your device. Frames are not uploaded to YouNeon for this filter, and it is not a hidden recording.

The filter is a help, not a guarantee. It can miss something or blur by mistake. You remain responsible for leaving a call that feels wrong. You can also report at any time with the shield. Reports are stored for review. Repeat reports can remove the YouNeon Badge from that profile. We may not reply to every report, but we keep the evidence you chose to send.`,
  },
  {
    id: "chat-pace",
    title: "Chat is paced until they reply",
    body: `After you unlock a chat, you can send up to three messages before the other person has to reply. That pause exists so people are not flooded. Video call from a private chat rings that person directly — it is not a random match. If they never reply, wait. Do not try to pull them onto another app to “continue.”`,
  },
  {
    id: "minors",
    title: "Protection of minors — 18+ only",
    body: `YouNeon is only for people who are 18 or older. You cannot save a profile age under 18. Matching and Lounge are gated if your age is missing or under 18.

If anyone looks underage, says they are under 18, or asks you to involve a minor: do not continue. End the call, report them with the underage reason, and block them. Do not ask for more photos “to check.” Leave.`,
  },
  {
    id: "authorities",
    title: "Contact local authorities if you feel threatened",
    body: `If you are in immediate danger, being extorted, stalked, or threatened with violence, contact your local emergency number and the police. YouNeon is a video chat app, not law enforcement. We cannot dispatch help or freeze a Pi wallet for you.

Save what you can from inside the app (a report with chat evidence) and then get to safety. If you believe a child is involved, contact local authorities as well as reporting in YouNeon.`,
  },
] as const;

export const COMMUNITY_GUIDELINES_SECTIONS = [
  {
    id: "age",
    title: "1. You must be 18 or older",
    body: `YouNeon is an adult product. Creating an account, matching, or using Lounge if you are under 18 is forbidden. Lying about your age is forbidden. If we learn that a user is a minor, we will block that account. If someone you meet appears to be under 18, report them and leave. Do not continue the conversation “to be sure.”`,
  },
  {
    id: "nudity",
    title: "2. No nudity, pornography or sexual content",
    body: `Do not show genitals, sexual acts, pornography, or masturbation on camera. Do not pressure anyone to undress, pose, or send sexual photos. “Just for a second” still counts. If the other person does not clearly want a sexual conversation, stop. YouNeon is for meeting people, not a porn studio. Our on-device filter may blur sexual video. Blur is not permission to keep going — leave and report.`,
  },
  {
    id: "minors-protect",
    title: "3. Strong protection of minors",
    body: `Any sexual content involving anyone who is or appears to be under 18 is strictly prohibited. Do not ask someone’s age in a predatory way, request photos of minors, or role-play as a child. Report suspected minors immediately. We will cooperate with lawful investigations. This is not negotiable.`,
  },
  {
    id: "weapons-drugs",
    title: "4. No weapons or drugs on camera",
    body: `Do not display firearms, knives used as a threat, or other weapons. Do not show, offer, or ask for illegal drugs. Do not use YouNeon to arrange drug deals. Our on-device filter may blur video that looks like weapons or drugs. If you see them, skip, block, and report.`,
  },
  {
    id: "hate",
    title: "5. No hate, insults, bullying, racism or threats",
    body: `Do not attack people for who they are. Racial slurs, homophobia, transphobia, sexism, religious hatred, and targeted bullying are not “jokes” here. Do not threaten to find someone, hurt them, or leak their information. Banter is fine when both people are clearly in on it. Cruelty is not.`,
  },
  {
    id: "violence",
    title: "6. No violence, self-harm or disturbing content",
    body: `Do not show real-world violence, graphic injury, or content that promotes self-harm or suicide. Do not dare someone to hurt themselves. If you are in crisis, contact local emergency services or a local crisis line — YouNeon is not a clinical service.`,
  },
  {
    id: "privacy",
    title: "7. Privacy — do not share personal information",
    body: `Do not demand phone numbers, home addresses, workplaces, schools, social accounts, or payment secrets. Do not show other people’s private information on camera. Doxxing, “exposure” threats, and posting someone’s face or chat off-app to shame them violates this rule. Keep conversations inside YouNeon until you trust the other person for reasons that have nothing to do with fear.`,
  },
  {
    id: "illegal",
    title: "8. No scams, spam, illegal activities or prostitution",
    body: `Do not run investment, romance, or “send Pi to unlock” scams. Do not impersonate YouNeon, Pi Network, or another user. Do not spam matching or flood chat. Do not offer or solicit prostitution or escorting on YouNeon. Gifts and Premium are optional in-app purchases — never a fee for safety. Chat is limited to three messages until the other person replies. Do not try to bypass that to harass anyone.`,
  },
  {
    id: "recording",
    title: "9. No recording or capturing without consent",
    body: `Do not record, screenshot, or live-stream someone without their clear consent. YouNeon does not secretly record calls. Reports may include a chat transcript snippet, gift events, a room id, and a time — not a hidden camera file. If you need to report someone, use the in-app shield. Publishing someone’s video without permission is a violation.`,
  },
  {
    id: "false-reports",
    title: "10. False reports are prohibited",
    body: `Report is a safety tool, not a weapon. Do not file fake reports to punish someone who skipped you, refused a gift, or would not share their number. Repeated false reports can cost you your YouNeon Badge and access. If you are unsure, skip or block without inventing a guidelines category.`,
  },
] as const;
