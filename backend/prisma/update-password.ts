import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('password123');
  
  await prisma.user.update({
    where: { email: 'thabo.molefe@trinity.co.za' },
    data: { passwordHash },
  });
  
  console.log('✅ Updated admin password');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
