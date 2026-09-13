// Frontend mirror of backend/src/utils/valueComparator.js
//
// Provides the same deterministic comparison formula so components can
// show a comparison result synchronously using listing data they have
// already loaded, without an extra API round-trip for what is purely
// informational display.
//
// IMPORTANT: This file must stay in sync with the backend utility.
// If you change the formula or thresholds in one file, update both.
// The canonical reference is backend/src/utils/valueComparator.js —
// the backend utility is what the automated tests verify directly.
//
// Classification thresholds (percentage difference):
//   <= 20%  ->  "Close Match"
//   <= 50%  ->  "Moderate Difference"
//   >  50%  ->  "Large Difference"
//
// Percentage formula:
//   percentageDifference = (|valueA - valueB| / max(valueA, valueB)) * 100
// Edge case: both values 0 -> percentageDifference = 0, "Close Match"

export const THRESHOLDS = {
  CLOSE: 20,
  MODERATE: 50,
};

export const CLASSIFICATIONS = {
  CLOSE: 'Close Match',
  MODERATE: 'Moderate Difference',
  LARGE: 'Large Difference',
};

/**
 * Compares two estimated values and returns a structured comparison.
 *
 * @param {number} valueA - Estimated value of the requested listing
 *   (what the requester wants to receive).
 * @param {number} valueB - Estimated value of the offered listing
 *   (what the requester is putting up in exchange).
 * @returns {{
 *   valueA: number,
 *   valueB: number,
 *   absoluteDifference: number,
 *   percentageDifference: number,
 *   classification: string
 * }}
 */
export const compareValues = (valueA, valueB) => {
  const absoluteDifference = Math.abs(valueA - valueB);
  const divisor = Math.max(valueA, valueB);
  const percentageDifference =
    divisor > 0
      ? Math.round((absoluteDifference / divisor) * 1000) / 10
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
