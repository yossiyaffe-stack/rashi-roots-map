export interface ScholarLocation {
  lat: number;
  lng: number;
  city: string;
  modernRegion: string;
  historicalContext: string;
}

export interface Scholar {
  id: number;
  name: string;
  hebrewName: string;
  birth: number;
  death: number;
  location: ScholarLocation;
  works: string[];
  commentedOn?: string[];
  teachers?: number[];
  students?: number[];
  relationToRashi?: string;
  commentariesOnRashi?: string[];
  importance: number;
  period?: string;
  relationshipType?: string;
  notes?: string;
}

export interface HistoricalEvent {
  year: number;
  name: string;
  description: string;
  importance: 'critical' | 'major' | 'foundational' | 'scholarly';
}

export const scholars: Scholar[] = [
  {
    id: 1,
    name: "Rashi (Rabbi Shlomo Yitzchaki)",
    hebrewName: "רש\"י",
    birth: 1040,
    death: 1105,
    location: { lat: 48.2973, lng: 4.0744, city: "Troyes", modernRegion: "France", historicalContext: "Champagne, Kingdom of France" },
    works: ["Commentary on Tanakh", "Commentary on Talmud"],
    commentedOn: ["Talmud Bavli", "Torah", "Prophets", "Writings"],
    students: [2, 3, 4],
    importance: 100,
    period: "Rishonim (Early Sages)",
    relationshipType: "foundational_commentator"
  },
  {
    id: 2,
    name: "Rashbam (Rabbi Shmuel ben Meir)",
    hebrewName: "רשב\"ם",
    birth: 1085,
    death: 1158,
    location: { lat: 48.2973, lng: 4.0744, city: "Troyes", modernRegion: "France", historicalContext: "Champagne, Kingdom of France" },
    works: ["Commentary on Torah", "Commentary on Talmud"],
    commentedOn: ["Torah", "Talmud Bavli"],
    teachers: [1],
    relationToRashi: "Grandson",
    commentariesOnRashi: ["Super-commentary on Rashi's Torah Commentary"],
    importance: 85
  },
  {
    id: 3,
    name: "Rabbenu Tam (Jacob ben Meir)",
    hebrewName: "רבנו תם",
    birth: 1100,
    death: 1171,
    location: { lat: 48.4637, lng: 3.5669, city: "Ramerupt", modernRegion: "France", historicalContext: "Champagne, Kingdom of France" },
    works: ["Sefer HaYashar", "Tosafot"],
    commentedOn: ["Talmud Bavli"],
    teachers: [1],
    relationToRashi: "Grandson",
    commentariesOnRashi: ["Tosafot on Rashi"],
    importance: 90
  },
  {
    id: 4,
    name: "Ri (Rabbi Isaac ben Samuel)",
    hebrewName: "ר\"י הזקן",
    birth: 1115,
    death: 1184,
    location: { lat: 48.9756, lng: 3.9667, city: "Dampierre", modernRegion: "France", historicalContext: "Champagne, Kingdom of France" },
    works: ["Tosafot"],
    commentedOn: ["Talmud Bavli"],
    teachers: [2, 3],
    commentariesOnRashi: ["Tosafot analyzing Rashi"],
    importance: 80
  },
  {
    id: 5,
    name: "Maharal of Prague",
    hebrewName: "מהר\"ל מפראג",
    birth: 1520,
    death: 1609,
    location: { lat: 50.0755, lng: 14.4378, city: "Prague", modernRegion: "Czech Republic", historicalContext: "Bohemia, Holy Roman Empire" },
    works: ["Gur Aryeh", "Tiferet Yisrael", "Derech Chaim"],
    commentedOn: ["Torah", "Pirkei Avot"],
    commentariesOnRashi: ["Gur Aryeh - Super-commentary on Rashi's Torah Commentary"],
    importance: 95
  },
  {
    id: 6,
    name: "Siftei Chachamim (Shabbethai Bass)",
    hebrewName: "שפתי חכמים",
    birth: 1641,
    death: 1718,
    location: { lat: 51.7592, lng: 19.4560, city: "Kalisz", modernRegion: "Poland", historicalContext: "Polish-Lithuanian Commonwealth" },
    works: ["Siftei Chachamim on Rashi"],
    commentedOn: ["Torah"],
    commentariesOnRashi: ["Siftei Chachamim - Super-commentary on Rashi"],
    importance: 75
  },
  {
    id: 7,
    name: "Mizrachi (Elijah Mizrachi)",
    hebrewName: "מזרחי",
    birth: 1455,
    death: 1526,
    location: { lat: 41.0082, lng: 28.9784, city: "Constantinople", modernRegion: "Turkey", historicalContext: "Ottoman Empire" },
    works: ["Mizrachi on Rashi"],
    commentedOn: ["Torah"],
    commentariesOnRashi: ["Super-commentary on Rashi's Torah Commentary"],
    importance: 82
  },
  {
    id: 8,
    name: "Vilna Gaon",
    hebrewName: "הגר\"א",
    birth: 1720,
    death: 1797,
    location: { lat: 54.6872, lng: 25.2797, city: "Vilna", modernRegion: "Lithuania", historicalContext: "Vilna - Part of Polish-Lithuanian Commonwealth, later Russian Empire" },
    works: ["Biur HaGra", "Commentaries on Talmud"],
    commentedOn: ["Tanakh", "Talmud", "Shulchan Aruch"],
    commentariesOnRashi: ["Commentary and emendations on Rashi"],
    importance: 98
  },
  {
    id: 9,
    name: "Netziv (Naftali Tzvi Yehuda Berlin)",
    hebrewName: "נצי\"ב",
    birth: 1816,
    death: 1893,
    location: { lat: 55.6667, lng: 26.5500, city: "Volozhin", modernRegion: "Belarus", historicalContext: "Volozhin, Minsk Governorate, Russian Empire (The Pale of Settlement)" },
    works: ["Ha'amek Davar", "Emek HaNetziv"],
    commentedOn: ["Torah", "Talmud"],
    commentariesOnRashi: ["References and analysis of Rashi in Ha'amek Davar"],
    importance: 88
  },
  {
    id: 10,
    name: "Malbim",
    hebrewName: "מלבי\"ם",
    birth: 1809,
    death: 1879,
    location: { lat: 49.8397, lng: 24.0297, city: "Volochysk", modernRegion: "Ukraine", historicalContext: "Volhynia, Russian Empire (The Pale of Settlement)" },
    works: ["Commentary on Tanakh"],
    commentedOn: ["Tanakh"],
    commentariesOnRashi: ["Engages with Rashi's interpretations throughout his commentary"],
    importance: 87
  },
  {
    id: 11,
    name: "Judah ben Eleazar (Minchat Yehudah)",
    hebrewName: "יהודה בן אלעזר",
    birth: 1270,
    death: 1320,
    location: { lat: 48.8566, lng: 2.3522, city: "Paris", modernRegion: "France", historicalContext: "Kingdom of France (before 1306 expulsion)" },
    works: ["Minchat Yehudah - Commentary on Rashi"],
    commentedOn: ["Torah via Rashi"],
    commentariesOnRashi: ["Minchat Yehudah - one of the first systematic Rashi supercommentaries"],
    teachers: [1],
    importance: 78,
    period: "Post-Tosafist France",
    relationshipType: "early_supercommentator",
    notes: "Completed 1313, shortly after French expulsion of 1306. Saw himself 'first and foremost as a supercommentator on Rashi'"
  },
  {
    id: 12,
    name: "Hezekiah ben Manoah (Chizkuni)",
    hebrewName: "חזקוני",
    birth: 1250,
    death: 1310,
    location: { lat: 48.8566, lng: 2.3522, city: "France", modernRegion: "France", historicalContext: "Northern France, 13th century" },
    works: ["Sefer Chizkuni - Compilatory Torah Commentary"],
    commentedOn: ["Torah"],
    commentariesOnRashi: ["Promised never to 'dispute' Rashi, includes significant Rashi supercommentary"],
    importance: 75,
    period: "Post-Tosafist France",
    relationshipType: "compilatory_commentator",
    notes: "Compilatory format drawing from ~20 sources including Rashi with special prominence"
  },
  {
    id: 13,
    name: "Isaiah di Trani (RID)",
    hebrewName: "ישעיה דטראני",
    birth: 1200,
    death: 1250,
    location: { lat: 40.6643, lng: 17.9418, city: "Trani", modernRegion: "Italy", historicalContext: "Southern Italy/Byzantium (trained in Rhineland)" },
    works: ["Tosafot RID", "Torah Commentary"],
    commentedOn: ["Talmud", "Torah"],
    commentariesOnRashi: ["~40 of ~150 comments address Rashi directly"],
    importance: 76,
    period: "Tosafist Period",
    relationshipType: "early_proto-supercommentator",
    notes: "Spent formative years in Rhineland; 'more Ashkenazi than Italian' learning"
  },
  {
    id: 14,
    name: "Dosa 'the Greek' of Vidin",
    hebrewName: "דוסא היווני",
    birth: 1370,
    death: 1430,
    location: { lat: 48.2082, lng: 16.3738, city: "Vienna", modernRegion: "Austria", historicalContext: "Vienna, post-Black Death Ashkenaz" },
    works: ["Commentary and Addenda (Peirush v'Tosafot)"],
    commentedOn: ["Torah", "Rashi's Commentary"],
    teachers: [15, 16],
    commentariesOnRashi: ["Recorded exegetical discussions of Vienna scholars on Rashi"],
    importance: 70,
    period: "Post-Black Death Austria",
    relationshipType: "recorder_of_oral_tradition",
    notes: "Fled Bulgaria 1396; preserved oral exegesis of 'the Ashkenazim' in Vienna"
  },
  {
    id: 15,
    name: "Shalom ben Isaac of Neustadt",
    hebrewName: "שלום בן יצחק מנוישטט",
    birth: 1350,
    death: 1413,
    location: { lat: 47.8133, lng: 16.2431, city: "Wiener-Neustadt", modernRegion: "Austria", historicalContext: "Austria, key rehabilitator after Black Death" },
    works: ["Oral teachings on Torah and Rashi"],
    commentedOn: ["Torah", "Rashi"],
    students: [14, 17],
    importance: 82,
    period: "Post-Black Death Austria",
    relationshipType: "oral_teacher",
    notes: "Key figure in rehabilitation of Ashkenazic life after 1348-1349 catastrophe"
  },
  {
    id: 16,
    name: "Avraham Klausner",
    hebrewName: "אברהם קלוזנר",
    birth: 1360,
    death: 1420,
    location: { lat: 48.2082, lng: 16.3738, city: "Vienna", modernRegion: "Austria", historicalContext: "Vienna, post-Black Death" },
    works: ["Teachings preserved by students"],
    students: [14],
    importance: 75,
    period: "Post-Black Death Austria",
    relationshipType: "oral_teacher"
  },
  {
    id: 17,
    name: "Israel ben Petahiah Isserlein",
    hebrewName: "ישראל איסרליין",
    birth: 1390,
    death: 1460,
    location: { lat: 47.8133, lng: 16.2431, city: "Wiener-Neustadt", modernRegion: "Austria", historicalContext: "Austria, leading 15th century rabbi" },
    works: ["Be'urim al Rashi (Explications of Rashi)", "Terumat ha-Deshen"],
    commentedOn: ["Torah via Rashi", "Halakhah"],
    teachers: [15, 18],
    students: [19],
    commentariesOnRashi: ["Be'urim al Rashi - first titled Ashkenazic supercommentary"],
    importance: 92,
    period: "Late Medieval Austria",
    relationshipType: "systematic_supercommentator",
    notes: "First Ashkenazic work explicitly titled as Rashi supercommentary; associated with early pilpul"
  },
  {
    id: 18,
    name: "Jacob ben Moses Halevi Molin (Maharil)",
    hebrewName: "מהרי\"ל",
    birth: 1360,
    death: 1427,
    location: { lat: 49.4521, lng: 8.2428, city: "Mainz", modernRegion: "Germany", historicalContext: "Rhineland, post-Black Death" },
    works: ["Minhagim", "Responsa", "Oral Torah teachings"],
    students: [17],
    importance: 88,
    period: "Post-Black Death Germany",
    relationshipType: "oral_teacher",
    notes: "Spoke of 'orphaned generation' after Black Death"
  },
  {
    id: 19,
    name: "Israel of Brünn",
    hebrewName: "ישראל מברין",
    birth: 1420,
    death: 1480,
    location: { lat: 49.1951, lng: 16.6068, city: "Brünn (Brno)", modernRegion: "Czech Republic", historicalContext: "Moravia, 15th century" },
    works: ["Marginal glosses on Jacob ben Asher's Torah commentary"],
    teachers: [17],
    commentariesOnRashi: ["Extensive marginal notes on Rashi via Jacob ben Asher's commentary"],
    importance: 74,
    period: "Late Medieval Moravia",
    relationshipType: "marginal_glossator",
    notes: "Preserved teacher Isserlein's ideas; aware of Sefardic criticism of Rashi"
  },
  {
    id: 20,
    name: "Mistress Kila",
    hebrewName: "מרת קילא",
    birth: 1380,
    death: 1440,
    location: { lat: 49.4521, lng: 8.2428, city: "Mainz region", modernRegion: "Germany", historicalContext: "Rhineland, early 15th century" },
    works: ["Three preserved glosses on Rashi"],
    commentariesOnRashi: ["Sophisticated Rashi supercommentary glosses"],
    importance: 65,
    period: "Post-Black Death Germany",
    relationshipType: "female_supercommentator",
    notes: "Only known premodern woman whose supercommentary survives; possibly contemporary of Maharil"
  },
  {
    id: 21,
    name: "Joseph Colon (Mahariq)",
    hebrewName: "מהרי\"ק",
    birth: 1420,
    death: 1480,
    location: { lat: 45.5667, lng: 5.9167, city: "Chambéry", modernRegion: "France (Savoy)", historicalContext: "French émigré community in Savoy" },
    works: ["Responsa", "Chiddushei Mahariq - Torah interpretations"],
    commentariesOnRashi: ["Weekly parashah class studying 'Torah through refraction of Rashi's commentary'"],
    importance: 80,
    period: "Late Medieval Franco-Italy",
    relationshipType: "oral_teacher_supercommentator",
    notes: "Last vestige of French rabbinic elite; studied Torah portion through Rashi in yeshivah"
  }
];

export const historicalEvents: HistoricalEvent[] = [
  { year: 1348, name: "Black Death", description: "Devastating plague and massacres; 'the decrees' (gezerot) that transformed Ashkenazic consciousness", importance: "critical" },
  { year: 1306, name: "French Expulsion", description: "Expulsion from royal domain", importance: "major" },
  { year: 1394, name: "Final French Expulsion", description: "Permanent end to French Jewish life", importance: "major" },
  { year: 1105, name: "Rashi's Death", description: "End of Rashi's life; beginning of his overwhelming influence", importance: "foundational" },
  { year: 1313, name: "Minchat Yehudah", description: "Judah ben Eleazar completes first systematic supercommentary", importance: "scholarly" },
  { year: 1460, name: "Isserlein's Death", description: "Israel Isserlein dies; first titled Ashkenazic supercommentary", importance: "scholarly" }
];
