const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) return;
  const token = jwt.sign(
    { user: { id: admin.id, role: 'ADMIN' } }, 
    process.env.JWT_SECRET || 'secret'
  );
  require('fs').writeFileSync('token.txt', token);
}

main().finally(() => prisma.$disconnect());
