const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Location = require('../models/Location');
const ServiceGroup = require('../models/ServiceGroup');

const syncLocations = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting Location SEO synchronization to MongoDB...\n');

    // Remove legacy slug duplicate if present
    await Location.deleteMany({ slug: 'lalganj-raebareli' });

    // Fetch existing service group IDs for linking if available
    const groups = await ServiceGroup.find({}, '_id');
    const groupIds = groups.map(g => g._id);

    const locationsToSync = [
      {
        name: 'Lucknow',
        slug: 'lucknow',
        shortDescription: 'Bridal mehendi, bespoke Arabic henna, and occasion styling delivered directly to your doorstep across Lucknow.',
        description: `Huma Mehendi provides bridal mehendi and beauty services delivered to your doorstep across Lucknow, including Gomti Nagar, Hazratganj, Alambagh, and Indira Nagar. From detailed bridal artwork to contemporary Arabic floral patterns, our services are customized for weddings, engagements, and special occasions. Each design is applied with precision to complement your celebratory attire.\n\nWe offer dedicated Home Visit appointments throughout Lucknow, allowing brides and family members to receive services comfortably at home or their event venue. Browse our online collection of bridal and occasion designs, or book an appointment using your own custom design. Secure your preferred date through our online advance reservation for organized, punctual service on your special day.`,
        seoTitle: 'Best Mehendi Artist in Lucknow | Huma Mehendi',
        seoDescription: 'Book professional mehendi artist services in Lucknow with Huma Mehendi. Bridal henna, Arabic designs, makeup & parlour services delivered to your home.',
        seoKeywords: 'mehendi artist lucknow, best mehendi lucknow, bridal mehendi lucknow, wedding mehendi lucknow, henna artist lucknow, home visit mehendi lucknow',
        nearbyAreas: ['Gomti Nagar', 'Hazratganj', 'Aminabad', 'Alambagh', 'Indira Nagar', 'Aliganj'],
        displayOrder: 1,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 2999,
        homeVisitFee: 0,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: false,
      },
      {
        name: 'Kanpur',
        slug: 'kanpur',
        shortDescription: 'Bridal henna designs, Arabic patterns, and occasion beauty services with home visits across Kanpur.',
        description: `Huma Mehendi provides henna artistry and occasion beauty services across Kanpur, including Civil Lines, Swaroop Nagar, Kidwai Nagar, and Kakadeo. We offer comprehensive bridal mehendi, traditional motifs, shaded florals, and modern patterns for engagement ceremonies and wedding celebrations. Each design is tailored to the preferences and style of the client.\n\nOur Home Visit service brings mehendi and beauty services directly to your residence or venue in Kanpur. Whether booking full bridal application or occasion henna for family members, you can explore designs online or book with your own design image. Confirm your date with a secure online advance payment for reliable scheduling.`,
        seoTitle: 'Best Mehendi Artist in Kanpur | Huma Mehendi',
        seoDescription: 'Looking for a mehendi artist in Kanpur? Huma Mehendi offers bridal henna, Arabic designs, makeup & beauty services delivered through home visits.',
        seoKeywords: 'mehendi artist kanpur, best mehendi kanpur, bridal mehendi kanpur, henna artist kanpur, home visit mehendi kanpur, mehendi designs kanpur',
        nearbyAreas: ['Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar', 'Kakadeo'],
        displayOrder: 2,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 2999,
        homeVisitFee: 0,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: false,
      },
      {
        name: 'Raebareli',
        slug: 'raebareli',
        shortDescription: 'Bridal mehendi, festive henna patterns, and complete makeover services at your doorstep across Raebareli.',
        description: `Huma Mehendi offers mehendi and bridal beauty services throughout Raebareli, including Civil Lines, Station Road, and surrounding localities. Our work ranges from full bridal coverage to lightweight Arabic and geometric patterns suitable for sangeet nights, receptions, and festive celebrations. Every design is drawn with attention to symmetry and clean detailing.\n\nAll services in Raebareli are provided through our Home Visit booking service. Our artist travels directly to your home address, helping you save time and prepare comfortably for your event. You can easily view our design catalog online, request appointments for custom designs, and confirm your booking date with an online advance deposit.`,
        seoTitle: 'Best Mehendi Artist in Raebareli | Huma Mehendi',
        seoDescription: 'Professional mehendi artist in Raebareli. Huma Mehendi provides bridal mehendi, Arabic henna designs, makeup & parlour packages with convenient home visits.',
        seoKeywords: 'mehendi artist raebareli, best mehendi raebareli, bridal mehendi raebareli, henna artist raebareli, home visit mehendi raebareli',
        nearbyAreas: ['City Center', 'Station Road', 'Civil Lines'],
        displayOrder: 3,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 2999,
        homeVisitFee: 0,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: false,
      },
      {
        name: 'Bachhrawan',
        slug: 'bachhrawan',
        shortDescription: 'Bridal mehendi, Arabic henna art, and grooming packages with doorstep service across Bachhrawan.',
        description: `Huma Mehendi offers mehendi and beauty services in Bachhrawan and nearby connecting areas of Raebareli district. We provide bridal mehendi with traditional patterns, as well as Arabic henna for family members and festive celebrations. Each design is crafted with attention to detail to suit your event.\n\nOur Home Visit service allows clients in Bachhrawan to receive mehendi services comfortably at home. Browse our online collection, select your preferred bridal or occasion package, or book using your own custom design reference. Confirm your appointment online with an advance booking for prompt and organized service on your event day.`,
        seoTitle: 'Mehendi Artist in Bachhrawan | Huma Mehendi',
        seoDescription: 'Book a mehendi artist in Bachhrawan with Huma Mehendi. Bridal henna, Arabic designs, makeup & parlour services delivered directly to your doorstep.',
        seoKeywords: 'mehendi artist bachhrawan, mehendi bachhrawan raebareli, bridal mehendi bachhrawan, henna artist bachhrawan, home visit mehendi bachhrawan',
        nearbyAreas: ['Raebareli', 'Lalganj'],
        displayOrder: 4,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 2999,
        homeVisitFee: 0,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: false,
      },
      {
        name: 'Lalganj',
        slug: 'lalganj',
        shortDescription: 'Professional bridal mehendi and occasion henna artistry in Lalganj with Home Visit and Visit the Artist booking options.',
        description: `Huma Mehendi provides mehendi and bridal beauty services across Lalganj and nearby areas in Raebareli. Specializing in intricate bridal patterns, delicate Arabic designs, and festive henna, our artistry is tailored for weddings, engagements, and special family celebrations. Every design is crafted with care to ensure elegant presentation for your occasion.\n\nFor clients in Lalganj, booking is flexible. You can choose a Home Visit appointment where the artist travels directly to your address, or select Visit the Artist to receive your service locally. Explore our catalog of mehendi designs, or book an appointment with your own custom design reference. With straightforward online booking and advance confirmation, planning your mehendi in Lalganj is simple and dependable.`,
        seoTitle: 'Mehendi Artist in Lalganj | Huma Mehendi',
        seoDescription: 'Looking for a professional mehendi artist in Lalganj, Raebareli? Huma Mehendi offers bridal henna, Arabic patterns, makeup & parlour services with home visits.',
        seoKeywords: 'mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj, henna artist lalganj, home visit mehendi lalganj',
        nearbyAreas: ['Raebareli', 'Bachhrawan'],
        displayOrder: 5,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 999,
        homeVisitFee: 399,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: true,
        artistVisitMinimumAmount: 2999,
      },
      {
        name: 'Fatehpur',
        slug: 'fatehpur',
        shortDescription: 'Bridal henna art, Arabic designs, and beauty packages delivered to your home across Fatehpur.',
        description: `Huma Mehendi provides henna application and bridal makeover services across Fatehpur, including Bindki, Khaga, and nearby areas. Our services cover bridal mehendi with detailed motifs, floral mandalas, and Arabic trails suitable for engagements, sangeet functions, and festival gatherings. Each pattern is carefully drawn to match your occasion requirements.\n\nWith our Home Visit service, an artist travels directly to your home in Fatehpur, providing convenient on-site application. You can view our design catalog, compare options, or upload your own preferred design for booking. Reserve your appointment online with an advance deposit for organized and timely service.`,
        seoTitle: 'Best Mehendi Artist in Fatehpur | Huma Mehendi',
        seoDescription: 'Professional mehendi artist in Fatehpur. Huma Mehendi delivers intricate bridal mehendi, Arabic henna, makeup & beauty services right to your doorstep.',
        seoKeywords: 'mehendi artist fatehpur, best mehendi fatehpur, bridal mehendi fatehpur, henna artist fatehpur, home visit mehendi fatehpur',
        nearbyAreas: ['Bindki', 'Khaga'],
        displayOrder: 6,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 2999,
        homeVisitFee: 0,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: false,
      },
      {
        name: 'Sandila',
        slug: 'sandila',
        shortDescription: 'Bridal mehendi and beauty services in Sandila, Hardoi with both Home Visit and Visit the Artist booking options.',
        description: `Huma Mehendi offers bridal henna, festive patterns, and parlour grooming services for clients in Sandila and surrounding areas of Hardoi district. Our designs include traditional bridal cuffs, paisley motifs, and contemporary Arabic patterns suitable for weddings, parties, and festive occasions. We focus on clean lines and balanced compositions for every client.\n\nClients in Sandila can choose between Home Visit appointments at their doorstep or selecting Visit the Artist to receive services locally. You can review available packages, check starting prices, or schedule an appointment with your own custom design. Confirm your booking online with an advance deposit for dependable service.`,
        seoTitle: 'Mehendi Artist in Sandila, Hardoi | Huma Mehendi',
        seoDescription: 'Mehendi artist in Sandila, Hardoi. Huma Mehendi provides bridal henna, Arabic designs, makeup & parlour services with Home Visit and Visit the Artist options.',
        seoKeywords: 'mehendi artist sandila, mehendi sandila hardoi, bridal mehendi sandila, henna artist sandila, home visit mehendi sandila',
        nearbyAreas: ['Hardoi', 'Lucknow', 'Shahjahanpur'],
        displayOrder: 7,
        minimumBookingAmount: 2999,
        homeVisitEnabled: true,
        homeVisitMinimumAmount: 999,
        homeVisitFee: 399,
        homeVisitFreeThreshold: 2999,
        artistVisitEnabled: true,
        artistVisitMinimumAmount: 2999,
      },
    ];

    for (const locData of locationsToSync) {
      await Location.findOneAndUpdate(
        { slug: locData.slug },
        {
          $set: {
            ...locData,
            isActive: true,
          },
          $setOnInsert: {
            availableServiceGroups: groupIds,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`✓ Synchronized location: ${locData.name} (${locData.slug})`);
    }

    const allSynced = await Location.find({ isActive: true }).select('name slug seoTitle seoDescription seoKeywords');
    console.log(`\n🎉 Successfully synchronized ${allSynced.length} location documents in MongoDB!`);

    process.exit(0);
  } catch (err) {
    console.error('✕ Failed location sync:', err);
    process.exit(1);
  }
};

syncLocations();
