// Deterministic swap value comparator.
//
// Compares the estimated values of two listings and returns a structured
// result including absolute difference, percentage difference, and a
// fairness classification. The result is INFORMATIONAL ONLY — it has
// no authority over swap status, acceptance, or rejection. It exists
// solely to help users negotiate more transparently.
//
// Classification thresholds (percentage difference):
//   ≤ 20%  →  "Close Match"
//   ≤ 50%  →  "Moderate Difference"
//   > 50%  →  "Large Difference"
//
// Percentage formula:
//   percentageDifference = (|valueA − valueB| / max(valueA, valueB)) × 100
//
// Edge case: if both values are 0, percentage is 0 and classification
// is "Close Match" (avoids division-by-zero; two zero-value items are
// as similar as two identical-value items).
//
// This module is reused by:
//   - listingController.js  (GET /api/listings/compare endpoint)
//   - Phase 7 Location-Based Matching (planned) — compatible estimated
//     value matching will call compareValues directly from this utility.

const THRESHOLDS = {
  CLOSE: 20,     // percentageDifference <= 20  -> Close Match
  MODERATE: 50,  // percentageDifference <= 50  -> Moderate Difference
                 // percentageDifference >  50  -> Large Difference
};

const CLASSIFICATIONS = {
  CLOSE: 'Close Match',
  MODERATE: 'Moderate Difference',
  LARGE: 'Large Difference',
};

/**
 * Compares two estimated values and returns a structured comparison.
 *
 * @param {number} valueA - Estimated value of the first listing (the
 *   requested item — what the requester wants to receive).
 * @param {number} valueB - Estimated value of the second listing (the
 *   offered item — what the requester is putting up in exchange).
 * @returns {{
 *   valueA: number,
 *   valueB: number,
 *   absoluteDifference: number,
 *   percentageDifference: number,
 *   classification: string
 * }}
 */
const compareValues = (valueA, valueB) => {
  const absoluteDifference = Math.abs(valueA - valueB);

  // Use the larger value as the denominator so the percentage expresses
  // "how far does the smaller differ from the larger". If both are 0,
  // divisor is 0 — return 0 % to avoid division-by-zero.
  const divisor = Math.max(valueA, valueB);
  const percentageDifference =
    divisor > 0
      ? Math.round((absoluteDifference / divisor) * 1000) / 10 // 1 decimal place
      : 0;

  let classification;
  if (percentageDifference <= THRESHOLDS.CLOSE) {
    classification = CLASSIFICATIONS.CLOSE;
  } else if (percentageDifference <= THRESHOLDS.MODERATE) {
    classification = CLASSIFICATIONS.MODERATE;
  } else {
    classification = CLASSIFICATIONS.LARGE;
  }

  return {
    valueA,
    valueB,
    absoluteDifference,
    percentageDifference,
    classification,
  };
};

module.exports = { compareValues, THRESHOLDS, CLASSIFICATIONS };
