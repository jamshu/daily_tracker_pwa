// Adhkār collections shown in the popup. Each item: Arabic, transliteration,
// English meaning, recommended count, and the reward/virtue with a source.
// Sourced from the well-known authentic morning/evening & post-prayer adhkār
// (Hisn al-Muslim and its references). Values use backticks so apostrophes in
// the English are safe.
import { writable } from 'svelte/store';

// which collection the modal is showing: 'morning' | 'evening' | 'afterSalah' | null
export const adhkarView = writable(null);
export const openAdhkar = (key) => adhkarView.set(key);
export const closeAdhkar = () => adhkarView.set(null);

export const ADHKAR = {
	morning: {
		title: 'Morning Adhkār',
		subtitle: 'Recited after Fajr until sunrise',
		items: [
			{
				ar: `اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ`,
				tr: `Āyat al-Kursī (Qurʼan 2:255)`,
				en: `Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence... His Throne extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.`,
				count: `1×`,
				reward: `Whoever recites it in the morning is protected by Allah from the jinn until evening.`,
				source: `Al-Hakim · al-Nasaʼi`
			},
			{
				ar: `قُلْ هُوَ اللَّهُ أَحَدٌ — قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ — قُلْ أَعُوذُ بِرَبِّ النَّاسِ`,
				tr: `Al-Ikhlās, Al-Falaq, An-Nās`,
				en: `Recite the three protective surahs — "Say: He is Allah, the One"; "Say: I seek refuge in the Lord of daybreak"; "Say: I seek refuge in the Lord of mankind".`,
				count: `3× each`,
				reward: `They will suffice you against everything.`,
				source: `Abu Dawud · Tirmidhi`
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
				ar: `اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ... وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ`,
				tr: `Āyat al-Kursī (Qurʼan 2:255)`,
				en: `Recite the full Verse of the Throne (as in the morning).`,
				count: `1×`,
				reward: `Protection by Allah from the jinn until the morning.`,
				source: `Al-Hakim · al-Nasaʼi`
			},
			{
				ar: `قُلْ هُوَ اللَّهُ أَحَدٌ — قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ — قُلْ أَعُوذُ بِرَبِّ النَّاسِ`,
				tr: `Al-Ikhlās, Al-Falaq, An-Nās`,
				en: `Recite the three protective surahs.`,
				count: `3× each`,
				reward: `They will suffice you against everything.`,
				source: `Abu Dawud · Tirmidhi`
			},
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
				ar: `اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ... فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ`,
				tr: `Sayyid al-Istighfār`,
				en: `The master supplication of seeking forgiveness (as in the morning).`,
				count: `1×`,
				reward: `Whoever says it at night with firm faith and dies that night enters Paradise.`,
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
				ar: `لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
				tr: `Lā ilāha illallāhu wahdah...`,
				en: `There is no god but Allah alone, with no partner; His is the dominion and the praise, and He is able to do all things.`,
				count: `1×`,
				reward: `A pillar of the post-prayer remembrance.`,
				source: `Bukhari · Muslim`
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
				ar: `سُبْحَانَ اللَّهِ (33) — الْحَمْدُ لِلَّهِ (33) — اللَّهُ أَكْبَرُ (33)، ثُمَّ: لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
				tr: `SubhānAllāh, Alhamdulillāh, Allāhu Akbar`,
				en: `Glory be to Allah (33), praise be to Allah (33), Allah is the Greatest (33), then complete the hundred with the testification above.`,
				count: `33× each`,
				reward: `Whoever does this, his sins are forgiven even if they were like the foam of the sea.`,
				source: `Muslim`
			},
			{
				ar: `آيَةُ الْكُرْسِيِّ`,
				tr: `Āyat al-Kursī`,
				en: `Recite the Verse of the Throne after each obligatory prayer.`,
				count: `1×`,
				reward: `Nothing stands between him and entering Paradise except death.`,
				source: `Al-Nasaʼi`
			},
			{
				ar: `قُلْ هُوَ اللَّهُ أَحَدٌ — قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ — قُلْ أَعُوذُ بِرَبِّ النَّاسِ`,
				tr: `Al-Ikhlās, Al-Falaq, An-Nās`,
				en: `Recite the three protective surahs after each prayer (three times each after Fajr and Maghrib).`,
				count: `1× (3× Fajr/Maghrib)`,
				reward: `Protection that suffices against all harm.`,
				source: `Abu Dawud · Tirmidhi`
			},
			{
				ar: `لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ`,
				tr: `...yuhyī wa yumītu...`,
				en: `There is no god but Allah alone... He gives life and causes death, and He is able to do all things.`,
				count: `10× after Fajr & Maghrib`,
				reward: `A great protection and reward recorded for the one who says it.`,
				source: `Tirmidhi · Ahmad`
			}
		]
	}
};
