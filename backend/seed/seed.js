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
const Location = require('../models/Location');
const ServiceGroup = require('../models/ServiceGroup');

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
    { name: 'Skin Care', serviceType: 'PARLOUR', description: 'Professional facial and skin care treatments', sortOrder: 1 },
    { name: 'Hair Care', serviceType: 'PARLOUR', description: 'Professional hair styling, spa and grooming treatments', sortOrder: 2 },
    { name: 'Beauty Parlour', serviceType: 'PARLOUR', description: 'Waxing, threading, manicure, pedicure and parlour packages', sortOrder: 3 },
    { name: 'Facial', serviceType: 'PARLOUR', description: 'Professional facial treatments', sortOrder: 4 },
    { name: 'Hair Styling', serviceType: 'PARLOUR', description: 'Professional hair styling and treatments', sortOrder: 5 },
    { name: 'Waxing & Threading', serviceType: 'PARLOUR', description: 'Full body waxing and eyebrow threading', sortOrder: 6 },
    { name: 'Mani-Pedi', serviceType: 'PARLOUR', description: 'Manicure and pedicure services', sortOrder: 7 },
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
     4. MAKEUP & PARLOUR SERVICES (Sample / Starter Catalog)
     ══════════════════════════════ */
  const existingServices = await Service.countDocuments();
  if (existingServices === 0) {
    const serviceData = [
      // --- MAKEUP (Sample) ---
      { name: 'Party Makeup', category: catMap['Party Makeup'] || catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 2500, duration: 'Approx. 1.5 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1610173826014-d131b02d69ca?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Camera-ready soft or bold party glam tailored for sangeet, reception, and festive celebrations.' },
      { name: 'Engagement Makeup', category: catMap['Engagement Makeup'] || catMap['Party Makeup'], serviceType: 'MAKEUP', price: 5000, duration: 'Approx. 2 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Radiant engagement makeup look with defined eye artistry, long-lasting base, and hairstyling.' },
      { name: 'HD Makeup', category: catMap['Party Makeup'] || catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 4000, duration: 'Approx. 2 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'High-definition photo-friendly base and contoured finish that looks seamless in person and under studio lights.' },
      { name: 'Soft Glam Makeup', category: catMap['Party Makeup'] || catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 3000, duration: 'Approx. 1.5 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Subtle, radiant, natural glam emphasizing dewy skin, gentle earthy tones, and refined elegance.' },

      // --- BRIDAL MAKEUP (Sample) ---
      { name: 'HD Bridal Makeup', category: catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 12000, duration: 'Approx. 3 hrs', isFeatured: true, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1783495687666-ca55fe595de4?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Complete signature bridal makeover with ultra-HD base, lashes, jewelry setting, hair styling, and dupatta draping.' },
      { name: 'Airbrush Bridal Makeup', category: catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 18000, duration: 'Approx. 3 hrs', isFeatured: true, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Flawless, sweat-proof, feather-light airbrush finish designed to last throughout all wedding rituals.' },
      { name: 'Traditional Bridal Makeup', category: catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 14000, duration: 'Approx. 3 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Classic cultural bridal look with rich tones, traditional eye accentuation, and meticulous jewellery setting.' },
      { name: 'Engagement / Reception Makeup', category: catMap['Bridal Makeup'] || catMap['Engagement Makeup'], serviceType: 'MAKEUP', price: 7000, duration: 'Approx. 2.5 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Sophisticated modern glamour for ring ceremonies, sangeet night, or grand reception parties.' },
      { name: 'Bridal Makeup + Hair Styling', category: catMap['Bridal Makeup'], serviceType: 'MAKEUP', price: 15000, duration: 'Approx. 3.5 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Comprehensive bridal package covering complete makeup, elaborate bridal hairdo with accessories, and draping.' },

      // --- SKIN CARE (Sample) ---
      { name: 'Basic Facial', category: catMap['Skin Care'] || catMap['Facial'], serviceType: 'PARLOUR', price: 800, duration: 'Approx. 45 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Gentle cleansing, exfoliation, steam, and hydrating pack for refreshed, healthy skin.' },
      { name: 'Cleanup', category: catMap['Skin Care'] || catMap['Facial'], serviceType: 'PARLOUR', price: 500, duration: 'Approx. 30 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1512290903829-e5870020db1e?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Quick deep pore cleansing, blackhead removal, and soothing mask for instant freshness.' },
      { name: 'Glow Facial', category: catMap['Skin Care'] || catMap['Facial'], serviceType: 'PARLOUR', price: 1200, duration: 'Approx. 1 hr', isFeatured: true, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Skin-illuminating facial designed to remove tanning and restore natural skin brightness.' },
      { name: 'Pre-Bridal Skin Care', category: catMap['Skin Care'] || catMap['Facial'], serviceType: 'PARLOUR', price: 2500, duration: 'Approx. 1.5 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Specialized pre-wedding skin therapy to deeply nourish, tone, and prepare skin for bridal makeup.' },
      { name: 'Face Cleanup & Care', category: catMap['Skin Care'] || catMap['Facial'], serviceType: 'PARLOUR', price: 700, duration: 'Approx. 45 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Rejuvenating face cleanup session with gentle massage and herbal face pack.' },

      // --- HAIR CARE (Sample) ---
      { name: "Women's Haircut", category: catMap['Hair Care'] || catMap['Hair Styling'], serviceType: 'PARLOUR', price: 600, duration: 'Approx. 45 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Custom haircut and shape tailored to your face structure and personal style.' },
      { name: 'Hair Trim', category: catMap['Hair Care'] || catMap['Hair Styling'], serviceType: 'PARLOUR', price: 350, duration: 'Approx. 30 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Split ends removal and neat length leveling to maintain healthy hair growth.' },
      { name: 'Hair Styling', category: catMap['Hair Care'] || catMap['Hair Styling'], serviceType: 'PARLOUR', price: 800, duration: 'Approx. 45 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Blow-dry styling, soft curls, or sleek straightening for parties and special occasions.' },
      { name: 'Hair Spa', category: catMap['Hair Care'] || catMap['Hair Styling'], serviceType: 'PARLOUR', price: 1500, duration: 'Approx. 1 hr', isFeatured: true, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Deep conditioning and nourishing hair spa massage to revive dry, damaged hair.' },
      { name: 'Bridal Hairstyling', category: catMap['Hair Care'] || catMap['Hair Styling'], serviceType: 'PARLOUR', price: 2500, duration: 'Approx. 1 hr', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Elaborate traditional or contemporary bridal bun, braid, and floral hair setting.' },
      { name: 'Party Hairstyling', category: catMap['Hair Care'] || catMap['Hair Styling'], serviceType: 'PARLOUR', price: 1000, duration: 'Approx. 45 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Trendy curls, waves, half-updos, and chic braids for party events.' },

      // --- BEAUTY PARLOUR / GROOMING (Sample) ---
      { name: 'Manicure', category: catMap['Beauty Parlour'] || catMap['Mani-Pedi'], serviceType: 'PARLOUR', price: 600, duration: 'Approx. 45 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Nail shaping, cuticle care, hand scrub, relaxing massage, and nail buffing.' },
      { name: 'Pedicure', category: catMap['Beauty Parlour'] || catMap['Mani-Pedi'], serviceType: 'PARLOUR', price: 800, duration: 'Approx. 50 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Foot soak, exfoliation, callus smoothing, relaxing massage, and nail polish.' },
      { name: 'Eyebrow Threading & Shaping', category: catMap['Beauty Parlour'] || catMap['Waxing & Threading'], serviceType: 'PARLOUR', price: 100, duration: 'Approx. 15 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Precise eyebrow shaping and threading for clean, well-defined arches.' },
      { name: 'Upper Lip Threading', category: catMap['Beauty Parlour'] || catMap['Waxing & Threading'], serviceType: 'PARLOUR', price: 60, duration: 'Approx. 10 mins', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1512290903829-e5870020db1e?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Quick and hygienic upper lip hair removal for smooth skin.' },
      { name: 'Full Body Waxing', category: catMap['Beauty Parlour'] || catMap['Waxing & Threading'], serviceType: 'PARLOUR', price: 2000, duration: 'Approx. 1.5 hrs', isFeatured: false, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'Full arms, legs, and body waxing using gentle skin-friendly wax.' },
      { name: 'Basic Beauty Package', category: catMap['Beauty Parlour'] || catMap['Waxing & Threading'], serviceType: 'PARLOUR', price: 2500, duration: 'Approx. 2 hrs', isFeatured: true, isSample: true, images: [{ url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=1000&fit=crop&auto=format&q=80' }], description: 'All-in-one grooming combo including basic facial, threading, and waxing.' },
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
     6.5 SERVICE GROUPS & LOCATIONS
     ══════════════════════════════ */
  const existingGroups = await ServiceGroup.countDocuments();
  let groups = [];
  if (existingGroups === 0) {
    const defaultGroups = [
      { name: 'Bridal Mehendi', slug: 'bridal-mehendi', parentType: 'MEHENDI', shortDescription: 'Exquisite bridal henna designs for your special day', displayOrder: 1, isFeatured: true },
      { name: 'Arabic Mehendi', slug: 'arabic-mehendi', parentType: 'MEHENDI', shortDescription: 'Bold floral and geometric Arabic patterns', displayOrder: 2, isFeatured: true },
      { name: 'Traditional Mehendi', slug: 'traditional-mehendi', parentType: 'MEHENDI', shortDescription: 'Classic Indian henna with intricate traditional motifs', displayOrder: 3 },
      { name: 'Bridal Makeup', slug: 'bridal-makeup', parentType: 'MAKEUP', shortDescription: 'Complete bridal makeup and styling packages', displayOrder: 1, isFeatured: true },
      { name: 'Party Makeup', slug: 'party-makeup', parentType: 'MAKEUP', shortDescription: 'Glamorous makeup for occasions and celebrations', displayOrder: 2 },
      { name: 'Skin Care', slug: 'skin-care', parentType: 'PARLOUR', shortDescription: 'Professional skin treatments and facials', displayOrder: 1 },
      { name: 'Hair Care', slug: 'hair-care', parentType: 'PARLOUR', shortDescription: 'Hair styling, treatment and grooming services', displayOrder: 2 },
    ];
    groups = await ServiceGroup.insertMany(defaultGroups);
    console.log('✓ Default service groups seeded');
  } else {
    groups = await ServiceGroup.find();
    console.log('→ Service groups already exist');
  }

  const existingLocations = await Location.countDocuments();
  if (existingLocations === 0) {
    const groupIds = groups.map(g => g._id);
    const defaultLocations = [
      { name: 'Lucknow', slug: 'lucknow', shortDescription: 'Premium mehendi & beauty services in Lucknow', seoTitle: 'Best Mehendi Artist in Lucknow | Huma Mehendi', seoDescription: 'Looking for the best mehendi artist in Lucknow? Huma Mehendi offers professional bridal mehendi, Arabic henna, makeup & beauty services in Gomti Nagar, Hazratganj, Aminabad & across Lucknow.', seoKeywords: 'mehendi artist lucknow, best mehendi lucknow, bridal mehendi lucknow, wedding mehendi lucknow, henna artist lucknow', nearbyAreas: ['Gomti Nagar', 'Hazratganj', 'Aminabad', 'Alambagh', 'Indira Nagar', 'Aliganj'], availableServiceGroups: groupIds, displayOrder: 1 },
      { name: 'Kanpur', slug: 'kanpur', shortDescription: 'Professional mehendi & beauty services in Kanpur', seoTitle: 'Best Mehendi Artist in Kanpur | Huma Mehendi', seoDescription: 'Professional mehendi artist in Kanpur offering bridal mehendi, Arabic designs, makeup & beauty services in Civil Lines, Swaroop Nagar & across Kanpur.', seoKeywords: 'mehendi artist kanpur, best mehendi kanpur, bridal mehendi kanpur, henna artist kanpur', nearbyAreas: ['Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar', 'Kakadeo'], availableServiceGroups: groupIds, displayOrder: 2 },
      { name: 'Raebareli', slug: 'raebareli', shortDescription: 'Expert mehendi & beauty artistry in Raebareli', seoTitle: 'Best Mehendi Artist in Raebareli | Huma Mehendi', seoDescription: 'Top mehendi artist in Raebareli providing bridal henna, Arabic mehendi, makeup & parlour services. Serving Raebareli city and nearby areas.', seoKeywords: 'mehendi artist raebareli, best mehendi raebareli, bridal mehendi raebareli, henna artist raebareli', nearbyAreas: ['City Center', 'Station Road', 'Civil Lines'], availableServiceGroups: groupIds, displayOrder: 3 },
      { name: 'Bachhrawan', slug: 'bachhrawan', shortDescription: 'Mehendi & beauty services in Bachhrawan, Raebareli', seoTitle: 'Mehendi Artist in Bachhrawan | Huma Mehendi', seoDescription: 'Professional mehendi and beauty services in Bachhrawan, Raebareli. Bridal mehendi, Arabic henna designs, makeup & parlour services available.', seoKeywords: 'mehendi artist bachhrawan, mehendi bachhrawan raebareli, bridal mehendi bachhrawan', nearbyAreas: ['Raebareli', 'Lalganj'], availableServiceGroups: groupIds, displayOrder: 4 },
      { name: 'Lalganj', slug: 'lalganj', shortDescription: 'Beautiful mehendi artistry in Lalganj, Raebareli', seoTitle: 'Mehendi Artist in Lalganj | Huma Mehendi', seoDescription: 'Expert mehendi artist in Lalganj, Raebareli offering bridal henna, Arabic designs, makeup & beauty services for weddings and occasions.', seoKeywords: 'mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj', nearbyAreas: ['Raebareli', 'Bachhrawan'], availableServiceGroups: groupIds, displayOrder: 5 },
      { name: 'Fatehpur', slug: 'fatehpur', shortDescription: 'Professional mehendi & beauty services in Fatehpur', seoTitle: 'Best Mehendi Artist in Fatehpur | Huma Mehendi', seoDescription: 'Professional mehendi artist in Fatehpur, Uttar Pradesh. Bridal mehendi, Arabic henna, makeup & beauty services for weddings and special occasions.', seoKeywords: 'mehendi artist fatehpur, best mehendi fatehpur, bridal mehendi fatehpur, henna artist fatehpur', nearbyAreas: ['Bindki', 'Khaga'], availableServiceGroups: groupIds, displayOrder: 6 },
      { name: 'Sandila, Hardoi', slug: 'sandila', shortDescription: 'Mehendi & beauty services in Sandila, Hardoi (near Lucknow)', seoTitle: 'Mehendi Artist in Sandila, Hardoi | Huma Mehendi', seoDescription: 'Expert mehendi artist in Sandila, Hardoi district near Lucknow. Professional bridal mehendi, Arabic henna designs, makeup & beauty services available.', seoKeywords: 'mehendi artist sandila, mehendi sandila hardoi, bridal mehendi sandila, henna artist sandila near lucknow', nearbyAreas: ['Hardoi', 'Lucknow', 'Shahjahanpur'], availableServiceGroups: groupIds, displayOrder: 7 },
    ];
    await Location.insertMany(defaultLocations);
    console.log('✓ Default locations seeded');
  } else {
    console.log('→ Locations already exist');
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
