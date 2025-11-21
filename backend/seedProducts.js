// backend/seedProducts.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Import existing models
const Product = require('./models/Product');
const User = require('./models/User');

// Sample products data
const sampleProducts = [
  // Electronics
  {
    name: "Samsung Galaxy S23 Ultra",
    description: "Latest flagship smartphone with 200MP camera, 5000mAh battery, and S Pen. Features a stunning 6.8-inch Dynamic AMOLED display with 120Hz refresh rate. Snapdragon 8 Gen 2 processor for ultimate performance.",
    price: 1199.99,
    quantity: 15,
    category: "Electronics",
    deliveryTime: "2-3 days",
    countryOfOrigin: "South Korea",
    images: ["uploads/placeholder-phone.jpg"]
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise cancelling wireless headphones with premium sound quality. 30-hour battery life, multi-point connection, and exceptional comfort for all-day wear.",
    price: 399.99,
    quantity: 25,
    category: "Electronics",
    deliveryTime: "1-2 days",
    countryOfOrigin: "Japan",
    images: ["uploads/placeholder-headphones.jpg"]
  },
  {
    name: "Dell XPS 15 Laptop",
    description: "Professional laptop with Intel Core i7, 16GB RAM, 512GB SSD. Featuring a stunning 15.6-inch 4K display, perfect for content creators and professionals.",
    price: 1599.99,
    quantity: 8,
    category: "Electronics",
    deliveryTime: "3-5 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-laptop.jpg"]
  },
  {
    name: "iPad Pro 12.9 inch",
    description: "Apple's most powerful tablet with M2 chip, stunning Liquid Retina XDR display, and support for Apple Pencil (2nd generation). Perfect for creative professionals.",
    price: 1099.99,
    quantity: 12,
    category: "Electronics",
    deliveryTime: "2-3 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-tablet.jpg"]
  },

  // Fashion
  {
    name: "Nike Air Max 270",
    description: "Iconic sneakers with visible Air cushioning, breathable mesh upper, and modern design. Available in multiple colors. Perfect for everyday wear and light workouts.",
    price: 149.99,
    quantity: 30,
    category: "Fashion",
    deliveryTime: "2-3 days",
    countryOfOrigin: "Vietnam",
    images: ["uploads/placeholder-shoes.jpg"]
  },
  {
    name: "Levi's 501 Original Jeans",
    description: "Classic straight fit jeans with button fly. Made from premium denim with a timeless design that never goes out of style. Available in various washes.",
    price: 89.99,
    quantity: 50,
    category: "Fashion",
    deliveryTime: "1-2 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-jeans.jpg"]
  },
  {
    name: "Summer Floral Dress",
    description: "Elegant floral print dress perfect for summer occasions. Lightweight, breathable fabric with a flattering fit. Features adjustable straps and side pockets.",
    price: 59.99,
    quantity: 40,
    category: "Fashion",
    deliveryTime: "1-2 days",
    countryOfOrigin: "India",
    images: ["uploads/placeholder-dress.jpg"]
  },
  {
    name: "Leather Crossbody Bag",
    description: "Genuine leather handbag with adjustable strap and multiple compartments. Perfect size for everyday essentials. Available in black, brown, and tan.",
    price: 79.99,
    quantity: 20,
    category: "Fashion",
    deliveryTime: "2-3 days",
    countryOfOrigin: "Italy",
    images: ["uploads/placeholder-bag.jpg"]
  },

  // Home & Living
  {
    name: "Dyson V15 Vacuum Cleaner",
    description: "Powerful cordless vacuum with laser detection technology. HEPA filtration captures 99.99% of particles. Up to 60 minutes of runtime on a single charge.",
    price: 649.99,
    quantity: 10,
    category: "Home & Living",
    deliveryTime: "2-4 days",
    countryOfOrigin: "UK",
    images: ["uploads/placeholder-vacuum.jpg"]
  },
  {
    name: "KitchenAid Stand Mixer",
    description: "Professional 5-quart stand mixer with 10 speeds and multiple attachments. Perfect for baking, mixing, and food preparation. Durable and stylish design.",
    price: 399.99,
    quantity: 15,
    category: "Home & Living",
    deliveryTime: "3-5 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-mixer.jpg"]
  },
  {
    name: "Memory Foam Mattress - Queen",
    description: "Premium memory foam mattress with cooling gel technology. Provides excellent support and pressure relief. Comes with a 10-year warranty.",
    price: 599.99,
    quantity: 5,
    category: "Home & Living",
    deliveryTime: "5-7 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-mattress.jpg"]
  },
  {
    name: "Smart LED Light Bulbs (4-Pack)",
    description: "WiFi-enabled smart bulbs with 16 million colors. Control via app or voice commands. Energy-efficient and long-lasting with 25,000-hour lifespan.",
    price: 39.99,
    quantity: 60,
    category: "Home & Living",
    deliveryTime: "1-2 days",
    countryOfOrigin: "China",
    images: ["uploads/placeholder-bulbs.jpg"]
  },

  // Mobile & Accessories
  {
    name: "iPhone 15 Pro Max",
    description: "Apple's latest flagship with titanium design, A17 Pro chip, and advanced camera system. Features Action button and USB-C connectivity.",
    price: 1299.99,
    quantity: 20,
    category: "Mobile & Accessories",
    deliveryTime: "2-3 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-iphone.jpg"]
  },
  {
    name: "Anker PowerCore 20000mAh",
    description: "High-capacity portable charger with fast charging support. Charges iPhone 14 up to 4 times. Compact design with LED indicator.",
    price: 49.99,
    quantity: 45,
    category: "Mobile & Accessories",
    deliveryTime: "1-2 days",
    countryOfOrigin: "China",
    images: ["uploads/placeholder-powerbank.jpg"]
  },
  {
    name: "Spigen Phone Case - Universal",
    description: "Military-grade protection with air cushion technology. Slim profile with raised bezels for screen and camera protection. Available for various phone models.",
    price: 24.99,
    quantity: 100,
    category: "Mobile & Accessories",
    deliveryTime: "1-2 days",
    countryOfOrigin: "South Korea",
    images: ["uploads/placeholder-case.jpg"]
  },
  {
    name: "AirPods Pro (2nd Gen)",
    description: "Active noise cancellation, Adaptive Transparency, and Personalized Spatial Audio. Up to 6 hours of listening time. MagSafe charging case included.",
    price: 249.99,
    quantity: 35,
    category: "Mobile & Accessories",
    deliveryTime: "2-3 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-airpods.jpg"]
  },

  // Beauty & Health
  {
    name: "Fitbit Charge 6",
    description: "Advanced fitness tracker with heart rate monitoring, GPS, and sleep tracking. 7-day battery life. Water-resistant up to 50 meters.",
    price: 159.99,
    quantity: 25,
    category: "Beauty & Health",
    deliveryTime: "2-3 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-fitbit.jpg"]
  },
  {
    name: "Olay Regenerist Moisturizer",
    description: "Anti-aging face cream with hyaluronic acid and peptides. Reduces fine lines and improves skin texture. Non-greasy formula suitable for all skin types.",
    price: 29.99,
    quantity: 70,
    category: "Beauty & Health",
    deliveryTime: "1-2 days",
    countryOfOrigin: "USA",
    images: ["uploads/placeholder-moisturizer.jpg"]
  },

  // Sports & Outdoors
  {
    name: "Yoga Mat - Premium",
    description: "Extra thick (6mm) non-slip yoga mat with carrying strap. Eco-friendly TPE material. Perfect for yoga, pilates, and home workouts.",
    price: 34.99,
    quantity: 50,
    category: "Sports & Outdoors",
    deliveryTime: "2-3 days",
    countryOfOrigin: "China",
    images: ["uploads/placeholder-yogamat.jpg"]
  },
  {
    name: "Camping Tent - 4 Person",
    description: "Waterproof family tent with easy setup. Includes rainfly, storage pockets, and ventilation windows. Perfect for weekend camping trips.",
    price: 149.99,
    quantity: 12,
    category: "Sports & Outdoors",
    deliveryTime: "3-5 days",
    countryOfOrigin: "China",
    images: ["uploads/placeholder-tent.jpg"]
  }
];

async function seedProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Find a seller user (or create a default one)
    let seller = await User.findOne({ isSeller: true });

    if (!seller) {
      console.log('No seller found. Please create a seller account first or run with a seller ID.');
      console.log('You can create a seller by:');
      console.log('1. Sign up at http://localhost:3000/sign-up');
      console.log('2. Go to http://localhost:3000/become-a-seller');
      console.log('3. Run this script again');
      process.exit(1);
    }

    console.log(`Using seller: ${seller.email} (${seller.sellerDetails.businessName})`);

    // Clear existing products (optional)
    const existingCount = await Product.countDocuments();
    console.log(`Found ${existingCount} existing products`);

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    if (existingCount > 0) {
      await new Promise((resolve) => {
        readline.question('Do you want to delete existing products? (yes/no): ', (answer) => {
          if (answer.toLowerCase() === 'yes') {
            Product.deleteMany({}).then(() => {
              console.log('Deleted existing products');
              resolve();
            });
          } else {
            console.log('Keeping existing products');
            resolve();
          }
          readline.close();
        });
      });
    }

    // Add seller ID to all sample products
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      seller: seller._id
    }));

    // Insert sample products
    console.log('Inserting sample products...');
    const inserted = await Product.insertMany(productsWithSeller);

    console.log(`✅ Successfully added ${inserted.length} sample products!`);
    console.log('\nProducts by category:');

    const categories = {};
    inserted.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });

    console.log('\nYou can now view the products at:');
    console.log('  Homepage: http://localhost:3000');
    console.log('  Products: http://localhost:3000/products');

  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Run the seed function
seedProducts();
