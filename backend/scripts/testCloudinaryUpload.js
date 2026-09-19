/**
 * Cloudinary Connection & Upload Test Script
 *
 * Verifies that the Cloudinary SDK is correctly configured and able to
 * upload images to the Cloudinary Media Library without touching MongoDB
 * or any production catalog designs.
 *
 * Usage: npm run test:cloudinary
 */

require('dotenv').config();
const { uploadImage, isCloudinaryConfigured } = require('../utils/cloudinaryService');

async function runTest() {
  console.log('==================================================');
  console.log('  Cloudinary Connection & Upload Test');
  console.log('==================================================\n');

  // 1. Verify Environment Variables
  const cloudNamePresent = !!process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME.trim().length > 0;
  const apiKeyPresent = !!process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.trim().length > 0;
  const apiSecretPresent = !!process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.trim().length > 0;

  console.log('Environment Variables Check:');
  console.log(`  - CLOUDINARY_CLOUD_NAME: ${cloudNamePresent ? '✓ Present' : '✗ Missing'}`);
  console.log(`  - CLOUDINARY_API_KEY:    ${apiKeyPresent ? '✓ Present' : '✗ Missing'}`);
  console.log(`  - CLOUDINARY_API_SECRET: ${apiSecretPresent ? '✓ Present' : '✗ Missing'}`);

  if (!isCloudinaryConfigured()) {
    console.error('\n✗ Error: Missing Cloudinary credentials. Please verify your backend/.env file.');
    process.exit(1);
  }

  console.log('\n2. Preparing 1x1 test image buffer (in-memory PNG)...');
  // 1x1 pixel PNG Base64 data URI
  const tinyTestPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const testOptions = {
    folder: 'huma_mehendi/test',
    public_id: 'cloudinary_connection_test',
    overwrite: true,
    tags: ['huma_mehendi', 'test_asset'],
  };

  console.log('3. Uploading test asset to Cloudinary...');
  console.log(`   Destination Folder: ${testOptions.folder}`);
  console.log(`   Target Public ID:   ${testOptions.folder}/${testOptions.public_id}`);

  try {
    const result = await uploadImage(tinyTestPng, testOptions);

    console.log('\n==================================================');
    console.log('✓ Cloudinary Upload Successful!');
    console.log('==================================================');
    console.log(`  - Public ID:     ${result.public_id}`);
    console.log(`  - Secure URL:    ${result.secure_url}`);
    console.log(`  - Resource Type: ${result.resource_type}`);
    console.log(`  - Format:        ${result.format}`);
    console.log(`  - Dimensions:    ${result.width}x${result.height} px`);
    console.log(`  - Size:          ${result.bytes} bytes`);
    console.log('\nDatabase Safety Confirmation:');
    console.log('  - MongoDB touched: NO (zero database operations performed)');
    console.log('  - Production catalog touched: NO');
    console.log('==================================================\n');
  } catch (error) {
    console.error('\n✗ Cloudinary Upload Failed:');
    console.error('  Message:', error.message || error);
    process.exit(1);
  }
}

runTest();
