import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Desenvolvimento", icon: "code" },
    { name: "Design", icon: "palette" },
    { name: "Marketing", icon: "megaphone" },
    { name: "Reunião", icon: "calendar" },
    { name: "Documentação", icon: "file-text" },
    { name: "Infraestrutura", icon: "server" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
