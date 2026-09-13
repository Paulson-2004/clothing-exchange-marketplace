// Deterministic, rule-based swap value estimator.
//
// estimatedValue = baseValue(category) x brandMultiplier(brand) x conditionMultiplier(condition)
//
// This is NOT a market price - it is a rough, transparent starting
// point to reduce blank-page friction when creating a listing. The
// final value is always shown to the user as an ESTIMATE, and remains
// editable (see CreateEditListingPage on the frontend) because real
// swap value depends on factors this formula can't see (rarity,
// demand, sentimental value, negotiation between two users).

// Base value per category, representing a "typical mid-range item in
// good condition from an unrecognized brand" starting point.
const CATEGORY_BASE_VALUES = {
  tops: 15,
  bottoms: 20,
  dresses: 25,
  outerwear: 35,
  footwear: 30,
  accessories: 12,
  activewear: 18,
  other: 15,
};

// Known brands grouped into tiers. This list is intentionally small
// and illustrative - unrecognized brands fall through to the default
// 'standard' multiplier below rather than causing an error.
const BRAND_TIERS = {
  luxury: ['gucci', 'prada', 'burberry', 'chanel', 'louis vuitton', 'versace'],
  premium: ['nike', 'adidas', 'the north face', 'levi\'s', 'levis', 'patagonia', 'coach'],
  midrange: ['h&m', 'zara', 'uniqlo', 'gap', 'old navy', 'american eagle'],
};

const BRAND_MULTIPLIERS = {
  luxury: 4,
  premium: 1.8,
  midrange: 1.1,
  standard: 1, // default for any brand not found in a known tier
};

const CONDITION_MULTIPLIERS = {
  new: 1.5,
  'like-new': 1.2,
  good: 1,
  fair: 0.6,
};

const getBrandTier = (brand) => {
  if (!brand) return 'standard';
  const normalized = brand.trim().toLowerCase();

  for (const [tier, brands] of Object.entries(BRAND_TIERS)) {
    if (brands.includes(normalized)) return tier;
  }
  return 'standard';
};

/**
 * Estimates a swap value from category, brand, and condition.
 * Returns a whole number. Always deterministic - same inputs produce
 * the same output every time, with no external calls or randomness.
 */
const estimateValue = ({ category, brand, condition }) => {
  const baseValue = CATEGORY_BASE_VALUES[category] ?? CATEGORY_BASE_VALUES.other;
  const brandMultiplier = BRAND_MULTIPLIERS[getBrandTier(brand)];
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition] ?? 1;

  const rawValue = baseValue * brandMultiplier * conditionMultiplier;
  return Math.round(rawValue);
};

module.exports = { estimateValue, CATEGORY_BASE_VALUES, BRAND_MULTIPLIERS, CONDITION_MULTIPLIERS };
