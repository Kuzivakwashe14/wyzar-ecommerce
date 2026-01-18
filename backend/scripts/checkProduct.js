const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
  try {
    const product = await prisma.product.findFirst();
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name);
    console.log('Images:', JSON.stringify(product.images, null, 2));
    console.log('First Image:', product.images[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProduct();
