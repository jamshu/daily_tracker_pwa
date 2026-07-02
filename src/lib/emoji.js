// Curated emoji catalog for activity icons, plus the single fallback used
// everywhere an activity's icon is displayed (cards, modal chips, report rows).

/** Grouped picker choices — small, hand-picked, works across platform emoji fonts. */
export const CURATED_EMOJI = [
	{ label: 'Worship', emoji: ['🕌', '📿', '🤲', '📖', '🌙', '🕋', '☪️', '🧎', '✨', '🌌'] },
	{ label: 'Health & fitness', emoji: ['🏃', '💪', '🏋️', '🚶', '🧘', '🚴', '🏊', '⚽', '😴', '💧'] },
	{ label: 'Learning', emoji: ['📚', '✍️', '🧠', '🎓', '💡', '🗣️', '🌍', '📝', '💻', '🔬'] },
	{ label: 'Food', emoji: ['🍎', '🥗', '🥦', '🍽️', '☕', '🍵', '🚰', '🍯', '🥛', '🍇'] },
	{ label: 'Work', emoji: ['💼', '📅', '✅', '⏰', '📞', '📊', '🛠️', '📧', '🗂️', '🎯'] },
	{ label: 'Family & social', emoji: ['👨‍👩‍👧', '🤝', '💬', '🎁', '❤️', '🏠', '🧕', '👶', '🫖', '🕊️'] },
	{ label: 'Misc', emoji: ['⭐', '🌱', '🔥', '🧹', '💰', '🎨', '🎧', '🚭', '🛒', '🌟'] }
];

/** Fallback per preset category when an activity has no icon of its own. */
export const CATEGORY_EMOJI = {
	Prayers: '🕌',
	Fasting: '🌙',
	'Learning & dawah': '📖',
	Other: '⭐'
};

/**
 * The icon to show for a custom activity: its own emoji, else its category's
 * fallback, else a star. Always returns something renderable.
 */
export function displayEmoji(activity) {
	return activity?.emoji || CATEGORY_EMOJI[activity?.category] || '⭐';
}
