import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Product from './models/Product';
import bcrypt from 'bcryptjs';

dotenv.config();

const products = [
  {
    name: 'Premium Egyptian Cotton Fabric Roll',
    description: 'High-grade 100% Egyptian cotton fabric roll. Perfect for luxury bedding, premium apparel, and high-end textile manufacturing. Features superior softness, breathability, and durability.',
    category: 'Cotton',
    fabricType: 'Pure Cotton',
    price: 45.99,
    stock: 150,
    colors: ['White', 'Ivory', 'Beige', 'Light Blue', 'Charcoal'],
    specifications: {
      'Weight': '150 GSM',
      'Thread Count': '400',
      'Width': '60 inches',
      'Length': '50 yards',
      'Material': '100% Egyptian Cotton',
      'Weave': 'Sateen',
      'Care': 'Machine Wash Cold'
    },
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'
    ],
    featured: true,
    isActive: true,
  },
  {
    name: 'Luxury Silk Charmeuse Fabric Roll',
    description: 'Premium Mulberry silk charmeuse fabric roll. Features a beautiful drape and luminous sheen. Ideal for luxury evening wear, bridal collections, and high-end fashion accessories.',
    category: 'Silk',
    fabricType: 'Silk Charmeuse',
    price: 89.99,
    stock: 75,
    colors: ['Champagne', 'Blush', 'Navy', 'Emerald', 'Ivory'],
    specifications: {
      'Weight': '60 GSM',
      'Width': '44 inches',
      'Length': '25 yards',
      'Material': '100% Mulberry Silk',
      'Weave': 'Charmeuse',
      'Care': 'Dry Clean Only'
    },
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600',
      'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=600'
    ],
    featured: true,
    isActive: true,
  },
  {
    name: 'Organic Linen Fabric Roll',
    description: 'Sustainable organic linen fabric roll. Breathable and naturally textured. Perfect for summer fashion collections, home textiles, and eco-conscious brands.',
    category: 'Linen',
    fabricType: 'Pure Linen',
    price: 65.50,
    stock: 200,
    colors: ['Natural', 'Oatmeal', 'Sage', 'Dusty Blue', 'Sand'],
    specifications: {
      'Weight': '165 GSM',
      'Width': '54 inches',
      'Length': '40 yards',
      'Material': '100% Organic Linen',
      'Weave': 'Plain',
      'Care': 'Machine Wash Gentle'
    },
    images: [
      'https://images.unsplash.com/photo-1602810320078-0f0da6f02e52?w=600',
      'https://images.unsplash.com/photo-1602810320078-0f0da6f02e52?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Premium Wool Blend Suiting Fabric Roll',
    description: 'High-quality wool blend fabric roll for tailored suiting. Provides warmth with a refined, professional finish. Perfect for formal wear collections and luxury menswear.',
    category: 'Wool',
    fabricType: 'Wool Blend',
    price: 120.00,
    stock: 50,
    colors: ['Charcoal', 'Navy', 'Black', 'Heather Grey', 'Burgundy'],
    specifications: {
      'Weight': '240 GSM',
      'Width': '58 inches',
      'Length': '30 yards',
      'Material': '80% Wool, 20% Polyester',
      'Weave': 'Twill',
      'Care': 'Dry Clean Only'
    },
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Stretch Denim Fabric Roll',
    description: 'Premium stretch denim fabric roll with excellent recovery and durability. Ideal for denim manufacturing, casual wear collections, and contemporary fashion brands.',
    category: 'Denim',
    fabricType: 'Stretch Denim',
    price: 55.75,
    stock: 120,
    colors: ['Indigo', 'Dark Wash', 'Black', 'Light Wash', 'Grey'],
    specifications: {
      'Weight': '350 GSM',
      'Width': '60 inches',
      'Length': '35 yards',
      'Material': '98% Cotton, 2% Spandex',
      'Weave': 'Twill',
      'Care': 'Machine Wash Cold'
    },
    images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Luxury Velvet Fabric Roll',
    description: 'Premium velvet fabric roll with soft, plush texture and elegant sheen. Perfect for luxury upholstery, drapery, evening wear, and interior design applications.',
    category: 'Velvet',
    fabricType: 'Pure Velvet',
    price: 95.25,
    stock: 80,
    colors: ['Burgundy', 'Royal Blue', 'Emerald', 'Black', 'Plum'],
    specifications: {
      'Weight': '280 GSM',
      'Width': '54 inches',
      'Length': '25 yards',
      'Material': '100% Polyester Velvet',
      'Weave': 'Pile',
      'Care': 'Dry Clean Only'
    },
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Premium Satin Fabric Roll',
    description: 'Beautiful satin fabric roll with glossy surface and smooth finish. Ideal for bridal wear, evening gowns, decorative applications, and luxury textile collections.',
    category: 'Satin',
    fabricType: 'Pure Satin',
    price: 78.00,
    stock: 100,
    colors: ['Ivory', 'Blush', 'Champagne', 'Silver', 'Rose Gold'],
    specifications: {
      'Weight': '90 GSM',
      'Width': '44 inches',
      'Length': '30 yards',
      'Material': '100% Polyester Satin',
      'Weave': 'Satin',
      'Care': 'Hand Wash'
    },
    images: [
      'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=600',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Pure Bamboo Viscose Fabric Roll',
    description: 'Eco-friendly bamboo viscose fabric roll. Naturally soft, breathable, and moisture-wicking. Perfect for sustainable fashion, activewear, and luxury loungewear collections.',
    category: 'Bamboo',
    fabricType: 'Bamboo Viscose',
    price: 72.50,
    stock: 90,
    colors: ['Natural', 'White', 'Grey', 'Charcoal', 'Sage'],
    specifications: {
      'Weight': '130 GSM',
      'Width': '58 inches',
      'Length': '35 yards',
      'Material': '100% Bamboo Viscose',
      'Weave': 'Plain',
      'Care': 'Machine Wash Cold'
    },
    images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Hemp Organic Cotton Blend Fabric Roll',
    description: 'Sustainable hemp and organic cotton blend fabric roll. Durable, breathable, and environmentally friendly. Perfect for eco-conscious fashion brands and sustainable textile collections.',
    category: 'Hemp',
    fabricType: 'Hemp-Cotton Blend',
    price: 82.00,
    stock: 60,
    colors: ['Natural', 'Oatmeal', 'Sage', 'Charcoal', 'Sand'],
    specifications: {
      'Weight': '180 GSM',
      'Width': '56 inches',
      'Length': '30 yards',
      'Material': '55% Hemp, 45% Organic Cotton',
      'Weave': 'Twill',
      'Care': 'Machine Wash Gentle'
    },
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'
    ],
    featured: false,
    isActive: true,
  },
  {
    name: 'Premium Rayon Crepe Fabric Roll',
    description: 'Luxurious rayon crepe fabric roll with a beautiful fluid drape. Perfect for dresses, blouses, and lightweight apparel collections. Offers excellent color retention and comfort.',
    category: 'Rayon',
    fabricType: 'Rayon Crepe',
    price: 48.50,
    stock: 110,
    colors: ['Black', 'Navy', 'Burgundy', 'Emerald', 'Champagne'],
    specifications: {
      'Weight': '120 GSM',
      'Width': '44 inches',
      'Length': '35 yards',
      'Material': '100% Rayon',
      'Weave': 'Crepe',
      'Care': 'Hand Wash'
    },
    images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'
    ],
    featured: false,
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/textile-marketplace');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');

    console.log('👤 Creating supplier account...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const supplier = await User.create({
      name: 'Premium Textiles Supplier',
      email: 'supplier@test.com',
      password: hashedPassword,
      role: 'supplier',
      businessName: 'Premium Textiles Co.',
      businessType: 'manufacturer',
      onboardingCompleted: true,
      isActive: true,
    });
    console.log('✅ Created supplier:', supplier.email);

    const productsWithSupplier = products.map(product => ({
      ...product,
      supplierId: supplier._id,
    }));

    console.log(`📦 Creating ${products.length} sample products...`);
    await Product.insertMany(productsWithSupplier);
    console.log(`✅ Created ${products.length} sample products`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database Seeded Successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Test Credentials:');
    console.log('   👤 Supplier:');
    console.log('   Email: supplier@test.com');
    console.log('   Password: password123');
    console.log('   Role: Supplier');
    console.log('');
    console.log('   🛍️ Buyer:');
    console.log('   Register as buyer to test shopping flow');
    console.log('');
    console.log('📊 Sample Products Added:');
    console.log(`   • ${products.length} textile/fabric products`);
    console.log(`   • ${[...new Set(products.map(p => p.category))].length} categories`);
    console.log('   • All products are fabric rolls in yards');
    console.log('   • Images from Unsplash (free to use)');
    console.log('   • Perfect for B2B textile marketplace');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Start your frontend: cd ../frontend && npm run dev');
    console.log('   3. Visit http://localhost:3000 to see your products!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();