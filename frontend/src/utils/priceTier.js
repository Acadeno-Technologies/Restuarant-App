/**
 * Calculate the number of prices/portion rates configured for a menu item dish.
 * - 1 Price: Dish has only a base price (no half/quarter price)
 * - 2 Prices: Dish has base price + half_price (or base price + quarter_price)
 * - 3 Prices: Dish has base price + half_price + quarter_price
 *
 * @param {Object} item - Menu item object from API
 * @returns {number} 1, 2, or 3
 */
export const getPriceTier = (item) => {
  if (!item) return 1;

  let count = 0;

  // Base price (Full)
  if (
    item.price !== null &&
    item.price !== undefined &&
    String(item.price).trim() !== '' &&
    !isNaN(Number(item.price))
  ) {
    count++;
  } else if (item.price !== null && item.price !== undefined && String(item.price).trim() !== '') {
    count++;
  }

  // Half price
  if (
    item.half_price !== null &&
    item.half_price !== undefined &&
    String(item.half_price).trim() !== '' &&
    !isNaN(Number(item.half_price)) &&
    Number(item.half_price) > 0
  ) {
    count++;
  }

  // Quarter price
  if (
    item.quarter_price !== null &&
    item.quarter_price !== undefined &&
    String(item.quarter_price).trim() !== '' &&
    !isNaN(Number(item.quarter_price)) &&
    Number(item.quarter_price) > 0
  ) {
    count++;
  }

  return count > 0 ? count : 1;
};

/**
 * Sort menu items by price tier:
 * 1-price dishes first -> 2-prices dishes -> 3-prices dishes
 *
 * @param {Array} items - List of menu items
 * @returns {Array} Sorted new array of menu items
 */
export const sortByPriceTier = (items) => {
  if (!Array.isArray(items)) return [];

  return [...items].sort((a, b) => {
    const tierA = getPriceTier(a);
    const tierB = getPriceTier(b);

    if (tierA !== tierB) {
      return tierA - tierB; // Ascending: 1 -> 2 -> 3
    }

    // Secondary sort: sort_order if available, otherwise alphabetical by name
    const orderA = a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : 0;
    const orderB = b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : 0;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return (a.name || '').localeCompare(b.name || '');
  });
};
