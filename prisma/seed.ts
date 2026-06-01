import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sports = [
    { name: 'Pickleball', slug: 'pickleball', pointSystem: 'rally', description: 'First to 11, win by 2' },
    { name: 'Tennis', slug: 'tennis', pointSystem: 'traditional', description: 'Traditional scoring' },
    { name: 'Table Tennis', slug: 'table-tennis', pointSystem: 'rally', description: 'First to 11, win by 2' },
    { name: 'Badminton', slug: 'badminton', pointSystem: 'rally', description: 'First to 21, win by 2' },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({ where: { slug: sport.slug }, update: {}, create: sport });
  }

  console.log('Seeded sports:', sports.map((s) => s.name).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
