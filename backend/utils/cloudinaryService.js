const cloudinary = require('cloudinary').v2;

/**
 * Check if Cloudinary is configured with required environment variables.
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return !!(
    cloudName &&
    cloudName.trim().length > 0 &&
    apiKey &&
    apiKey.trim().length > 0 &&
    apiSecret &&
    apiSecret.trim().length > 0
  );
};

// Configure Cloudinary SDK instance
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload an image file, buffer, data URI, or URL to Cloudinary.
 *
 * @param {string|Buffer} fileInput - Local file path, Base64 Data URI, HTTP URL, or Buffer
 * @param {object} options - Cloudinary upload options (e.g. folder, public_id, overwrite, tags)
 * @returns {Promise<{secure_url: string, public_id: string, resource_type: string, format: string, width: number, height: number, bytes: number}>}
 */
const uploadImage = async (fileInput, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured in environment variables.');
  }

  const defaultOptions = {
    folder: 'huma_mehendi',
    resource_type: 'image',
    ...options,
  };

  try {
    let result;

    if (Buffer.isBuffer(fileInput)) {
      // Upload buffer via stream
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(defaultOptions, (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        });
        uploadStream.end(fileInput);
      });
    } else {
      // Upload string (URL, base64 data URI, or file path)
      result = await cloudinary.uploader.upload(fileInput, defaultOptions);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error(`✕ Cloudinary upload failed for public_id "${defaultOptions.public_id || 'auto'}":`, error.message || error);
    throw error;
  }
};

/**
 * Delete an image asset from Cloudinary by its public ID.
 *
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>}
 */
const deleteImage = async (publicId) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured in environment variables.');
  }
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  isCloudinaryConfigured,
};

