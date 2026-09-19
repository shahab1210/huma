/**
 * Bulk Import Designs from Google Drive -> Cloudinary -> MongoDB
 *
 * Usage:
 *   Dry-run (validation only, zero writes):
 *     npm run import:designs -- --dry-run
 *
 *   Live Import:
 *     npm run import:designs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Category = require('../models/Category');
const ServiceGroup = require('../models/ServiceGroup');
const Design = require('../models/Design');
const { uploadImage, isCloudinaryConfigured, cloudinary } = require('../utils/cloudinaryService');

// Verified inventory of 32 designs across 3 main categories
const INVENTORY = [
  // 1. Bridal Mehendi - ₹3999 (9 files)
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1-sEAcWphFqh-zGLfs-R2_ZFK6-ftb0Em',
    name: 'Bridal Mehendi - Classic Elegance 01',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1-Tl1yCARYZ6t7un1SX0GI4sobQX3wam5',
    name: 'Bridal Mehendi - Classic Elegance 02',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1PzHW_hechwRuRYz9EdwpsDOP1AOEJMix',
    name: 'Bridal Mehendi - Classic Elegance 03',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1Q_sZDpv4Au-F-IFhB7Ks5t-x0_hMa0Zy',
    name: 'Bridal Mehendi - Classic Elegance 04',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1ezlDd_cnN25t9DQ93ArPQkNZHFktfWSA',
    name: 'Bridal Mehendi - Classic Elegance 05',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1YfDcde8kTOkvwgkN7LDqbRcTlBk_R5OZ',
    name: 'Bridal Mehendi - Classic Elegance 06',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1eVZvZBnr18xcNcBGrKPbTr3x0wDtQHgW',
    name: 'Bridal Mehendi - Classic Elegance 07',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1JFMmQnPz_cFam2L5I5TLZS3jBv7mfdWD',
    name: 'Bridal Mehendi - Classic Elegance 08',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 3999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1dP9AqzV35ZrAETVf9lWRdcZW6tEhnEhE',
    name: 'Bridal Mehendi - Classic Elegance 09',
  },

  // 2. Bridal Mehendi - ₹4999 (13 files)
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '127MlgvKYX7GmdRZ-cN1QADB6gRIUoUyo',
    name: 'Bridal Mehendi - Royal Grandeur 01',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1Ss4xmMiENQgzuQyjDNwMP6ldZWjAH5f2',
    name: 'Bridal Mehendi - Royal Grandeur 02',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1GPyd2My7RSlHg0RmCX8a7TmVRDRr4K5t',
    name: 'Bridal Mehendi - Royal Grandeur 03',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1Qey220bp1u7j1pLpZH5unMR2JiUEjClV',
    name: 'Bridal Mehendi - Royal Grandeur 04',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1ZW7lc5tselZgRuDDhGViUOihUVMDBooJ',
    name: 'Bridal Mehendi - Royal Grandeur 05',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1OqUe250i2AxV8DtLBBhl5PRsxTVhBPPD',
    name: 'Bridal Mehendi - Royal Grandeur 06',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1nLtcpjiuLeOTidWDRTsD52somiQNYQqw',
    name: 'Bridal Mehendi - Royal Grandeur 07',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1-1S7RB8cx_TwY6pQWHC28qGQypyiwC45',
    name: 'Bridal Mehendi - Royal Grandeur 08',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1CLGJEgAogxWr2oOM1mKKWife064zEcoz',
    name: 'Bridal Mehendi - Royal Grandeur 09',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1viFOsSzsXnxFdv0y58j0cZlvEpyOba3d',
    name: 'Bridal Mehendi - Royal Grandeur 10',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1NdC3EnnTRd9pRN8DtL88ruRTMAvHqqvU',
    name: 'Bridal Mehendi - Royal Grandeur 11',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1Ln_RoaWCaoaDOzdE7qqMxZzJyXE0zXXX',
    name: 'Bridal Mehendi - Royal Grandeur 12',
  },
  {
    categoryName: 'Bridal Mehendi',
    serviceGroupSlug: 'bridal-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d45',
    price: 4999,
    cloudinaryFolder: 'huma_mehendi/designs/bridal',
    fileId: '1bv36uhIzeQ7QmPyGJpra-m5cNLzrp6W3',
    name: 'Bridal Mehendi - Royal Grandeur 13',
  },

  // 3. Arabic Mehendi - ₹350 (5 files)
  {
    categoryName: 'Arabic Mehendi',
    serviceGroupSlug: 'arabic-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d46',
    price: 350,
    cloudinaryFolder: 'huma_mehendi/designs/arabic',
    fileId: '1iexOJLmF0RzGE9ZNZH7JhSqSiSkhw3O_',
    name: 'Arabic Floral Trail 01',
  },
  {
    categoryName: 'Arabic Mehendi',
    serviceGroupSlug: 'arabic-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d46',
    price: 350,
    cloudinaryFolder: 'huma_mehendi/designs/arabic',
    fileId: '1aMTbk_xrpgF2zvJMac4KWLm_-A1P-jKH',
    name: 'Arabic Floral Trail 02',
  },
  {
    categoryName: 'Arabic Mehendi',
    serviceGroupSlug: 'arabic-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d46',
    price: 350,
    cloudinaryFolder: 'huma_mehendi/designs/arabic',
    fileId: '1EohgchwVe0mteKyG5weQrtVUZ64SK4My',
    name: 'Arabic Floral Trail 03',
  },
  {
    categoryName: 'Arabic Mehendi',
    serviceGroupSlug: 'arabic-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d46',
    price: 350,
    cloudinaryFolder: 'huma_mehendi/designs/arabic',
    fileId: '1b1vS300iroyUtJhw0U0s3RQwxxQ8zMB0',
    name: 'Arabic Floral Trail 04',
  },
  {
    categoryName: 'Arabic Mehendi',
    serviceGroupSlug: 'arabic-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d46',
    price: 350,
    cloudinaryFolder: 'huma_mehendi/designs/arabic',
    fileId: '1GFF0ES_8K5tmZZnL9msA_j5-OG9Sge_v',
    name: 'Arabic Floral Trail 05',
  },

  // 4. Rajasthani Royal Mehendi Design - ₹599 (5 files)
  {
    categoryName: 'Rajasthani Royal Mehendi Design',
    serviceGroupSlug: 'traditional-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d47',
    price: 599,
    cloudinaryFolder: 'huma_mehendi/designs/rajasthani',
    fileId: '1I9ePKSpExOz-jrI5UrkOc3yZgmNeYpg2',
    name: 'Rajasthani Royal Heritage 01',
  },
  {
    categoryName: 'Rajasthani Royal Mehendi Design',
    serviceGroupSlug: 'traditional-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d47',
    price: 599,
    cloudinaryFolder: 'huma_mehendi/designs/rajasthani',
    fileId: '1QmIVfg2nXv-shHuaWW8opM_buK3oFVO9',
    name: 'Rajasthani Royal Heritage 02',
  },
  {
    categoryName: 'Rajasthani Royal Mehendi Design',
    serviceGroupSlug: 'traditional-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d47',
    price: 599,
    cloudinaryFolder: 'huma_mehendi/designs/rajasthani',
    fileId: '1kgX4zjEf4VtMl7j3oQaAh1nPkcTq0ui7',
    name: 'Rajasthani Royal Heritage 03',
  },
  {
    categoryName: 'Rajasthani Royal Mehendi Design',
    serviceGroupSlug: 'traditional-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d47',
    price: 599,
    cloudinaryFolder: 'huma_mehendi/designs/rajasthani',
    fileId: '1MxiVpxfLTlJTvqjaLOP72uE93f9XfKWo',
    name: 'Rajasthani Royal Heritage 04',
  },
  {
    categoryName: 'Rajasthani Royal Mehendi Design',
    serviceGroupSlug: 'traditional-mehendi',
    expectedServiceGroupId: '6a9508c00b511bd6ac0a0d47',
    price: 599,
    cloudinaryFolder: 'huma_mehendi/designs/rajasthani',
    fileId: '1gxUauL6I7tC0pK-ElVHkAEdLRBJR4ABq',
    name: 'Rajasthani Royal Heritage 05',
  },
];

/**
 * Download an image file buffer from Google Drive and validate binary integrity.
 */
async function downloadFromDrive(fileId) {
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    maxRedirects: 5,
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  const buffer = Buffer.from(response.data);
  const contentType = (response.headers['content-type'] || '').toLowerCase();
  const sizeBytes = buffer.length;

  // 1. Minimum size check
  if (sizeBytes < 1000) {
    throw new Error(`Downloaded data too small (${sizeBytes} bytes). Possible error response.`);
  }

  // 2. HTML / error payload detection
  const headStr = buffer.slice(0, 200).toString('utf8').trim().toLowerCase();
  if (headStr.startsWith('<!doctype') || headStr.startsWith('<html') || headStr.includes('<title>google drive')) {
    throw new Error('Downloaded content is an HTML Drive page, not binary image data.');
  }

  // 3. Image Magic bytes check (JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: 52 49 46 46)
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!isJpeg && !isPng && !isWebp && !contentType.startsWith('image/')) {
    throw new Error(`Downloaded payload is not a valid image format (Header: ${buffer.slice(0, 8).toString('hex')})`);
  }

  return {
    buffer,
    contentType: contentType || 'image/jpeg',
    sizeBytes,
  };
}

/**
 * Validate Drive accessibility for dry-run.
 */
async function validateDriveAccess(fileId) {
  try {
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Range: 'bytes=0-1023', // Partial byte check to save bandwidth
      },
    });
    return {
      accessible: response.status >= 200 && response.status < 400,
      status: response.status,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
    };
  }
}

async function runImporter() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('===============================================================');
  console.log(`  Huma Mehendi — Design Bulk Importer [${isDryRun ? 'DRY-RUN MODE' : 'LIVE IMPORT'}]`);
  console.log('===============================================================\n');

  // 1. Cloudinary Config Check
  console.log('1. Checking Cloudinary Configuration:');
  const cloudinaryReady = isCloudinaryConfigured();
  console.log(`   - Cloudinary Configured: ${cloudinaryReady ? '✓ YES' : '✗ NO'}`);
  if (!cloudinaryReady) {
    console.error('✗ Error: Cloudinary is not configured in backend/.env');
    process.exit(1);
  }

  // 2. MongoDB Connection
  console.log('\n2. Connecting to MongoDB:');
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('✗ Error: MONGO_URI is missing in environment.');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('   ✓ Connected to MongoDB');

  // 3. Category Validation & Resolution
  console.log('\n3. Validating & Resolving Categories:');
  const requiredCategories = [
    'Bridal Mehendi',
    'Arabic Mehendi',
    'Rajasthani Royal Mehendi Design',
  ];

  const categoryMap = {};

  for (const catName of requiredCategories) {
    let catDoc = await Category.findOne({ name: catName });
    if (!catDoc) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Category "${catName}" does not exist yet -> Will be created on live import.`);
      } else {
        catDoc = await Category.create({
          name: catName,
          serviceType: 'MEHENDI',
          description: `${catName} collection for weddings, festivals and special occasions.`,
          isActive: true,
        });
        console.log(`   ✓ Created Category: "${catName}" (ID: ${catDoc._id})`);
      }
    } else {
      console.log(`   ✓ Category Found: "${catName}" (ID: ${catDoc._id})`);
    }
    if (catDoc) {
      categoryMap[catName] = catDoc._id;
    }
  }

  // 4. ServiceGroup Validation & Resolution
  console.log('\n4. Validating ServiceGroups:');
  const serviceGroupMap = {};
  const requiredServiceGroupSlugs = ['bridal-mehendi', 'arabic-mehendi', 'traditional-mehendi'];

  for (const slug of requiredServiceGroupSlugs) {
    const sg = await ServiceGroup.findOne({ slug });
    if (!sg) {
      console.error(`✗ Error: Required ServiceGroup with slug "${slug}" was not found in MongoDB!`);
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`   ✓ ServiceGroup Found: "${sg.name}" (Slug: ${sg.slug}, ID: ${sg._id})`);
    serviceGroupMap[slug] = sg._id;
  }

  // 5. Processing Inventory Items
  console.log(`\n5. Processing ${INVENTORY.length} Inventory Items:`);
  console.log('---------------------------------------------------------------');

  let alreadyExistingCount = 0;
  let toProcessCount = 0;
  let successfulUploadCount = 0;
  let successfulInsertCount = 0;
  let failedCount = 0;

  for (let i = 0; i < INVENTORY.length; i++) {
    const item = INVENTORY[i];
    const trackingId = `gdrive_${item.fileId}`;
    const cloudinaryPublicId = `${item.cloudinaryFolder}/${trackingId}`;

    // Check existing in MongoDB
    const existingDesign = await Design.findOne({ 'images.publicId': trackingId });

    if (existingDesign) {
      alreadyExistingCount++;
      console.log(`[${i + 1}/${INVENTORY.length}] (EXISTS) "${item.name}" -> Already in DB (ID: ${existingDesign._id})`);
      continue;
    }

    toProcessCount++;

    if (isDryRun) {
      // Validate Drive Download Accessibility in Dry Run
      const driveStatus = await validateDriveAccess(item.fileId);
      console.log(`[${i + 1}/${INVENTORY.length}] [DRY-RUN] "${item.name}"`);
      console.log(`    - Category:     ${item.categoryName}`);
      console.log(`    - Price:        ₹${item.price}`);
      console.log(`    - ServiceGroup: ${item.serviceGroupSlug} (${serviceGroupMap[item.serviceGroupSlug] || 'Pending'})`);
      console.log(`    - Drive File:   ${item.fileId} (${driveStatus.accessible ? '✓ Reachable' : '✗ Failed: ' + driveStatus.error})`);
      console.log(`    - Cloudinary:   ${cloudinaryPublicId}`);
      console.log(`    - DB Action:    Would create Design with publicId="${trackingId}"`);
    } else {
      // Live Import
      try {
        console.log(`[${i + 1}/${INVENTORY.length}] Downloading from Drive: ${item.name} (${item.fileId})...`);
        const { buffer, sizeBytes } = await downloadFromDrive(item.fileId);
        console.log(`    ✓ Downloaded ${sizeBytes} bytes. Uploading to Cloudinary (${cloudinaryPublicId})...`);

        const uploadResult = await uploadImage(buffer, {
          folder: item.cloudinaryFolder,
          public_id: trackingId,
          overwrite: false,
          tags: ['huma_mehendi', 'catalog_design', item.categoryName.toLowerCase().replace(/\s+/g, '_')],
        });

        if (!uploadResult || !uploadResult.secure_url) {
          throw new Error('Cloudinary upload returned no secure_url.');
        }

        successfulUploadCount++;
        console.log(`    ✓ Cloudinary upload OK: ${uploadResult.secure_url}`);

        // Insert into MongoDB
        const newDesign = await Design.create({
          name: item.name,
          category: categoryMap[item.categoryName],
          price: item.price,
          startingPrice: item.price,
          isAvailable: true,
          customizationAvailable: true,
          isFeatured: false,
          serviceGroups: [serviceGroupMap[item.serviceGroupSlug]],
          images: [
            {
              url: uploadResult.secure_url,
              publicId: trackingId,
            },
          ],
        });

        successfulInsertCount++;
        console.log(`    ✓ MongoDB Design created: ${newDesign.name} (ID: ${newDesign._id})\n`);
      } catch (err) {
        failedCount++;
        console.error(`    ✗ Error processing "${item.name}":`, err.message || err);
      }
    }
  }

  // 6. Summary Report
  console.log('\n===============================================================');
  console.log(`  IMPORT SUMMARY [${isDryRun ? 'DRY-RUN' : 'LIVE'}]`);
  console.log('===============================================================');
  console.log(`Total Inventory Items:       ${INVENTORY.length}`);
  console.log(`Already in Database (Skip):  ${alreadyExistingCount}`);
  console.log(`Items To Process:            ${toProcessCount}`);

  if (isDryRun) {
    console.log(`Cloudinary Uploads Executed: 0 (DRY-RUN - Zero network uploads)`);
    console.log(`MongoDB Writes Executed:     0 (DRY-RUN - Zero database writes)`);
    console.log('\n✓ Dry-run completed successfully with ZERO modifications.');
  } else {
    console.log(`Cloudinary Uploads Succeeded: ${successfulUploadCount}`);
    console.log(`MongoDB Designs Created:      ${successfulInsertCount}`);
    console.log(`Failed Items:                 ${failedCount}`);
    console.log('\n✓ Live import completed.');
  }
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runImporter().catch((err) => {
  console.error('Fatal Importer Error:', err);
  process.exit(1);
});
