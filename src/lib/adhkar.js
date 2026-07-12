// Adhkār collections shown in the popup. Each item: Arabic, transliteration,
// English meaning, recommended count, and the reward/virtue with a source.
// Sourced from the well-known authentic morning/evening & post-prayer adhkār
// (Hisn al-Muslim and its references). Values use backticks so apostrophes in
// the English are safe.
import { writable } from 'svelte/store';
import { RECITATIONS } from './recitations.js';

// which collection the modal is showing: 'morning' | 'evening' | 'afterSalah' | null
export const adhkarView = writable(null);
export const openAdhkar = (key) => adhkarView.set(key);
export const closeAdhkar = () => adhkarView.set(null);

// Full Qurʼanic adhkār screens (complete āyāt + bismillah) built from the verified
// mushaf text in recitations.js, so there's a single source. `ar` is kept as a
// joined fallback for the list/modal view; the immersive reader renders `verses`.
const byId = (id) => RECITATIONS.find((x) => x.id === id);

const qul = (id, count, reward, source) => {
	const r = byId(id);
	return { bismillah: r.bismillah, verses: r.verses, ar: r.verses.join(' '), tr: r.tr, en: r.en, count, reward, source };
};
const quls = (count, reward, source) => ['al-ikhlas', 'al-falaq', 'an-nas'].map((id) => qul(id, count, reward, source));

const ayatulKursi = (count, reward, source) => {
	const r = byId('ayatul-kursi');
	return { verses: r.verses, ar: r.verses.join(' '), tr: 'Āyat al-Kursī', en: r.en, count, reward, source };
};

export const ADHKAR = {
	morning: {
		title: 'Morning Adhkār',
		subtitle: 'Recited after Fajr until sunrise',
		items: [
			{
				ar: `اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ`,
				tr: `Āyat al-Kursī (Qurʼan 2:255)`,
				en: `Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence... His Throne extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.`,
				count: `1×`,
				reward: `Whoever recites it in the morning is protected by Allah from the jinn until evening.`,
				source: `Al-Hakim · al-Nasaʼi`
			},
			...quls(`3×`, `Whoever recites them three times in the morning and evening, they will suffice him against everything.`, `Abu Dawud · Tirmidhi`),
			{
				ar: `اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ`,
				tr: `Sayyid al-Istighfār`,
				en: `O Allah, You are my Lord, there is no god but You. You created me and I am Your servant... I acknowledge Your favour upon me and I confess my sin, so forgive me, for none forgives sins but You.`,
				count: `1×`,
				reward: `Whoever says it during the day with firm faith and dies that day enters Paradise.`,
				source: `Bukhari`
			},
			{
				ar: `أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
				tr: `Asbahnā wa asbahal-mulku lillāh...`,
				en: `We have entered the morning and the dominion belongs to Allah. There is no god but Allah alone, with no partner; His is the dominion and His is the praise, and He is able to do all things.`,
				count: `1×`,
				reward: `Begins the day by handing the whole kingdom back to Allah.`,
				source: `Muslim`
			},
			{
				ar: `اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ`,
				tr: `Allāhumma bika asbahnā...`,
				en: `O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.`,
				count: `1×`,
				reward: `A complete acknowledgement of reliance on Allah.`,
				source: `Tirmidhi`
			},
			{
				ar: `رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا`,
				tr: `Radītu billāhi Rabban...`,
				en: `I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.`,
				count: `3×`,
				reward: `Allah promises to please him on the Day of Resurrection.`,
				source: `Ahmad · Tirmidhi`
			},
			{
				ar: `بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ`,
				tr: `Bismillāhilladhī lā yadurru...`,
				en: `In the name of Allah, with whose name nothing on earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.`,
				count: `3×`,
				reward: `Nothing will harm the one who says it.`,
				source: `Abu Dawud · Tirmidhi`
			},
			{
				ar: `حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ`,
				tr: `Hasbiyallāhu lā ilāha illā huwa...`,
				en: `Allah is sufficient for me; there is no god but Him. Upon Him I rely, and He is the Lord of the Mighty Throne.`,
				count: `7×`,
				reward: `Allah will suffice him in whatever worries him of this world and the next.`,
				source: `Abu Dawud`
			},
			{
				ar: `سُبْحَانَ اللَّهِ وَبِحَمْدِهِ`,
				tr: `SubhānAllāhi wa bihamdih`,
				en: `Glory and praise be to Allah.`,
				count: `100×`,
				reward: `His sins are wiped away even if they were like the foam of the sea.`,
				source: `Bukhari · Muslim`
			}
		]
	},
	evening: {
		title: 'Evening Adhkār',
		subtitle: 'Recited after Asr until night',
		items: [
			{
				ar: `اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ`,
				tr: `Āyat al-Kursī (Qurʼan 2:255)`,
				en: `Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence... His Throne extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.`,
				count: `1×`,
				reward: `Whoever recites it in the morning is protected by Allah from the jinn until evening.`,
				source: `Al-Hakim · al-Nasaʼi`
			},
			...quls(`3×`, `Whoever recites them three times in the morning and evening, they will suffice him against everything.`, `Abu Dawud · Tirmidhi`),
			{
				ar: `أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
				tr: `Amsaynā wa amsal-mulku lillāh...`,
				en: `We have entered the evening and the dominion belongs to Allah... and He is able to do all things.`,
				count: `1×`,
				reward: `Closes the day by returning the dominion to Allah.`,
				source: `Muslim`
			},
			{
				ar: `اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ`,
				tr: `Allāhumma bika amsaynā...`,
				en: `O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.`,
				count: `1×`,
				reward: `Acknowledges total dependence on Allah.`,
				source: `Tirmidhi`
			},
			{
				ar: `أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ`,
				tr: `Aʻūdhu bikalimātillāhit-tāmmāt...`,
				en: `I seek refuge in the perfect words of Allah from the evil of what He has created.`,
				count: `3×`,
				reward: `Nothing will harm him that night.`,
				source: `Muslim`
			},
			{
				ar: `اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ`,
				tr: `Sayyid al-Istighfār`,
				en: `O Allah, You are my Lord, there is no god but You. You created me and I am Your servant... I acknowledge Your favour upon me and I confess my sin, so forgive me, for none forgives sins but You.`,
				count: `1×`,
				reward: `Whoever says it during the day with firm faith and dies that day enters Paradise.`,
				source: `Bukhari`
			},
			{
				ar: `رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا`,
				tr: `Radītu billāhi Rabban...`,
				en: `I am pleased with Allah as Lord, Islam as religion, and Muhammad ﷺ as Prophet.`,
				count: `3×`,
				reward: `Allah promises to please him on the Day of Resurrection.`,
				source: `Ahmad · Tirmidhi`
			},
			{
				ar: `بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ`,
				tr: `Bismillāhilladhī lā yadurru...`,
				en: `In the name of Allah, with whose name nothing on earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.`,
				count: `3×`,
				reward: `Nothing will harm the one who says it.`,
				source: `Abu Dawud · Tirmidhi`
			},
			{
				ar: `حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ`,
				tr: `Hasbiyallāhu lā ilāha illā huwa...`,
				en: `Allah is sufficient for me; there is no god but Him. Upon Him I rely, and He is the Lord of the Mighty Throne.`,
				count: `7×`,
				reward: `Allah will suffice him in whatever worries him of this world and the next.`,
				source: `Abu Dawud`
			},
			{
				ar: `سُبْحَانَ اللَّهِ وَبِحَمْدِهِ`,
				tr: `SubhānAllāhi wa bihamdih`,
				en: `Glory and praise be to Allah.`,
				count: `100×`,
				reward: `Sins wiped away even if like the foam of the sea.`,
				source: `Bukhari · Muslim`
			}
		]
	},
	janaza: {
		title: 'Janaza Prayer',
		subtitle: 'Funeral prayer — 4 Takbeers, no rukūʻ or sujūd',
		items: [
			{
				ar: `سُورَةُ الْفَاتِحَة`,
				tr: `Sūrat al-Fātihah`,
				en: `Recite Surah Al-Fatiha. Recite it silently after the first Takbeer.`,
				count: `After 1st Takbeer`,
				reward: `Recite silently. Opening surah is established sunnah in Janaza prayer.`,
				source: `Ibn Abbas · Al-Shafi'i`
			},
			{
				ar: `اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ`,
				tr: `Allāhumma salli ʻalā Muhammadin wa ʻalā āli Muhammadin kamā sallayta ʻalā Ibrāhīma wa ʻalā āli Ibrāhīma innaka Hamīdun Majīd. Allāhumma bārik ʻalā Muhammadin wa ʻalā āli Muhammadin kamā bārakta ʻalā Ibrāhīma wa ʻalā āli Ibrāhīma innaka Hamīdun Majīd.`,
				en: `O Allah, send Your blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and upon the family of Ibrahim. Indeed, You are the Most Praiseworthy, Most Glorious. O Allah, bless Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim. Indeed, You are the Most Praiseworthy, Most Glorious.`,
				count: `After 2nd Takbeer`,
				reward: `The Ibrahimiyyah salawat — same as recited in the tashahud.`,
				source: `Bukhari · Muslim`
			}
		],
		tabs: {
			male: {
				label: 'Male',
				items: [
					{
						ar: `اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ وَأَدْخِلْهُ الْجَنَّةَ وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ`,
						tr: `Allāhummaghfir lahu warhamhu wa ʻāfihi wa'fu ʻanhu wa akrim nuzulahu wa wassiʻ madkhalahu waghsilhu bil-māʼi wath-thalji wal-barad, wa naqqihi minal-khatāyā kamā naqqayta ath-thawbal-abyada minad-danas, wa abdilhu dāran khayran min dārihi wa ahlan khayran min ahlihi wa zawjan khayran min zawjihi, wa adkhilhul-jannata wa aʻidhu min ʻadhābil-qabri wa min ʻadhābin-nār.`,
						en: `O Allah, forgive him, have mercy on him, keep him safe and pardon him. Honour his reception, widen his entry, wash him with water, snow and hail, and cleanse him of sins as a white garment is cleansed of dirt. Give him a home better than his home, a family better than his family, a spouse better than his spouse. Admit him to Paradise and protect him from the punishment of the grave and from the punishment of the Fire.`,
						count: `After 3rd Takbeer`,
						reward: `Main dua for the deceased (male).`,
						source: `Muslim`
					},
					{
						ar: `اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ وَلَا تَفْتِنَّا بَعْدَهُ وَاغْفِرْ لَنَا وَلَهُ`,
						tr: `Allāhumma lā tahrimnā ajrahu wa lā taftinnā baʻdahu waghfir lanā wa lahu`,
						en: `O Allah, do not deprive us of his reward and do not put us to trial after him, and forgive us and him.`,
						count: `After 4th Takbeer`,
						reward: `Then make one Tasleem to the right: "As-salāmu ʻalaykum wa rahmatullāh".`,
						source: `Al-Hakim · Ibn Majah`
					}
				]
			},
			female: {
				label: 'Female',
				items: [
					{
						ar: `اللَّهُمَّ اغْفِرْ لَهَا وَارْحَمْهَا وَعَافِهَا وَاعْفُ عَنْهَا وَأَكْرِمْ نُزُلَهَا وَوَسِّعْ مُدْخَلَهَا وَاغْسِلْهَا بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ وَنَقِّهَا مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ وَأَبْدِلْهَا دَارًا خَيْرًا مِنْ دَارِهَا وَأَهْلًا خَيْرًا مِنْ أَهْلِهَا وَزَوْجًا خَيْرًا مِنْ زَوْجِهَا وَأَدْخِلْهَا الْجَنَّةَ وَأَعِذْهَا مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ`,
						tr: `Allāhummaghfir lahā warhamhā wa ʻāfihā wa'fu ʻanhā wa akrim nuzulahā wa wassiʻ madkhalahā waghsilhā bil-māʼi wath-thalji wal-barad, wa naqqihā minal-khatāyā kamā naqqayta ath-thawbal-abyada minad-danas, wa abdilhā dāran khayran min dārihā wa ahlan khayran min ahlihā wa zawjan khayran min zawjihā, wa adkhilhal-jannata wa aʻidhā min ʻadhābil-qabri wa min ʻadhābin-nār.`,
						en: `O Allah, forgive her, have mercy on her, keep her safe and pardon her. Honour her reception, widen her entry, wash her with water, snow and hail, and cleanse her of sins as a white garment is cleansed of dirt. Give her a home better than her home, a family better than her family, a spouse better than her spouse. Admit her to Paradise and protect her from the punishment of the grave and from the punishment of the Fire.`,
						count: `After 3rd Takbeer`,
						reward: `Main dua for the deceased (female).`,
						source: `Muslim`
					},
					{
						ar: `اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهَا وَلَا تَفْتِنَّا بَعْدَهَا وَاغْفِرْ لَنَا وَلَهَا`,
						tr: `Allāhumma lā tahrimnā ajrahā wa lā taftinnā baʻdahā waghfir lanā wa lahā`,
						en: `O Allah, do not deprive us of her reward and do not put us to trial after her, and forgive us and her.`,
						count: `After 4th Takbeer`,
						reward: `Then make one Tasleem to the right: "As-salāmu ʻalaykum wa rahmatullāh".`,
						source: `Al-Hakim · Ibn Majah`
					}
				]
			}
		}
	},
	afterSalah: {
		title: 'Dhikr after Salah',
		subtitle: 'After every obligatory prayer',
		items: [
			{
				ar: `أَسْتَغْفِرُ اللَّهَ`,
				tr: `Astaghfirullāh`,
				en: `I seek the forgiveness of Allah.`,
				count: `3×`,
				reward: `Begin by seeking forgiveness for any shortcomings in the prayer.`,
				source: `Muslim`
			},
			{
				ar: `اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ`,
				tr: `Allāhumma antas-salām...`,
				en: `O Allah, You are Peace and from You is peace. Blessed are You, O Owner of majesty and honour.`,
				count: `1×`,
				reward: `Said immediately after the closing salām.`,
				source: `Muslim`
			},
			
			{
				ar: `اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ`,
				tr: `Allāhumma lā māniʻa limā aʻtayta, wa lā muʻtiya limā manaʻta, wa lā yanfaʻu dhal-jaddi minka al-jadd`,
				en: `O Allah, none can withhold what You have given, and none can give what You have withheld, and no wealth or majesty can benefit anyone against You — all wealth and majesty are from You.`,
				count: `1×`,
				reward: `Recited together with the testification above, after every obligatory prayer.`,
				source: `Bukhari · Muslim`
			},
			{
				ar: `لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ، لَا إِلَهَ إِلَّا اللَّهُ مُخْلِصِينَ لَهُ الدِّينَ وَلَوْ كَرِهَ الْكَافِرُونَ`,
				tr: `Lā ilāha illallāhu wahdahu lā sharīka lah, lahul-mulku wa lahul-hamdu wa huwa ʻalā kulli shayʼin qadīr, lā hawla wa lā quwwata illā billāh, lā ilāha illallāhu wa lā naʻbudu illā iyyāh, lahun-niʻmatu wa lahul-fadlu wa lahuth-thanāʼul-hasan, lā ilāha illallāhu mukhlisīna lahud-dīna wa law karihal-kāfirūn`,
				en: `None has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise, and He is over all things omnipotent. There is no might nor power except with Allah. None has the right to be worshipped except Allah, and we worship none except Him. For Him is all favour, grace, and glorious praise. None has the right to be worshipped except Allah, and we are sincere in faith and devotion to Him, although the disbelievers detest it.`,
				count: `1×`,
				reward: `The Prophet ﷺ would declare this tahlīl after every obligatory prayer.`,
				source: `Muslim`
			},
			{
				ar: `سُبْحَانَ اللَّهِ`,
				tr: `SubhānAllāh`,
				en: `Glory be to Allah.`,
				count: `33×`,
				reward: `Part of the post-prayer tasbīh that completes one hundred.`,
				source: `Muslim`
			},
			{
				ar: `الْحَمْدُ لِلَّهِ`,
				tr: `Alhamdulillāh`,
				en: `All praise is for Allah.`,
				count: `33×`,
				reward: `Part of the post-prayer tasbīh that completes one hundred.`,
				source: `Muslim`
			},
			{
				ar: `اللَّهُ أَكْبَرُ`,
				tr: `Allāhu Akbar`,
				en: `Allah is the Greatest.`,
				count: `33×`,
				reward: `Part of the post-prayer tasbīh that completes one hundred.`,
				source: `Muslim`
			},
			
			ayatulKursi(`1×`, `Whoever recites it after each obligatory prayer, nothing stands between him and entering Paradise except death.`, `Al-Nasaʼi`),
			...quls(`3×`, `Recited after each prayer (three times after Fajr and Maghrib) — protection that suffices against all harm.`, `Abu Dawud · Tirmidhi`),
			{
				ar: `لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
				tr: `...yuhyī wa yumītu...`,
				en: `There is no god but Allah alone... He gives life and causes death, and He is able to do all things.`,
				count: `10× after Fajr & Maghrib`,
				reward: `A great protection and reward recorded for the one who says it.`,
				source: `Tirmidhi · Ahmad`
			}
		]
	},
	umrah: {
		title: 'Umrah Guide',
		subtitle: 'The rites step by step — ihrām to halq',
		items: [
			{
				ar: `لَبَّيْكَ عُمْرَةً`,
				tr: `Labbayka ʻumrah — ihrām & intention`,
				en: `At the mīqāt: bathe, men put on the two ihrām garments, and after a prayer make the intention by saying "Labbayka ʻumrah" (Here I am, O Allah, for ʻUmrah). From this moment the ihrām restrictions apply.`,
				count: `Step 1`,
				source: `Bukhari · Muslim`
			},
			{
				ar: `لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ`,
				tr: `At-Talbiyah`,
				en: `Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, favour and sovereignty are Yours. You have no partner. Recite it abundantly — men aloud — until you begin the tawāf.`,
				count: `Step 2`,
				reward: `No Muslim says the talbiyah except that everything to his right and left — stones, trees and earth — says it with him.`,
				source: `Tirmidhi · Ibn Majah`
			},
			{
				ar: `اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ`,
				tr: `Entering al-Masjid al-Ḥarām`,
				en: `Enter with the right foot and say: "O Allah, open for me the gates of Your mercy." Stop the talbiyah when you reach the Kaʻbah.`,
				count: `Step 3`,
				source: `Muslim`
			},
			{
				ar: `بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ`,
				tr: `Ṭawāf — seven circuits of the Kaʻbah`,
				en: `Begin at the Black Stone: touch or kiss it if easy, otherwise point to it saying "Bismillāhi wallāhu akbar". Circle the Kaʻbah seven times anticlockwise. Men keep the right shoulder bared (iḍṭibāʻ) throughout and walk briskly (raml) in the first three circuits. Any dhikr and duʻā may be made while circling.`,
				count: `Step 4`,
				source: `Bukhari · Bayhaqi`
			},
			{
				ar: `رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ`,
				tr: `Between ar-Rukn al-Yamānī and the Black Stone`,
				en: `In every circuit, between the Yemeni corner and the Black Stone, say: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire."`,
				count: `Step 5`,
				source: `Abu Dawud · Ahmad`
			},
			{
				ar: `وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى`,
				tr: `Two rakʻahs at Maqām Ibrāhīm, then Zamzam`,
				en: `Pray two rakʻahs behind Maqām Ibrāhīm if possible — anywhere in the mosque if crowded — reciting al-Kāfirūn in the first and al-Ikhlāṣ in the second, then drink Zamzam water.`,
				count: `Step 6`,
				source: `Muslim · Qurʼan 2:125`
			},
			{
				ar: `إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ ۖ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَن يَطَّوَّفَ بِهِمَا ۚ وَمَن تَطَوَّعَ خَيْرًا فَإِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ`,
				tr: `"When approaching aṣ-Ṣafā for the first time only"`,
				en: `"Indeed, aṣ-Ṣafā and al-Marwah are among the symbols of Allah. So whoever makes Hajj to the House or performs ʻUmrah — there is no blame upon him for walking between them. And whoever volunteers good — indeed, Allah is Appreciative and Knowing." When approaching aṣ-Ṣafā for the first time only, recite this āyah and say "I begin with what Allah began with". Ṣafā to Marwah is one lap; finish the seventh on al-Marwah. Men jog gently between the green lights.`,
				count: `Step 7`,
				source: `Muslim · Qurʼan 2:158`
			},
			{
				ar: `اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ`,
				tr: `Dhikr on aṣ-Ṣafā and al-Marwah`,
				en: `On each of aṣ-Ṣafā and al-Marwah face the qiblah, raise the hands and say this three times, making long duʻā in between: "Allah is the Greatest, Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise. There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He is able to do all things. There is no god but Allah alone: He fulfilled His promise, gave victory to His servant, and defeated the confederates alone."`,
				count: `Step 8 — 3× on each mount`,
				source: `Muslim`
			},
			{
				ar: `اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ`,
				tr: `Ḥalq or taqṣīr — shaving or shortening the hair`,
				en: `Men shave the whole head (better) or shorten all of it; women cut a fingertip's length. The Prophet ﷺ prayed three times for forgiveness for the men who shave. Your ʻUmrah is now complete and the ihrām restrictions are lifted.`,
				count: `Step 9`,
				reward: `The Prophet ﷺ said: "O Allah, forgive those who shave their heads" — three times.`,
				source: `Bukhari · Muslim`
			}
		]
	}
};

/* ----------------------------- prayer library ---------------------------- */
// Entries for the "Prayers & Dhikr" library page (/prayers) and the home-page
// shortcut. Each entry opens via exactly one of: href (app-relative page, base
// prepended at render) or modal (an ADHKAR set key for the popup). icon is a
// list of SVG path `d` strings drawn in a 24×24 stroked viewBox. Future
// prayers/duas: add an entry here (plus an ADHKAR set above if needed).
export const PRAYER_LIBRARY = [
	{
		id: 'afterSalah',
		title: 'Dhikr after Salah',
		subtitle: 'The remembrance to recite after every fard prayer',
		icon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z'],
		href: '/adhkar/afterSalah'
	},
	{
		id: 'janaza',
		title: 'Janaza Prayer',
		subtitle: '4 Takbeers — duas for the funeral prayer',
		icon: ['M12 2L8 7H4l2 5-4 5h5l5 5 5-5h5l-4-5 2-5h-4L12 2z'],
		// Stays a modal (not the immersive reader): it presents the separate
		// male/female versions of the duas side by side.
		modal: 'janaza'
	},
	{
		id: 'recitations',
		title: 'Protective Recitations',
		subtitle: 'Ayatul Kursi & the three Quls — Ikhlās, Falaq, Nās',
		icon: ['M12 22s-8-4.5-8-11.5V5l8-3 8 3v5.5C20 17.5 12 22 12 22z', 'M9 11l2 2 4-4'],
		href: '/recitations'
	},
	{
		id: 'umrah',
		title: 'Umrah Guide',
		subtitle: 'The rites step by step — ihrām, tawāf, saʻī, halq',
		icon: ['M5 6h14v15H5z', 'M5 10h14'],
		href: '/adhkar/umrah'
	}
];
