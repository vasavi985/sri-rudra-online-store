import { getProductImage } from './productImages';

export const OFFICIAL_CATEGORIES = [
  {
    id: 'ASPoAlsjCtqEYr6YEln1',
    slug: 'flours',
    name: 'Traditional Flours',
    description: 'Stone-milled, fine flours suited for everyday rotis, dosas, and healthy snacks.',
  },
  {
    id: 'WuHiMinuUECsnO1oJnKh',
    slug: 'dal-and-pulses',
    name: 'Dal & Pulses',
    description: 'Wholesome, protein-rich lentils and dals selected for daily home cooking.',
  },
  {
    id: 'gWPad04z2ZXto8lH5S2r',
    slug: 'ravva-semolina',
    name: 'Ravva & Semolina',
    description: 'Coarse and fine ravva varieties for wholesome breakfast preparations.',
  },
  {
    id: 'W9Ttq2hwN0yqAM5lngFl',
    slug: 'other-grocery',
    name: 'Other Grocery',
    description: 'Essential kitchen seasonings, sweeteners, and daily cooking staples.',
  },
];

export const CANONICAL_PRODUCTS = [
  // Dal & Pulses
  {
    id: 'moong-dal',
    name: 'Moong Dal',
    categoryName: 'Dal & Pulses',
    categoryId: 'dal-and-pulses',
    description: 'Wholesome split yellow moong dal, easy to digest and ideal for comforting daily meals.',
    variants: [],
  },
  {
    id: 'toor-dal',
    name: 'Toor Dal',
    categoryName: 'Dal & Pulses',
    categoryId: 'dal-and-pulses',
    description: 'Premium quality yellow pigeon peas, the cornerstone of traditional South Indian sambar and pappu.',
    variants: [],
  },
  {
    id: 'garam-dal',
    name: 'Garam Dal',
    categoryName: 'Dal & Pulses',
    categoryId: 'dal-and-pulses',
    description: 'Carefully roasted and crisp puffed gram dal, perfect for fresh coconut chutneys and healthy snacks.',
    variants: [],
  },
  {
    id: 'black-gram-dal',
    name: 'Black Gram Dal',
    categoryName: 'Dal & Pulses',
    categoryId: 'dal-and-pulses',
    description: 'Nutritious whole black gram (urad dal), rich in fiber and ideal for traditional culinary dishes.',
    variants: [],
  },
  {
    id: 'orid-dal',
    name: 'Orid Dal',
    categoryName: 'Dal & Pulses',
    categoryId: 'dal-and-pulses',
    description: 'Finely hulled white urad dal, essential for yielding soft, fluffy idlis and crisp golden dosas.',
    variants: [],
  },

  // Flours
  {
    id: 'ragi-flour',
    name: 'Ragi Flour',
    categoryName: 'Flours',
    categoryId: 'flours',
    description: 'Pure, mineral-rich finger millet flour ground carefully for traditional porridges, rotis, and mudde.',
    variants: [],
  },
  {
    id: 'rice-flour',
    name: 'Rice Flour',
    categoryName: 'Flours',
    categoryId: 'flours',
    description: 'Finely milled white rice flour for light rotis, crisp murukkus, snacks, and traditional batter mixes.',
    variants: [],
  },
  {
    id: 'gram-flour',
    name: 'Gram Flour',
    categoryName: 'Flours',
    categoryId: 'flours',
    description: 'Traditional besan ground from golden Bengal gram, ideal for sweets, pakoras, and savory preparations.',
    variants: [],
  },

  // Ravva / Semolina
  {
    id: 'rice-ravva',
    name: 'Rice Ravva',
    categoryName: 'Ravva / Semolina',
    categoryId: 'ravva-semolina',
    description: 'Evenly granulated rice ravva for authentic Andhra upma and steamed rice cakes.',
    variants: [],
  },
  {
    id: 'java-wheat-ravva',
    name: 'Java Wheat Ravva',
    categoryName: 'Ravva / Semolina',
    categoryId: 'ravva-semolina',
    description: 'Hearty broken wheat ravva, rich in dietary fiber for wholesome breakfasts and savory khichdis.',
    variants: [],
  },
  {
    id: 'idly-ravva',
    name: 'Idly Ravva',
    categoryName: 'Ravva / Semolina',
    categoryId: 'ravva-semolina',
    description: 'Special coarse rice semolina specially crafted to create soft, feather-light traditional idlis.',
    variants: [],
  },
  {
    id: 'sooji-ravva',
    name: 'Sooji Ravva',
    categoryName: 'Ravva / Semolina',
    categoryId: 'ravva-semolina',
    description: 'Classic semolina / suji milled to perfection for classic kesari halwa, rava dosas, and upma.',
    variants: [],
  },

  // Other Grocery
  {
    id: 'sugar',
    name: 'Sugar',
    categoryName: 'Other Grocery',
    categoryId: 'other-grocery',
    description: 'Clean, sparkling white crystal sugar for everyday tea, coffee, and traditional sweet delicacies.',
    variants: [],
  },
  {
    id: 'mustard-powder',
    name: 'Mustard Powder',
    categoryName: 'Other Grocery',
    categoryId: 'other-grocery',
    description: 'Pungent, finely ground mustard (aava pindi), indispensable for traditional Andhra pickles and curries.',
    variants: [],
  },
  {
    id: 'dalia',
    name: 'Dalia',
    categoryName: 'Other Grocery',
    categoryId: 'other-grocery',
    description: 'Wholesome broken wheat cracked grain, nutritious and easily prepared for family porridges.',
    variants: [],
  },
];

/**
 * Get product category name from ID or name
 */
export const getCategoryName = (categoryId) => {
  if (!categoryId) return 'Daily Essentials';
  const target = categoryId.toLowerCase();
  const found = OFFICIAL_CATEGORIES.find(
    (c) => c.id.toLowerCase() === target || (c.slug && c.slug.toLowerCase() === target)
  );
  if (found) return found.name;
  if (target === 'aspoalsjctqeyr6yeln1' || target.includes('flour')) return 'Traditional Flours';
  if (target === 'wuhiminuuecsno1ojnkh' || target.includes('dal') || target.includes('pulse')) return 'Dal & Pulses';
  if (target === 'gwpad04z2zxto8lh5s2r' || target === 'ravva-semolina' || target.includes('ravva') || target.includes('semolina')) return 'Ravva & Semolina';
  if (target === 'w9ttq2hwn0yqam5lngfl' || target === 'other-grocery' || target.includes('grocery') || target.includes('other')) return 'Other Grocery';
  return 'Daily Essentials';
};

/**
 * Merge remote products from Firestore with the canonical product definitions.
 * Real Firestore prices, variants, stock, and images take precedence!
 *
 * CRITICAL RULE:
 * Only active, valid products returned from the backend/Firestore are included.
 * Canonical products are used strictly for metadata enrichment (descriptions,
 * fallback category mapping) and NEVER create fake or deleted product cards.
 */
export const mergeProductsWithCatalog = (remoteProducts = []) => {
  const remoteList = Array.isArray(remoteProducts) ? remoteProducts : [];

  // Filter only active and valid products from backend
  const activeRemote = remoteList.filter((rp) => rp && rp.active !== false && rp.id);

  if (activeRemote.length === 0) {
    return [];
  }

  const findCanonicalMatch = (remote) => {
    // 1. Direct ID match
    const byId = CANONICAL_PRODUCTS.find((c) => c.id === remote.id);
    if (byId) return byId;

    const normRemote = (remote.name || '').toLowerCase().trim();

    // 2. Exact name match
    const byExact = CANONICAL_PRODUCTS.find((c) => c.name.toLowerCase().trim() === normRemote);
    if (byExact) return byExact;

    // 3. Flexible name match (e.g., "Gram Flour (Besan)" vs "Gram Flour", "Ragi Flour")
    const byFlexible = CANONICAL_PRODUCTS.find((c) => {
      const normCanonical = c.name.toLowerCase().trim();
      if (normRemote.includes(normCanonical) || normCanonical.includes(normRemote)) return true;
      if (normRemote.includes('besan') && normCanonical.includes('gram flour')) return true;
      if (normRemote.includes('ragi') && normCanonical.includes('ragi')) return true;
      return false;
    });

    return byFlexible || null;
  };

  return activeRemote.map((rp) => {
    const canonical = findCanonicalMatch(rp);

    return {
      ...(canonical || {}),
      ...rp,
      // Remote fields take absolute precedence
      name: rp.name,
      categoryId: rp.categoryId || canonical?.categoryId,
      categoryName: getCategoryName(rp.categoryId) || canonical?.categoryName || 'Authentic Grocery',
      description: rp.description || canonical?.description || 'Authentic traditional grocery essential.',
      imageUrl: rp.imageUrl || (Array.isArray(rp.imageUrls) && rp.imageUrls[0]) || canonical?.imageUrl || '',
      imageUrls: Array.isArray(rp.imageUrls) && rp.imageUrls.length > 0 ? rp.imageUrls : (rp.imageUrl ? [rp.imageUrl] : []),
      variants: Array.isArray(rp.variants) ? rp.variants.filter((v) => v && v.active !== false) : [],
    };
  });
};

/**
 * Return the canonical catalog enriched with resolved images and category names
 * for graceful offline fallback when the backend server is temporarily unavailable.
 */
export const getCanonicalCatalog = () => {
  return CANONICAL_PRODUCTS.map((p) => {
    const resolvedImage = getProductImage(p);
    return {
      ...p,
      active: true,
      categoryName: p.categoryName || getCategoryName(p.categoryId),
      imageUrl: resolvedImage,
      imageUrls: [resolvedImage],
      variants: Array.isArray(p.variants) ? p.variants : [],
    };
  });
};

export { getProductImage };
