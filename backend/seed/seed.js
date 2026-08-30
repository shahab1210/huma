/**
 * Seed Script — Initializes the database with:
 *   ✓ Admin user (admin / Admin@123)
 *   ✓ Categories (Mehendi, Makeup, Parlour)
 *   ✓ Sample services and designs
 *   ✓ Default service areas
 *   ✓ Business settings
 *   ✓ Time slots for the next 30 days
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Design = require('../models/Design');
const ServiceArea = require('../models/ServiceArea');
const BusinessSettings = require('../models/BusinessSettings');
const TimeSlot = require('../models/TimeSlot');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  console.log('🌱 Starting database seed...\n');

  /* ══════════════════════════════
     1. ADMIN USER
     ══════════════════════════════ */
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (!existingAdmin) {
    await User.create({
      fullName: 'Huma Admin',
      mobileNumber: 'admin',
      email: 'humamehendi1210@gmail.com',
      passwordHash: 'admin',
      role: 'ADMIN',
      isMobileVerified: true,
      isActive: true,
    });
    console.log('✓ Admin user created (admin / admin)');
  } else {
    console.log('→ Admin user already exists');
  }

  /* ══════════════════════════════
     2. CATEGORIES
     ══════════════════════════════ */
  const categoryData = [
    // Mehendi
    { name: 'Bridal Mehendi', serviceType: 'MEHENDI', description: 'Exclusive bridal henna designs for the big day', sortOrder: 1 },
    { name: 'Arabic Mehendi', serviceType: 'MEHENDI', description: 'Elegant Arabic-style henna patterns', sortOrder: 2 },
    { name: 'Traditional Mehendi', serviceType: 'MEHENDI', description: 'Classic Indian traditional henna art', sortOrder: 3 },
    { name: 'Party Mehendi', serviceType: 'MEHENDI', description: 'Trendy designs for occasions and parties', sortOrder: 4 },
    // Makeup
    { name: 'Bridal Makeup', serviceType: 'MAKEUP', description: 'Complete bridal makeup with HD/Airbrush options', sortOrder: 1 },
    { name: 'Party Makeup', serviceType: 'MAKEUP', description: 'Glamorous party and event makeup', sortOrder: 2 },
    { name: 'Engagement Makeup', serviceType: 'MAKEUP', description: 'Special engagement ceremony look', sortOrder: 3 },
    // Parlour
    { name: 'Facial', serviceType: 'PARLOUR', description: 'Professional facial treatments', sortOrder: 1 },
    { name: 'Hair Styling', serviceType: 'PARLOUR', description: 'Professional hair styling and treatments', sortOrder: 2 },
    { name: 'Waxing & Threading', serviceType: 'PARLOUR', description: 'Full body waxing and eyebrow threading', sortOrder: 3 },
    { name: 'Mani-Pedi', serviceType: 'PARLOUR', description: 'Manicure and pedicure services', sortOrder: 4 },
  ];

  const existingCats = await Category.countDocuments();
  let categories;
  if (existingCats === 0) {
    categories = await Category.insertMany(categoryData);
    console.log(`✓ ${categories.length} categories created`);
  } else {
    categories = await Category.find();
    console.log('→ Categories already exist');
  }

  const catMap = {};
  categories.forEach((c) => {
    catMap[c.name] = c._id;
  });

  /* ══════════════════════════════
     3. MEHENDI DESIGNS
     ══════════════════════════════ */
  const existingDesigns = await Design.countDocuments();
  if (existingDesigns === 0) {
    const designData = [
      { name: 'Royal Bridal Full Hands', category: catMap['Bridal Mehendi'], price: 8000, startingPrice: 6000, duration: '3-4 hours', coverage: 'Full hands + arms', customizationAvailable: true, isFeatured: true, description: 'Intricate bridal henna with paisley, floral and peacock motifs covering full hands and arms up to elbows.' },
      { name: 'Bridal Full Package', category: catMap['Bridal Mehendi'], price: 15000, startingPrice: 12000, duration: '5-6 hours', coverage: 'Full hands + feet + arms + legs', customizationAvailable: true, isFeatured: true, description: 'Complete bridal mehendi package — hands, feet, arms and legs with personalized elements.' },
      { name: 'Elegant Arabic Trail', category: catMap['Arabic Mehendi'], price: 3000, startingPrice: 2500, duration: '1-2 hours', coverage: 'Back of hands', customizationAvailable: true, description: 'Bold flowing Arabic patterns with leaves and vines, perfect for modern brides.' },
      { name: 'Arabic Rose Garden', category: catMap['Arabic Mehendi'], price: 3500, startingPrice: 3000, duration: '1.5-2 hours', coverage: 'Full hands', customizationAvailable: false, description: 'Signature rose-inspired Arabic design with cascading floral elements.' },
      { name: 'Traditional Rajasthani', category: catMap['Traditional Mehendi'], price: 5000, startingPrice: 4000, duration: '2-3 hours', coverage: 'Full hands + wrists', customizationAvailable: true, description: 'Classic Rajasthani patterns with mirror-image symmetry and fine details.' },
      { name: 'Festive Indian Classic', category: catMap['Traditional Mehendi'], price: 2500, startingPrice: 2000, duration: '1-2 hours', coverage: 'Palms + back of hands', customizationAvailable: false, description: 'Traditional Indian designs perfect for Karwa Chauth, Teej and Diwali.' },
      { name: 'Party Glam Design', category: catMap['Party Mehendi'], price: 1500, startingPrice: 1000, duration: '45 min - 1 hour', coverage: 'One hand / back only', customizationAvailable: true, description: 'Trendy minimalist mehendi designs for parties, sangeet, and get-togethers.' },
      { name: 'Kids Special Mehendi', category: catMap['Party Mehendi'], price: 500, startingPrice: 300, duration: '20-30 min', coverage: 'Palm', customizationAvailable: false, description: 'Fun and simple henna designs for children at events and festivals.' },
    ];
    await Design.insertMany(designData);
    console.log(`✓ ${designData.length} mehendi designs created`);
  } else {
    console.log('→ Designs already exist');
  }

  /* ══════════════════════════════
     4. MAKEUP & PARLOUR SERVICES
     ══════════════════════════════ */
  const existingServices = await Service.countDocuments();
  if (existingServices === 0) {
    const serviceData = [
      // Makeup
      { name: 'HD Bridal Makeup', category: catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 15000, duration: '2-3 hours', isFeatured: true, description: 'Premium HD bridal makeup with long-lasting products, includes pre-bridal skin prep.' },
      { name: 'Airbrush Bridal Makeup', category: catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 20000, duration: '2-3 hours', isFeatured: true, description: 'Flawless airbrush bridal makeup for that perfect photo finish and all-day wear.' },
      { name: 'Engagement Look', category: catMap['Engagement Makeup'], serviceType: 'MAKEUP', price: 8000, duration: '1.5-2 hours', description: 'Elegant engagement ceremony makeup with subtle glam and perfect base.' },
      { name: 'Party Glam Makeup', category: catMap['Party Makeup'], serviceType: 'MAKEUP', price: 5000, duration: '1-1.5 hours', description: 'Bold and glamorous makeup look for parties, receptions, and events.' },
      { name: 'Soft Glam Look', category: catMap['Party Makeup'], serviceType: 'MAKEUP', price: 3500, duration: '45 min - 1 hour', description: 'Natural yet enhanced soft glam makeup for elegant occasions.' },
      // Parlour
      { name: 'Gold Facial', category: catMap['Facial'], serviceType: 'PARLOUR', price: 1500, duration: '45-60 min', isFeatured: true, description: 'Luxurious gold-infused facial for radiant, glowing skin.' },
      { name: 'Diamond Facial', category: catMap['Facial'], serviceType: 'PARLOUR', price: 2000, duration: '60 min', description: 'Premium diamond facial for deep cleansing and anti-aging benefits.' },
      { name: 'Bridal Hair Styling', category: catMap['Hair Styling'], serviceType: 'PARLOUR', price: 3000, duration: '1-1.5 hours', isFeatured: true, description: 'Elegant bridal hairstyling with buns, braids, and floral accents.' },
      { name: 'Party Hair Styling', category: catMap['Hair Styling'], serviceType: 'PARLOUR', price: 1500, duration: '30-45 min', description: 'Trendy hairdos for parties and celebrations.' },
      { name: 'Full Body Waxing', category: catMap['Waxing & Threading'], serviceType: 'PARLOUR', price: 2500, duration: '1.5-2 hours', description: 'Complete body waxing service with premium wax for smooth, hair-free skin.' },
      { name: 'Eyebrow Threading & Shaping', category: catMap['Waxing & Threading'], serviceType: 'PARLOUR', price: 200, duration: '15 min', description: 'Expert eyebrow shaping and threading for defined brows.' },
      { name: 'Luxury Mani-Pedi', category: catMap['Mani-Pedi'], serviceType: 'PARLOUR', price: 1500, duration: '1 hour', description: 'Complete manicure and pedicure with scrub, massage, and nail art.' },
    ];
    await Service.insertMany(serviceData);
    console.log(`✓ ${serviceData.length} services created`);
  } else {
    console.log('→ Services already exist');
  }

  /* ══════════════════════════════
     5. SERVICE AREAS
     ══════════════════════════════ */
  const existingAreas = await ServiceArea.countDocuments();
  if (existingAreas === 0) {
    const areas = [
      { name: 'Lucknow' },
      { name: 'Kanpur' },
      { name: 'Raebareli' },
      { name: 'Bachhrawan' },
      { name: 'Lalganj' },
      { name: 'Nearby Raebareli Areas' },
    ];
    await ServiceArea.insertMany(areas);
    console.log(`✓ ${areas.length} service areas created`);
  } else {
    console.log('→ Service areas already exist');
  }

  /* ══════════════════════════════
     6. BUSINESS SETTINGS
     ══════════════════════════════ */
  const existingSettings = await BusinessSettings.countDocuments();
  if (existingSettings === 0) {
    await BusinessSettings.create({});
    console.log('✓ Default business settings created');
  } else {
    console.log('→ Business settings already exist');
  }

  /* ══════════════════════════════
     7. TIME SLOTS (next 30 days)
     ══════════════════════════════ */
  const existingSlots = await TimeSlot.countDocuments();
  if (existingSlots === 0) {
    const slotTimes = [
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '12:00', endTime: '13:00' },
      { startTime: '13:00', endTime: '14:00' },
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
      { startTime: '17:00', endTime: '18:00' },
      { startTime: '18:00', endTime: '19:00' },
      { startTime: '19:00', endTime: '20:00' },
      { startTime: '20:00', endTime: '21:00' },
      { startTime: '21:00', endTime: '22:00' },
      { startTime: '22:00', endTime: '23:00' },
    ];

    const slotsToCreate = [];
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);

      for (const st of slotTimes) {
        slotsToCreate.push({
          date,
          startTime: st.startTime,
          endTime: st.endTime,
          status: 'AVAILABLE',
        });
      }
    }

    await TimeSlot.insertMany(slotsToCreate);
    console.log(`✓ ${slotsToCreate.length} time slots created (30 days × 13 slots/day)`);
  } else {
    console.log('→ Time slots already exist');
  }

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Admin credentials:');
  console.log('  Mobile/Username: admin');
  console.log('  Password: admin');
  console.log('');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
