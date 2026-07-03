// Fixed icon per default budget category, plus the fallback used everywhere
// a budget category's icon is displayed. Mirrors emoji.js's CATEGORY_EMOJI/
// displayEmoji pattern but keyed by budget category id, not activity category.

export const BUDGET_CATEGORY_EMOJI = {
	rent: '🏠',
	electricity: '⚡',
	water: '💧',
	internet: '🌐',
	phone: '📱',
	grocery: '🛒',
	food: '🍽️',
	school: '🎓',
	kids: '🧸',
	transport: '🚗',
	medical: '🩺',
	entertainment: '🎬',
	clothing: '👕',
	fines_rta: '🚦',
	other: '💰'
};

/**
 * Icon for a budget category row: its own custom emoji, else the fixed map
 * for defaults, else a generic 💰. Always returns something renderable.
 */
export function displayBudgetEmoji(cat) {
	return cat?.emoji || BUDGET_CATEGORY_EMOJI[cat?.id] || '💰';
}
