/**
 * Seeds the global content-template library (workspaceId = null rows).
 *
 * Usage: cd packages/db && npx tsx prisma/seed-templates.ts
 * Requires DATABASE_URL (reads .env via prisma client convention).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEMPLATES: {
  name: string;
  category: string;
  description: string;
  content: string;
  platforms: string[];
}[] = [
  {
    name: "Product Launch Announcement",
    category: "announcement",
    description: "Announce a new product or major feature with excitement and a clear CTA.",
    content: `🚀 It's here! Introducing {{product}} — built to help you {{benefit}}.\n\nAfter months of building, we're thrilled to finally share it with you.\n\n✨ {{keyFeature1}}\n✨ {{keyFeature2}}\n✨ {{keyFeature3}}\n\nTry it today → {{link}}\n\n#launch #productlaunch #buildinpublic`,
    platforms: ["twitter", "linkedin", "instagram"],
  },
  {
    name: "Behind-the-Scenes Build Log",
    category: "engagement",
    description: "Authentic build-in-public update that humanizes the brand.",
    content: `Behind the scenes: here's what we shipped this week 👇\n\n{{update1}}\n{{update2}}\n{{update3}}\n\nWhat should we tackle next? Tell us below 👇\n\n#buildinpublic #startup`,
    platforms: ["twitter", "linkedin"],
  },
  {
    name: "Customer Success Story",
    category: "promo",
    description: "Social-proof post built around a customer outcome.",
    content: `"{{customerQuote}}" — {{customerName}}, {{customerRole}}\n\nWhen {{customerName}} came to us, they struggled with {{painPoint}}. Today: {{outcome}}.\n\nReal results from real teams. Read the full story → {{link}}`,
    platforms: ["linkedin", "twitter"],
  },
  {
    name: "Weekly Tips Thread",
    category: "engagement",
    description: "Numbered tips thread that drives saves and shares.",
    content: `{{n}} lessons from {{domain}} we wish we knew earlier:\n\n1. {{tip1}}\n2. {{tip2}}\n3. {{tip3}}\n4. {{tip4}}\n5. {{tip5}}\n\nBookmark this for later 🔖`,
    platforms: ["twitter"],
  },
  {
    name: "Limited-Time Offer",
    category: "promo",
    description: "Urgency-driven promo with a clear deadline and code.",
    content: `⏰ 48 hours only: {{offer}}\n\nEverything in {{productName}} — {{discount}} off with code {{code}} at checkout.\n\nEnds {{deadline}}. Don't sleep on it → {{link}}`,
    platforms: ["instagram", "twitter"],
  },
  {
    name: "Milestone Celebration",
    category: "announcement",
    description: "Celebrate a growth milestone and thank the community.",
    content: `{{milestone}} 🎉\n\nWe couldn't have done it without this community. Every share, comment, and piece of feedback shaped what {{productName}} is today.\n\nThank you. Next stop: {{nextGoal}} 🚀`,
    platforms: ["twitter", "linkedin", "instagram"],
  },
  {
    name: "Poll / Community Question",
    category: "engagement",
    description: "Low-friction engagement post that sparks replies.",
    content: `Quick poll for {{audience}}: what's your biggest challenge with {{topic}}?\n\nA) {{optionA}}\nB) {{optionB}}\nC) {{optionC}}\n\nDrop your answer — we read every reply and build from them.`,
    platforms: ["twitter", "linkedin"],
  },
  {
    name: "Educational Carousel Opener",
    category: "educational",
    description: "Hook slide for an Instagram/LinkedIn carousel.",
    content: `{{n}} {{topic}} mistakes that quietly kill your {{metric}}\n\n(Swipe to see how to fix each one — the last one surprises everyone)`,
    platforms: ["instagram", "linkedin"],
  },
];

async function main() {
  console.log(`Seeding ${TEMPLATES.length} global content templates...`);

  // Idempotent: only insert templates whose name doesn't already exist globally.
  let inserted = 0;
  for (const template of TEMPLATES) {
    const existing = await prisma.contentTemplate.findFirst({
      where: { name: template.name, workspaceId: null },
    });
    if (existing) {
      console.log(`  ⊘ ${template.name} (already seeded)`);
      continue;
    }
    await prisma.contentTemplate.create({ data: { ...template, workspaceId: null } });
    console.log(`  ✓ ${template.name}`);
    inserted += 1;
  }

  console.log(`Done. ${inserted} inserted, ${TEMPLATES.length - inserted} skipped.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
