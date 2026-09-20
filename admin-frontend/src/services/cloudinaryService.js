import axios from 'axios';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file type and size.
 * Returns an error string if invalid, or null if valid.
 */
export const validateImageFile = (file) => {
  if (!file) {
    return 'No file selected.';
  }

  const fileType = file.type ? file.type.toLowerCase() : '';
  const fileName = file.name ? file.name.toLowerCase() : '';
  const isAllowed =
    ALLOWED_IMAGE_TYPES.includes(fileType) ||
    /\.(jpe?g|png|webp)$/i.test(fileName);

  if (!isAllowed) {
    return 'Please select a JPG, JPEG, PNG, or WEBP image.';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image file must be 5 MB or smaller.';
  }

  return null;
};

/**
 * Uploads an image file directly to Cloudinary using unsigned browser upload.
 *
 * @param {File} file - The file object to upload
 * @param {Object} options - Optional parameters
 * @param {string} options.folder - Destination folder in Cloudinary (e.g. 'rudra/products')
 * @param {Function} options.onProgress - Progress callback function receiving percentage (0-100)
 * @returns {Promise<string>} Resolves to Cloudinary secure_url
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  const { folder = 'rudra/products', onProgress } = options;

  // 1. Client-side validation
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Cloudinary credentials
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'jrgwnblg';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'rudra_products';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary cloud name or upload preset is missing.');
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // 3. Prepare FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  }

  // 4. Send upload request
  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(Math.min(percent, 99)); // Keep at 99% until response arrives
        }
      },
      timeout: 30000, // 30s timeout to prevent hanging
    });

    if (onProgress) {
      onProgress(100);
    }

    const secureUrl = response.data?.secure_url;
    if (!secureUrl) {
      throw new Error('Upload succeeded but no image URL was returned by Cloudinary.');
    }

    return secureUrl;
  } catch (err) {
    console.error('Cloudinary upload error:', err);

    if (err.response?.data?.error?.message) {
      throw new Error(`Cloudinary upload failed: ${err.response.data.error.message}`, { cause: err });
    }

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new Error('Photo upload timed out. Please check your internet connection and try again.', { cause: err });
    }

    if (err.message && !err.response) {
      throw new Error(err.message, { cause: err });
    }

    throw new Error('Photo upload failed. Please try again.', { cause: err });
  }
};

export default {
  uploadImageToCloudinary,
  validateImageFile,
};
