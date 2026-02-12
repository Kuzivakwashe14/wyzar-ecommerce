// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a seller user (or find existing)
  let seller = await prisma.user.findFirst({ where: { isSeller: true } });

  if (!seller) {
    seller = await prisma.user.create({
      data: {
        email: 'seller@wyzar.co.zw',
        firstName: 'WyZar',
        lastName: 'Store',
        isSeller: true,
        isVerified: true,
        isEmailVerified: true,
        role: 'USER',
      }
    });

    await prisma.sellerDetails.create({
      data: {
        userId: seller.id,
        businessName: 'WyZar Official Store',
        verificationStatus: 'APPROVED',
        city: 'Harare',
        country: 'Zimbabwe',
      }
    });

    console.log('✅ Created seller user:', seller.email);
  } else {
    console.log('✅ Using existing seller:', seller.email);
  }

  const sellerId = seller.id;

  // Check if products already exist
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`ℹ️  Database already has ${existingCount} products. Skipping seed.`);
    return;
  }

  const products = [
    // Electronics
    {
      sellerId,
      name: "Samsung Galaxy S23 Ultra",
      description: "Latest flagship smartphone with 200MP camera, 5000mAh battery, and S Pen. Features a stunning 6.8-inch Dynamic AMOLED display with 120Hz refresh rate.",
      price: 1199.99,
      quantity: 15,
      category: "Electronics",
      deliveryTime: "2-3 days",
      countryOfOrigin: "South Korea",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["smartphone", "samsung", "flagship"],
    },
    {
      sellerId,
      name: "Sony WH-1000XM5 Headphones",
      description: "Industry-leading noise cancelling wireless headphones with premium sound quality. 30-hour battery life and multi-point connection.",
      price: 399.99,
      quantity: 25,
      category: "Electronics",
      deliveryTime: "1-2 days",
      countryOfOrigin: "Japan",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["headphones", "sony", "wireless"],
    },
    {
      sellerId,
      name: "Dell XPS 15 Laptop",
      description: "Professional laptop with Intel Core i7, 16GB RAM, 512GB SSD. 15.6-inch 4K display, perfect for content creators.",
      price: 1599.99,
      quantity: 8,
      category: "Electronics",
      deliveryTime: "3-5 days",
      countryOfOrigin: "USA",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["laptop", "dell", "professional"],
    },
    {
      sellerId,
      name: "iPad Pro 12.9 inch",
      description: "Apple's most powerful tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil support.",
      price: 1099.99,
      quantity: 12,
      category: "Electronics",
      deliveryTime: "2-4 days",
      countryOfOrigin: "USA",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["tablet", "apple", "ipad"],
    },
    // Fashion
    {
      sellerId,
      name: "Nike Air Max 270",
      description: "Iconic lifestyle shoe featuring Nike's biggest heel Air unit yet for a super-soft ride. Breathable mesh upper for all-day comfort.",
      price: 150.00,
      quantity: 30,
      category: "Fashion",
      deliveryTime: "2-3 days",
      countryOfOrigin: "Vietnam",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["shoes", "nike", "sneakers"],
    },
    {
      sellerId,
      name: "Levi's 501 Original Jeans",
      description: "The original blue jean. Straight leg, button fly. A timeless classic that never goes out of style.",
      price: 69.99,
      quantity: 40,
      category: "Fashion",
      deliveryTime: "1-2 days",
      countryOfOrigin: "USA",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["jeans", "levis", "denim"],
    },
    {
      sellerId,
      name: "Ray-Ban Aviator Sunglasses",
      description: "Classic aviator sunglasses with gold frame and green G-15 lenses. UV protection and timeless style.",
      price: 154.00,
      quantity: 20,
      category: "Fashion",
      deliveryTime: "1-2 days",
      countryOfOrigin: "Italy",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["sunglasses", "rayban", "aviator"],
    },
    // Home & Living
    {
      sellerId,
      name: "Dyson V15 Detect Vacuum",
      description: "Powerful cordless vacuum with laser dust detection. Up to 60 minutes of fade-free power for deep cleaning.",
      price: 749.99,
      quantity: 10,
      category: "Home",
      deliveryTime: "3-5 days",
      countryOfOrigin: "Malaysia",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["vacuum", "dyson", "cordless"],
    },
    {
      sellerId,
      name: "Instant Pot Duo 7-in-1",
      description: "Multi-use pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer. 6-quart capacity.",
      price: 89.99,
      quantity: 35,
      category: "Home",
      deliveryTime: "2-3 days",
      countryOfOrigin: "China",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["kitchen", "cooker", "instant-pot"],
    },
    // Mobile & Accessories
    {
      sellerId,
      name: "Apple AirPods Pro 2nd Gen",
      description: "Active noise cancellation, Adaptive Transparency, personalized Spatial Audio. MagSafe charging case with speaker.",
      price: 249.99,
      quantity: 20,
      category: "Mobile",
      deliveryTime: "1-2 days",
      countryOfOrigin: "China",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["airpods", "apple", "earbuds"],
    },
    {
      sellerId,
      name: "Samsung Galaxy Watch 6",
      description: "Advanced health monitoring with BioActive Sensor. Sapphire Crystal display, sleep coaching, and fitness tracking.",
      price: 329.99,
      quantity: 18,
      category: "Mobile",
      deliveryTime: "2-3 days",
      countryOfOrigin: "South Korea",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["smartwatch", "samsung", "wearable"],
    },
    {
      sellerId,
      name: "Anker PowerCore 26800mAh",
      description: "Ultra-high capacity portable charger with dual USB ports. Charges smartphones up to 6 times. Fast charging technology.",
      price: 65.99,
      quantity: 50,
      category: "Mobile",
      deliveryTime: "1-2 days",
      countryOfOrigin: "China",
      condition: "NEW",
      city: "Harare",
      country: "Zimbabwe",
      images: [],
      tags: ["powerbank", "anker", "charger"],
    },
  ];

  console.log(`📦 Seeding ${products.length} products...`);

  for (const product of products) {
    await prisma.product.create({ data: product });
    console.log(`  ✅ ${product.name}`);
  }

  console.log(`\n🎉 Successfully seeded ${products.length} products!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
