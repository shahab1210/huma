require('dotenv').config();
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
        shortDescription: 'Premium mehendi & beauty services in Lucknow',
        seoTitle: 'Best Mehendi Artist in Lucknow | Huma Mehendi',
        seoDescription: 'Looking for the best mehendi artist in Lucknow? Huma Mehendi offers professional bridal mehendi, Arabic henna, makeup & beauty services in Gomti Nagar, Hazratganj, Aminabad & across Lucknow.',
        seoKeywords: 'mehendi artist lucknow, best mehendi lucknow, bridal mehendi lucknow, wedding mehendi lucknow, henna artist lucknow',
        nearbyAreas: ['Gomti Nagar', 'Hazratganj', 'Aminabad', 'Alambagh', 'Indira Nagar', 'Aliganj'],
        displayOrder: 1,
      },
      {
        name: 'Kanpur',
        slug: 'kanpur',
        shortDescription: 'Professional mehendi & beauty services in Kanpur',
        seoTitle: 'Best Mehendi Artist in Kanpur | Huma Mehendi',
        seoDescription: 'Professional mehendi artist in Kanpur offering bridal mehendi, Arabic designs, makeup & beauty services in Civil Lines, Swaroop Nagar & across Kanpur.',
        seoKeywords: 'mehendi artist kanpur, best mehendi kanpur, bridal mehendi kanpur, henna artist kanpur',
        nearbyAreas: ['Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar', 'Kakadeo'],
        displayOrder: 2,
      },
      {
        name: 'Raebareli',
        slug: 'raebareli',
        shortDescription: 'Expert mehendi & beauty artistry in Raebareli',
        seoTitle: 'Best Mehendi Artist in Raebareli | Huma Mehendi',
        seoDescription: 'Top mehendi artist in Raebareli providing bridal henna, Arabic mehendi, makeup & parlour services. Serving Raebareli city and nearby areas.',
        seoKeywords: 'mehendi artist raebareli, best mehendi raebareli, bridal mehendi raebareli, henna artist raebareli',
        nearbyAreas: ['City Center', 'Station Road', 'Civil Lines'],
        displayOrder: 3,
      },
      {
        name: 'Bachhrawan',
        slug: 'bachhrawan',
        shortDescription: 'Mehendi & beauty services in Bachhrawan, Raebareli',
        seoTitle: 'Mehendi Artist in Bachhrawan | Huma Mehendi',
        seoDescription: 'Professional mehendi and beauty services in Bachhrawan, Raebareli. Bridal mehendi, Arabic henna designs, makeup & parlour services available.',
        seoKeywords: 'mehendi artist bachhrawan, mehendi bachhrawan raebareli, bridal mehendi bachhrawan',
        nearbyAreas: ['Raebareli', 'Lalganj'],
        displayOrder: 4,
      },
      {
        name: 'Lalganj',
        slug: 'lalganj',
        shortDescription: 'Beautiful mehendi artistry in Lalganj, Raebareli',
        seoTitle: 'Mehendi Artist in Lalganj | Huma Mehendi',
        seoDescription: 'Expert mehendi artist in Lalganj, Raebareli offering bridal henna, Arabic designs, makeup & beauty services for weddings and occasions.',
        seoKeywords: 'mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj',
        nearbyAreas: ['Raebareli', 'Bachhrawan'],
        displayOrder: 5,
      },
      {
        name: 'Fatehpur',
        slug: 'fatehpur',
        shortDescription: 'Professional mehendi & beauty services in Fatehpur',
        seoTitle: 'Best Mehendi Artist in Fatehpur | Huma Mehendi',
        seoDescription: 'Professional mehendi artist in Fatehpur, Uttar Pradesh. Bridal mehendi, Arabic henna, makeup & beauty services for weddings and special occasions.',
        seoKeywords: 'mehendi artist fatehpur, best mehendi fatehpur, bridal mehendi fatehpur, henna artist fatehpur',
        nearbyAreas: ['Bindki', 'Khaga'],
        displayOrder: 6,
      },
      {
        name: 'Sandila',
        slug: 'sandila',
        shortDescription: 'Mehendi & beauty services in Sandila, Hardoi (near Lucknow)',
        seoTitle: 'Mehendi Artist in Sandila, Hardoi | Huma Mehendi',
        seoDescription: 'Expert mehendi artist in Sandila, Hardoi district near Lucknow. Professional bridal mehendi, Arabic henna designs, makeup & beauty services available.',
        seoKeywords: 'mehendi artist sandila, mehendi sandila hardoi, bridal mehendi sandila, henna artist sandila near lucknow',
        nearbyAreas: ['Hardoi', 'Lucknow', 'Shahjahanpur'],
        displayOrder: 7,
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
