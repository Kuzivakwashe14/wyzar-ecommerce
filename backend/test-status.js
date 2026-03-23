const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statusInput = 'Cancelled'; // From frontend
  const where = {};

  if (statusInput) {
    const statusMap = {
      'pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'paid': 'PAID',
      'shipped': 'SHIPPED',
      'delivered': 'DELIVERED',
      'cancelled': 'CANCELLED'
    };
    const mappedStatus = statusMap[statusInput.toLowerCase()];
    if (mappedStatus) {
      where.status = mappedStatus;
    }
  }

  console.log('Query where clause:', where);

  try {
    const orders = await prisma.order.findMany({
      where,
      take: 1
    });
    console.log('Success! Found orders:', orders.length);
  } catch (error) {
    console.error('Prisma Error:', error);
  }
}

main().finally(() => prisma.$disconnect());
