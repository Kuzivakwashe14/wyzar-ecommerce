const prisma = require('../config/prisma');

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });
  console.log('--- Users ---');
  users.forEach(u => {
    console.log(`${u.email} [${u.role}] - ${u.firstName} ${u.lastName}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
