// Protective recitations — Āyat al-Kursī and the three Quls (al-Ikhlās,
// al-Falaq, an-Nās). Read-only data for the immersive /recitations reader; no
// counts or persistence (unlike the tasbih in mindfulness.js). Each item's
// `hue` (HSL hue, 0–360) drives its screen's accent gradient, mirroring DHIKR.
//
// Arabic is the full standard mushaf text. Āyat al-Kursī is reused verbatim
// from the verified copy in adhkar.js. `verses` is an array so each āyah renders
// on its own line; `bismillah` is shown above the surahs (Āyat al-Kursī omits it,
// being a single verse mid-sūrah).
export const RECITATIONS = [
	{
		id: 'ayatul-kursi',
		name: 'آيَةُ الْكُرْسِيِّ',
		tr: 'Āyat al-Kursī',
		subtitle: 'The Verse of the Throne · al-Baqarah 2:255',
		hue: 210,
		verses: [
			'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ'
		],
		en: `Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass nothing of His knowledge except for what He wills. His Kursī extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.`
	},
	{
		id: 'al-ikhlas',
		name: 'سُورَةُ الْإِخْلَاص',
		tr: 'Sūrat al-Ikhlās',
		subtitle: 'Sincerity · Sūrah 112',
		hue: 45,
		bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
		verses: [
			'قُلْ هُوَ اللَّهُ أَحَدٌ',
			'اللَّهُ الصَّمَدُ',
			'لَمْ يَلِدْ وَلَمْ يُولَدْ',
			'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'
		],
		en: `Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.`
	},
	{
		id: 'al-falaq',
		name: 'سُورَةُ الْفَلَق',
		tr: 'Sūrat al-Falaq',
		subtitle: 'The Daybreak · Sūrah 113',
		hue: 130,
		bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
		verses: [
			'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
			'مِن شَرِّ مَا خَلَقَ',
			'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
			'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
			'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'
		],
		en: `Say: I seek refuge in the Lord of daybreak, from the evil of that which He created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.`
	},
	{
		id: 'an-nas',
		name: 'سُورَةُ النَّاس',
		tr: 'Sūrat an-Nās',
		subtitle: 'Mankind · Sūrah 114',
		hue: 285,
		bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
		verses: [
			'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
			'مَلِكِ النَّاسِ',
			'إِلَٰهِ النَّاسِ',
			'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
			'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
			'مِنَ الْجِنَّةِ وَالنَّاسِ'
		],
		en: `Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers into the breasts of mankind, from among the jinn and mankind.`
	}
];
