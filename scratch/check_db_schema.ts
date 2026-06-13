import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = ['badan_hukum', 'non_badan_hukum', 'ppat'];
    for (const table of tables) {
      console.log(`\nColumns for ${table}:`);
      const columns: any = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM ${table}`);
      console.log(columns.map((c: any) => c.Field).join(', '));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
