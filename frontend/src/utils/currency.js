/**
 * Currency and swap value formatting utilities for Clothing Exchange.
 * Native currency: Indian Rupee (INR), symbol: ₹.
 *
 * Formats numbers using standard Indian numbering system (e.g. ₹1,200, ₹2,100, ₹3,500).
 * Handles numbers, numeric strings, zero, and missing/null values safely.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Format a numeric estimated swap value into an Indian Rupee string (e.g. ₹1,200).
 *
 * @param {number|string} value - The estimated swap value to format
 * @returns {string} Formatted INR currency string (e.g. "₹1,200" or "₹0")
 */
export function formatCurrency(value) {
  const num = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(num)) {
    return '₹0';
  }
  return inrFormatter.format(Math.round(num));
}

export default formatCurrency;

