const prisma = require('../config/prisma');

async function main() {
  const email = process.argv[2] || 'kuzivakwashekubiku@gmail.com';
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });
  console.log(`User ${user.email} is now an ${user.role}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
