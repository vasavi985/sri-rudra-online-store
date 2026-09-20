import ragiFlourImg from '../assets/products/ragi-flour.jpg';
import gramFlourImg from '../assets/products/gram-flour.jpg';
import riceFlourImg from '../assets/products/rice-flour.jpg';
import puffedGramDalImg from '../assets/products/puffed-gram-dal.jpg';
import puffedGramDalAltImg from '../assets/products/puffed-gram-dal-alternate.jpg';
import placeholderImg from '../assets/product-placeholder.svg';

/**
 * Clean dictionary of local product packaging photographs.
 * Strict rule: Only local imports are used, never external random image URLs.
 */
export const PRODUCT_IMAGES = {
  'ragi-flour': ragiFlourImg,
  'gram-flour': gramFlourImg,
  'rice-flour': riceFlourImg,
  'puffed-gram-dal': puffedGramDalImg,
  'puffed-gram-dal-alternate': puffedGramDalAltImg,
  'garam-dal': puffedGramDalImg,
  'placeholder': placeholderImg,
};

/**
 * Descriptive, accessibility-compliant alt texts with Sri Rudra branding.
 */
export const PRODUCT_ALT_TEXTS = {
  'ragi-flour': 'Sri Rudra Pure Ragi Flour packaging - Munaga Anilkumar Traders, Rajahmundry',
  'gram-flour': 'Sri Rudra Pure Gram Flour (Besan) packaging - Munaga Anilkumar Traders, Rajahmundry',
  'rice-flour': 'Sri Rudra Pure Rice Flour packaging - Munaga Anilkumar Traders, Rajahmundry',
  'puffed-gram-dal': 'Sri Rudra Pure Puffed Gram Dal packaging - Munaga Anilkumar Traders, Rajahmundry',
  'garam-dal': 'Sri Rudra Garam Dal packaging - Munaga Anilkumar Traders, Rajahmundry',
};

/**
 * Identify the canonical product key based on product properties.
 */
export const getProductImageKey = (product) => {
  if (!product) return null;

  const text = [
    typeof product === 'string' ? product : '',
    product.name || '',
    product.id || '',
    product.imageUrl || '',
    product.description || '',
  ].join(' ').toLowerCase();

  // 1. Puffed Gram Dal / Garam Dal
  if (/garam[-_\s]*dal|puffed|putnal|roasted[-_\s]*gram|fried[-_\s]*gram/.test(text)) {
    return 'puffed-gram-dal';
  }

  // 2. Ragi Flour
  if (/ragi|finger[-_\s]*millet/.test(text)) {
    return 'ragi-flour';
  }

  // 3. Rice Flour
  if (/rice[-_\s]*flour|biyyapu/.test(text)) {
    return 'rice-flour';
  }

  // 4. Gram Flour (Besan)
  if (/besan|senaga|gram[-_\s]*flour|chana[-_\s]*flour|chickpea[-_\s]*flour/.test(text)) {
    return 'gram-flour';
  }

  return null;
};

/**
 * Resolve local product image for a product.
 * Returns local image asset or falls back to product-placeholder.svg.
 */
export const getProductImage = (product) => {
  // If product has a valid remote URL, use it
  if (
    product?.imageUrl &&
    typeof product.imageUrl === 'string' &&
    (product.imageUrl.startsWith('http://') ||
     product.imageUrl.startsWith('https://') ||
     product.imageUrl.startsWith('data:'))
  ) {
    return product.imageUrl;
  }

  // If product has an imageUrls array, return the primary image
  if (
    Array.isArray(product?.imageUrls) &&
    product.imageUrls.length > 0 &&
    typeof product.imageUrls[0] === 'string' &&
    (product.imageUrls[0].startsWith('http://') ||
     product.imageUrls[0].startsWith('https://') ||
     product.imageUrls[0].startsWith('data:'))
  ) {
    return product.imageUrls[0];
  }

  const key = getProductImageKey(product);
  if (key && PRODUCT_IMAGES[key]) {
    return PRODUCT_IMAGES[key];
  }

  if (
    product?.imageUrl &&
    typeof product.imageUrl === 'string' &&
    PRODUCT_IMAGES[product.imageUrl]
  ) {
    return PRODUCT_IMAGES[product.imageUrl];
  }

  return placeholderImg;
};

/**
 * Resolve accessible, meaningful alt text for a product.
 */
export const getProductAlt = (product) => {
  const key = getProductImageKey(product);
  if (key && PRODUCT_ALT_TEXTS[key]) {
    return PRODUCT_ALT_TEXTS[key];
  }

  const name = typeof product === 'string' ? product : product?.name;
  if (name) {
    return `Sri Rudra Authentic ${name} packaging - Munaga Anilkumar Traders, Rajahmundry`;
  }

  return 'Sri Rudra authentic traditional grocery packaging - Munaga Anilkumar Traders, Rajahmundry';
};

export { placeholderImg, ragiFlourImg, gramFlourImg, riceFlourImg, puffedGramDalImg, puffedGramDalAltImg };
