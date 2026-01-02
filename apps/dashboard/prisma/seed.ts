import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@cfx.dev" },
    update: {},
    create: {
      email: "admin@cfx.dev",
      name: "Admin User",
      password: adminPassword,
      role: "SUPER_ADMIN",
      plan: "ENTERPRISE",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create default site settings
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "CF-X Platform",
      siteDescription: "3-Stage AI Orchestration Platform",
      siteKeywords: "AI, LLM, API, Claude, GPT, DeepSeek",
    },
  });

  console.log("Created default site settings");

  // Create default pricing plans
  const plans = [
    { name: "FREE", displayName: "Free", monthlyPrice: 0, yearlyPrice: 0, dailyRequests: 100, concurrentStreams: 1, maxTokensPerRequest: 4096, features: ["100 günlük istek", "1 eşzamanlı stream", "Temel modeller"], sortOrder: 0 },
    { name: "STARTER", displayName: "Starter", monthlyPrice: 1900, yearlyPrice: 19000, dailyRequests: 1000, concurrentStreams: 2, maxTokensPerRequest: 8192, features: ["1,000 günlük istek", "2 eşzamanlı stream", "Tüm modeller", "Email destek"], sortOrder: 1 },
    { name: "PRO", displayName: "Pro", monthlyPrice: 4900, yearlyPrice: 49000, dailyRequests: 10000, concurrentStreams: 5, maxTokensPerRequest: 16384, features: ["10,000 günlük istek", "5 eşzamanlı stream", "Öncelikli erişim", "Öncelikli destek"], sortOrder: 2 },
    { name: "TEAM", displayName: "Team", monthlyPrice: 9900, yearlyPrice: 99000, dailyRequests: 50000, concurrentStreams: 10, maxTokensPerRequest: 32768, features: ["50,000 günlük istek", "10 eşzamanlı stream", "Takım yönetimi", "SLA garantisi"], sortOrder: 3 },
  ];

  for (const plan of plans) {
    await prisma.pricingPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  console.log("Created pricing plans");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
