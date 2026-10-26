/* ==========================================================================
   DeutschWeg – reference data used by drills, placement test and library
   ========================================================================== */
window.GT = window.GT || {};
GT.ref = {};

/** Approximate regular er-form (used to skip non-changing verbs in Präsens drill) */
GT.ref.regularPres = (inf) => {
  const stem = inf.replace(/e?n$/, '');
  return /[td]$/.test(stem) ? stem + 'et' : /[sßxz]$/.test(stem) ? stem + 't' : stem + 't';
};

// [Infinitiv, er-Präsens, Präteritum, Perfekt, English]
GT.ref.verbs = [
  ['beginnen', 'beginnt', 'begann', 'hat begonnen', 'to begin'], ['bieten', 'bietet', 'bot', 'hat geboten', 'to offer'],
  ['bitten', 'bittet', 'bat', 'hat gebeten', 'to ask (for)'], ['bleiben', 'bleibt', 'blieb', 'ist geblieben', 'to stay'],
  ['brechen', 'bricht', 'brach', 'hat gebrochen', 'to break'], ['bringen', 'bringt', 'brachte', 'hat gebracht', 'to bring'],
  ['denken', 'denkt', 'dachte', 'hat gedacht', 'to think'], ['empfehlen', 'empfiehlt', 'empfahl', 'hat empfohlen', 'to recommend'],
  ['entscheiden', 'entscheidet', 'entschied', 'hat entschieden', 'to decide'], ['essen', 'isst', 'aß', 'hat gegessen', 'to eat'],
  ['fahren', 'fährt', 'fuhr', 'ist gefahren', 'to drive, go'], ['fallen', 'fällt', 'fiel', 'ist gefallen', 'to fall'],
  ['fangen', 'fängt', 'fing', 'hat gefangen', 'to catch'], ['finden', 'findet', 'fand', 'hat gefunden', 'to find'],
  ['fliegen', 'fliegt', 'flog', 'ist geflogen', 'to fly'], ['fliehen', 'flieht', 'floh', 'ist geflohen', 'to flee'],
  ['geben', 'gibt', 'gab', 'hat gegeben', 'to give'], ['gehen', 'geht', 'ging', 'ist gegangen', 'to go'],
  ['gelingen', 'gelingt', 'gelang', 'ist gelungen', 'to succeed'], ['gelten', 'gilt', 'galt', 'hat gegolten', 'to be valid'],
  ['genießen', 'genießt', 'genoss', 'hat genossen', 'to enjoy'], ['geschehen', 'geschieht', 'geschah', 'ist geschehen', 'to happen'],
  ['gewinnen', 'gewinnt', 'gewann', 'hat gewonnen', 'to win'], ['greifen', 'greift', 'griff', 'hat gegriffen', 'to grab'],
  ['halten', 'hält', 'hielt', 'hat gehalten', 'to hold, stop'], ['heben', 'hebt', 'hob', 'hat gehoben', 'to lift'],
  ['heißen', 'heißt', 'hieß', 'hat geheißen', 'to be called'], ['helfen', 'hilft', 'half', 'hat geholfen', 'to help'],
  ['kennen', 'kennt', 'kannte', 'hat gekannt', 'to know (be familiar with)'], ['kommen', 'kommt', 'kam', 'ist gekommen', 'to come'],
  ['laden', 'lädt', 'lud', 'hat geladen', 'to load'], ['lassen', 'lässt', 'ließ', 'hat gelassen', 'to let, leave'],
  ['laufen', 'läuft', 'lief', 'ist gelaufen', 'to run, walk'], ['leiden', 'leidet', 'litt', 'hat gelitten', 'to suffer'],
  ['leihen', 'leiht', 'lieh', 'hat geliehen', 'to lend'], ['lesen', 'liest', 'las', 'hat gelesen', 'to read'],
  ['liegen', 'liegt', 'lag', 'hat gelegen', 'to lie (be lying)'], ['lügen', 'lügt', 'log', 'hat gelogen', 'to tell a lie'],
  ['messen', 'misst', 'maß', 'hat gemessen', 'to measure'], ['nehmen', 'nimmt', 'nahm', 'hat genommen', 'to take'],
  ['nennen', 'nennt', 'nannte', 'hat genannt', 'to name'], ['raten', 'rät', 'riet', 'hat geraten', 'to advise, guess'],
  ['rennen', 'rennt', 'rannte', 'ist gerannt', 'to run'], ['riechen', 'riecht', 'roch', 'hat gerochen', 'to smell'],
  ['rufen', 'ruft', 'rief', 'hat gerufen', 'to call'], ['scheinen', 'scheint', 'schien', 'hat geschienen', 'to shine, seem'],
  ['schieben', 'schiebt', 'schob', 'hat geschoben', 'to push'], ['schlafen', 'schläft', 'schlief', 'hat geschlafen', 'to sleep'],
  ['schlagen', 'schlägt', 'schlug', 'hat geschlagen', 'to hit, beat'], ['schließen', 'schließt', 'schloss', 'hat geschlossen', 'to close'],
  ['schneiden', 'schneidet', 'schnitt', 'hat geschnitten', 'to cut'], ['schreiben', 'schreibt', 'schrieb', 'hat geschrieben', 'to write'],
  ['schreien', 'schreit', 'schrie', 'hat geschrien', 'to scream'], ['schweigen', 'schweigt', 'schwieg', 'hat geschwiegen', 'to be silent'],
  ['schwimmen', 'schwimmt', 'schwamm', 'ist geschwommen', 'to swim'], ['sehen', 'sieht', 'sah', 'hat gesehen', 'to see'],
  ['sein', 'ist', 'war', 'ist gewesen', 'to be'], ['singen', 'singt', 'sang', 'hat gesungen', 'to sing'],
  ['sinken', 'sinkt', 'sank', 'ist gesunken', 'to sink'], ['sitzen', 'sitzt', 'saß', 'hat gesessen', 'to sit'],
  ['sprechen', 'spricht', 'sprach', 'hat gesprochen', 'to speak'], ['springen', 'springt', 'sprang', 'ist gesprungen', 'to jump'],
  ['stehen', 'steht', 'stand', 'hat gestanden', 'to stand'], ['stehlen', 'stiehlt', 'stahl', 'hat gestohlen', 'to steal'],
  ['steigen', 'steigt', 'stieg', 'ist gestiegen', 'to climb, rise'], ['sterben', 'stirbt', 'starb', 'ist gestorben', 'to die'],
  ['streiten', 'streitet', 'stritt', 'hat gestritten', 'to argue'], ['tragen', 'trägt', 'trug', 'hat getragen', 'to carry, wear'],
  ['treffen', 'trifft', 'traf', 'hat getroffen', 'to meet, hit'], ['trinken', 'trinkt', 'trank', 'hat getrunken', 'to drink'],
  ['tun', 'tut', 'tat', 'hat getan', 'to do'], ['vergessen', 'vergisst', 'vergaß', 'hat vergessen', 'to forget'],
  ['verlieren', 'verliert', 'verlor', 'hat verloren', 'to lose'], ['verschwinden', 'verschwindet', 'verschwand', 'ist verschwunden', 'to disappear'],
  ['wachsen', 'wächst', 'wuchs', 'ist gewachsen', 'to grow'], ['waschen', 'wäscht', 'wusch', 'hat gewaschen', 'to wash'],
  ['werden', 'wird', 'wurde', 'ist geworden', 'to become'], ['werfen', 'wirft', 'warf', 'hat geworfen', 'to throw'],
  ['wissen', 'weiß', 'wusste', 'hat gewusst', 'to know (a fact)'], ['ziehen', 'zieht', 'zog', 'hat gezogen', 'to pull, move'],
  ['zwingen', 'zwingt', 'zwang', 'hat gezwungen', 'to force'],
];

// [Präposition, Kasus A/D/G/W, English, Beispiel]
GT.ref.preps = [
  ['durch', 'A', 'through', 'Wir gehen durch den Park.'], ['für', 'A', 'for', 'Das Geschenk ist für meinen Vater.'],
  ['gegen', 'A', 'against', 'Er ist gegen den Plan.'], ['ohne', 'A', 'without', 'Ich trinke Kaffee ohne den Zucker nie.'],
  ['um', 'A', 'around, at (time)', 'Wir sitzen um den Tisch.'], ['bis', 'A', 'until', 'Bis nächsten Montag!'],
  ['entlang', 'A', 'along (after noun)', 'Wir gehen den Fluss entlang.'],
  ['aus', 'D', 'out of, from', 'Sie kommt aus der Schweiz.'], ['bei', 'D', 'at, near, with', 'Ich wohne bei meinen Eltern.'],
  ['mit', 'D', 'with', 'Ich fahre mit dem Bus.'], ['nach', 'D', 'after, to', 'Nach dem Essen gehen wir spazieren.'],
  ['seit', 'D', 'since, for', 'Seit einem Jahr lerne ich Deutsch.'], ['von', 'D', 'from, of', 'Das ist ein Brief von meiner Oma.'],
  ['zu', 'D', 'to', 'Ich gehe zum Arzt.'], ['gegenüber', 'D', 'opposite', 'Die Bank liegt dem Bahnhof gegenüber.'],
  ['außer', 'D', 'except', 'Außer meinem Bruder kommen alle.'], ['ab', 'D', 'from (time/place)', 'Ab dem ersten Mai gilt die Regel.'],
  ['an', 'W', 'at, on (vertical)', 'Das Bild hängt an der Wand. / Ich hänge es an die Wand.'], ['auf', 'W', 'on (horizontal)', 'Das Buch liegt auf dem Tisch. / Ich lege es auf den Tisch.'],
  ['hinter', 'W', 'behind', 'Der Garten ist hinter dem Haus.'], ['in', 'W', 'in, into', 'Ich bin in der Küche. / Ich gehe in die Küche.'],
  ['neben', 'W', 'next to', 'Setz dich neben mich!'], ['über', 'W', 'over, above, about', 'Die Lampe hängt über dem Tisch.'],
  ['unter', 'W', 'under', 'Die Katze liegt unter dem Sofa.'], ['vor', 'W', 'in front of, before', 'Wir treffen uns vor dem Kino.'],
  ['zwischen', 'W', 'between', 'Das Café liegt zwischen der Post und der Bank.'],
  ['wegen', 'G', 'because of', 'Wegen des Regens bleiben wir zu Hause.'], ['trotz', 'G', 'despite', 'Trotz der Kälte gehen wir schwimmen.'],
  ['während', 'G', 'during', 'Während des Films schlief er ein.'], ['statt', 'G', 'instead of', 'Statt eines Autos kaufte sie ein Fahrrad.'],
  ['aufgrund', 'G', 'due to', 'Aufgrund des Streiks fallen Züge aus.'], ['innerhalb', 'G', 'within', 'Innerhalb eines Monats muss er umziehen.'],
  ['außerhalb', 'G', 'outside of', 'Wir wohnen außerhalb der Stadt.'], ['infolge', 'G', 'as a result of', 'Infolge des Unfalls war die Straße gesperrt.'],
  ['angesichts', 'G', 'in view of', 'Angesichts der Lage handeln wir sofort.'], ['bezüglich', 'G', 'regarding', 'Bezüglich Ihrer Anfrage melden wir uns.'],
  ['anlässlich', 'G', 'on the occasion of', 'Anlässlich seines Geburtstags gab es ein Fest.'], ['mithilfe', 'G', 'with the help of', 'Mithilfe eines Wörterbuchs übersetzte sie den Text.'],
];
GT.ref.preps[3][3] = 'Ich trinke Kaffee nie ohne einen Keks.';

// [Hauptsatz, Konnektor, Typ (sub = Verb am Ende, inv = Inversion, main = normale Stellung), [Subjekt, finites Verb, Mittelfeld, Infinitiv/Partizip], English]
GT.ref.connectors = [
  ['Ich bleibe heute zu Hause', 'weil', 'sub', ['ich', 'bin', 'krank'], '… because I am ill'],
  ['Ich bin krank', 'deshalb', 'inv', ['ich', 'bleibe', 'heute zu Hause'], '… therefore I am staying at home'],
  ['Ich bin krank', 'aber', 'main', ['ich', 'gehe', 'trotzdem zur Arbeit'], '… but I am going to work anyway'],
  ['Er geht spazieren', 'obwohl', 'sub', ['es', 'regnet', 'stark'], '… although it is raining heavily'],
  ['Es regnet stark', 'trotzdem', 'inv', ['er', 'geht', 'spazieren'], '… nevertheless he goes for a walk'],
  ['Wir lernen Deutsch', 'denn', 'main', ['wir', 'wollen', 'in Berlin', 'arbeiten'], '… because we want to work in Berlin'],
  ['Sie sagt', 'dass', 'sub', ['sie', 'hat', 'morgen keine Zeit'], '… that she has no time tomorrow'],
  ['Ich weiß nicht', 'ob', 'sub', ['der Zug', 'kommt', 'pünktlich'], '… whether the train will be on time'],
  ['Ruf mich an', 'wenn', 'sub', ['du', 'bist', 'zu Hause'], '… when you are at home'],
  ['Der Bus ist schon weg', 'also', 'inv', ['wir', 'müssen', 'zu Fuß', 'gehen'], '… so we have to walk'],
  ['Ich habe wenig Geld', 'sonst', 'inv', ['ich', 'würde', 'eine Weltreise', 'machen'], '… otherwise I would travel the world'],
  ['Wir gehen ins Kino', 'oder', 'main', ['wir', 'bleiben', 'zu Hause'], '… or we stay at home'],
  ['Er trinkt keinen Kaffee', 'sondern', 'main', ['er', 'trinkt', 'Tee'], '… but (rather) he drinks tea'],
  ['Sie lernt jeden Tag', 'damit', 'sub', ['sie', 'besteht', 'die Prüfung'], '… so that she passes the exam'],
  ['Ich lese die Zeitung', 'während', 'sub', ['mein Mann', 'kocht', 'das Abendessen'], '… while my husband cooks dinner'],
  ['Ich hatte keine Zeit', 'deswegen', 'inv', ['ich', 'habe', 'dich nicht', 'angerufen'], '… that is why I did not call you'],
  ['Wir warten hier', 'bis', 'sub', ['du', 'bist', 'fertig'], '… until you are ready'],
  ['Sie hat die Stelle bekommen', 'weil', 'sub', ['sie', 'hat', 'sehr gut', 'verhandelt'], '… because she negotiated very well'],
  ['Das Wetter war schlecht', 'dennoch', 'inv', ['wir', 'sind', 'an den Strand', 'gefahren'], '… nevertheless we drove to the beach'],
  ['Ich frage mich', 'warum', 'sub', ['er', 'hat', 'nicht', 'geantwortet'], '… why he did not answer'],
  ['Die Mieten steigen', 'folglich', 'inv', ['viele Familien', 'ziehen', 'aufs Land'], '… consequently many families move to the countryside'],
  ['Er hat lange gesucht', 'bevor', 'sub', ['er', 'hat', 'eine Wohnung', 'gefunden'], '… before he found a flat'],
  ['Ich komme mit', 'falls', 'sub', ['ich', 'habe', 'früher Feierabend'], '… in case I finish work earlier'],
  ['Sie spricht fließend Deutsch', 'außerdem', 'inv', ['sie', 'kann', 'etwas Japanisch'], '… moreover she can speak some Japanese'],
];

// Additional high-frequency nouns for the gender trainer
GT.ref.nouns = [
  ['der Tag', 'day'], ['die Woche', 'week'], ['das Jahr', 'year'], ['der Monat', 'month'], ['die Zeit', 'time'], ['das Leben', 'life'],
  ['die Welt', 'world'], ['das Land', 'country'], ['die Stadt', 'city'], ['das Dorf', 'village'], ['der Weg', 'way, path'], ['die Straße', 'street'],
  ['das Haus', 'house'], ['die Wohnung', 'flat'], ['das Zimmer', 'room'], ['die Tür', 'door'], ['das Fenster', 'window'], ['der Schlüssel', 'key'],
  ['der Tisch', 'table'], ['der Stuhl', 'chair'], ['das Bett', 'bed'], ['die Lampe', 'lamp'], ['der Schrank', 'cupboard'], ['das Sofa', 'sofa'],
  ['die Arbeit', 'work'], ['der Beruf', 'profession'], ['die Firma', 'company'], ['das Büro', 'office'], ['der Chef', 'boss'], ['das Gehalt', 'salary'],
  ['die Schule', 'school'], ['der Unterricht', 'lessons'], ['die Prüfung', 'exam'], ['das Ergebnis', 'result'], ['die Sprache', 'language'], ['das Wort', 'word'],
  ['der Satz', 'sentence'], ['die Frage', 'question'], ['die Antwort', 'answer'], ['das Problem', 'problem'], ['die Lösung', 'solution'], ['der Grund', 'reason'],
  ['das Essen', 'food'], ['das Brot', 'bread'], ['der Käse', 'cheese'], ['die Butter', 'butter'], ['das Ei', 'egg'], ['der Apfel', 'apple'],
  ['die Milch', 'milk'], ['das Wasser', 'water'], ['der Kaffee', 'coffee'], ['der Tee', 'tea'], ['das Bier', 'beer'], ['der Wein', 'wine'],
  ['der Körper', 'body'], ['der Kopf', 'head'], ['die Hand', 'hand'], ['das Auge', 'eye'], ['das Ohr', 'ear'], ['der Fuß', 'foot'],
  ['das Herz', 'heart'], ['die Nase', 'nose'], ['der Mund', 'mouth'], ['das Gesicht', 'face'], ['der Arm', 'arm'], ['das Bein', 'leg'],
  ['das Auto', 'car'], ['der Zug', 'train'], ['der Bus', 'bus'], ['das Fahrrad', 'bicycle'], ['das Flugzeug', 'aeroplane'], ['die U-Bahn', 'underground'],
  ['das Wetter', 'weather'], ['der Regen', 'rain'], ['der Schnee', 'snow'], ['die Sonne', 'sun'], ['der Mond', 'moon'], ['der Wind', 'wind'],
  ['das Geld', 'money'], ['die Rechnung', 'bill'], ['der Preis', 'price'], ['die Freiheit', 'freedom'], ['die Gesundheit', 'health'], ['die Freundschaft', 'friendship'],
  ['das Mädchen', 'girl'], ['das Brötchen', 'bread roll'], ['der Frühling', 'spring'], ['der Lehrling', 'apprentice'], ['das Zentrum', 'centre'], ['das Museum', 'museum'],
  ['das Dokument', 'document'], ['das Instrument', 'instrument'], ['der Motor', 'engine'], ['der Honig', 'honey'], ['der Teppich', 'carpet'], ['die Universität', 'university'],
  ['die Musik', 'music'], ['die Kultur', 'culture'], ['die Information', 'information'], ['die Chance', 'chance'], ['die Bäckerei', 'bakery'], ['das Thema', 'topic'],
  ['das Gebäude', 'building'], ['das Gemüse', 'vegetables'], ['der Käfig', 'cage'], ['der Tourismus', 'tourism'], ['der Optimist', 'optimist'], ['die Toleranz', 'tolerance'],
  ['der Name', 'name'], ['der Gedanke', 'thought'], ['das Ende', 'end'], ['das Interesse', 'interest'], ['der Junge', 'boy'], ['der Löwe', 'lion'],
  ['das Messer', 'knife'], ['die Gabel', 'fork'], ['der Löffel', 'spoon'], ['die Tasse', 'cup'], ['das Mittel', 'means'], ['die Regel', 'rule'],
];

GT.ref.genderRules = [
  ['<b class="g-der">der</b>', 'Männliche Personen & Berufe (der Lehrer), Tage, Monate, Jahreszeiten, Himmelsrichtungen, Wetter (der Regen), Alkohol (der Wein – aber: das Bier), Automarken; Endungen <b>-ling, -ismus, -or, -ig, -ich, -ant, -ist, -eur</b>; die meisten Nomen aus Verbstamm ohne Endung (der Lauf, der Sprung)'],
  ['<b class="g-die">die</b>', 'Weibliche Personen (die Lehrerin), die meisten Bäume & Blumen, Zahlen (die Eins); Endungen <b>-ung, -heit, -keit, -schaft, -ion, -tät, -ik, -ur, -enz, -anz, -ei, -ie</b>; ca. 90 % der Nomen auf <b>-e</b> (Ausnahmen: der Name, der Junge, das Ende …)'],
  ['<b class="g-das">das</b>', 'Verkleinerungen <b>-chen, -lein</b> (das Mädchen), nominalisierte Infinitive (das Essen, das Lernen), Farben als Nomen (das Blau), Metalle, die meisten Länder & Städte, Hotels, Kinos; Endungen <b>-ment, -um, -tum, -ma</b>, oft <b>-nis</b>; viele Wörter mit <b>Ge-</b> (das Gebäude, das Gemüse)'],
  ['Komposita', 'Das <b>letzte</b> Wort bestimmt den Artikel: das Haus + <b>die Tür</b> = <b>die</b> Haustür.'],
];

/* ---------------- Placement test (5 items per level) ---------------- */
GT.ref.placement = [
  { lvl: 'A2', q: 'Gestern ___ ich ins Kino gegangen.', o: ['bin', 'habe', 'war', 'hatte'], a: 0, e: 'Bewegungsverben bilden das Perfekt mit „sein“.' },
  { lvl: 'A2', q: 'Ich helfe ___ Mutter beim Kochen.', o: ['meiner', 'meine', 'meinen', 'mein'], a: 0, e: '„helfen“ + Dativ: meiner Mutter.' },
  { lvl: 'A2', q: 'Ich lerne Deutsch, weil ich in Deutschland ___.', o: ['arbeiten will', 'will arbeiten', 'arbeite wollen', 'wollen arbeiten'], a: 0, e: 'Im weil-Satz steht das konjugierte Verb am Ende.' },
  { lvl: 'A2', q: 'Das Wetter ist heute ___ als gestern.', o: ['besser', 'gut', 'am besten', 'guter'], a: 0, e: 'Komparativ von „gut“: besser.' },
  { lvl: 'A2', q: 'Wir treffen uns ___ Montag um acht Uhr.', o: ['am', 'im', 'um', 'zu'], a: 0, e: 'Wochentage: am Montag.' },
  { lvl: 'B1', q: 'Das ist der Mann, ___ ich gestern geholfen habe.', o: ['dem', 'den', 'der', 'dessen'], a: 0, e: 'helfen + Dativ → Relativpronomen „dem“.' },
  { lvl: 'B1', q: 'Wenn ich mehr Zeit ___, würde ich mehr reisen.', o: ['hätte', 'habe', 'hatte', 'haben'], a: 0, e: 'Irrealer Bedingungssatz: Konjunktiv II „hätte“.' },
  { lvl: 'B1', q: 'Das Haus ___ 1990 gebaut.', o: ['wurde', 'wird', 'hat', 'ist'], a: 0, e: 'Passiv Präteritum: wurde + Partizip II.' },
  { lvl: 'B1', q: 'Ich habe keine Lust, heute ___.', o: ['zu kochen', 'kochen', 'zum kochen', 'kochen zu'], a: 0, e: 'Lust haben + zu + Infinitiv.' },
  { lvl: 'B1', q: 'Mit einem ___ Auto fährt man sicherer.', o: ['neuen', 'neues', 'neue', 'neuer'], a: 0, e: 'Dativ nach „einem“ → -en.' },
  { lvl: 'B2', q: '___ des schlechten Wetters fand das Konzert statt.', o: ['Trotz', 'Wegen', 'Obwohl', 'Während'], a: 0, e: '„trotz“ + Genitiv drückt einen Gegensatz aus.' },
  { lvl: 'B2', q: 'Wenn ich das gewusst ___, wäre ich gekommen.', o: ['hätte', 'habe', 'würde', 'wäre'], a: 0, e: 'Konjunktiv II Vergangenheit: hätte + Partizip II.' },
  { lvl: 'B2', q: 'Je mehr man übt, ___ besser spricht man.', o: ['desto', 'als', 'so', 'wie'], a: 0, e: 'Zweiteiliger Konnektor: je … desto/umso.' },
  { lvl: 'B2', q: 'Die Rechnung muss bis Freitag bezahlt ___.', o: ['werden', 'worden', 'wurden', 'sein'], a: 0, e: 'Passiv mit Modalverb: Partizip II + werden.' },
  { lvl: 'B2', q: 'Das ___ Kind schläft endlich.', o: ['weinende', 'geweinte', 'weinend', 'weinenden'], a: 0, e: 'Partizip I als Adjektiv („das Kind, das weint“) + Endung -e.' },
  { lvl: 'C1', q: 'Der Minister sagte, er ___ von nichts gewusst.', o: ['habe', 'hat', 'hatte', 'wäre'], a: 0, e: 'Indirekte Rede: Konjunktiv I „habe“.' },
  { lvl: 'C1', q: 'Die von der Regierung ___ Reform stößt auf Kritik.', o: ['geplante', 'planende', 'geplant', 'geplanten'], a: 0, e: 'Erweitertes Partizipialattribut: die (von der Regierung geplante) Reform.' },
  { lvl: 'C1', q: 'Er ___ schon zu Hause sein – sein Auto steht vor der Tür.', o: ['muss', 'soll', 'will', 'darf'], a: 0, e: 'Subjektives „müssen“ = starke Vermutung (fast sicher).' },
  { lvl: 'C1', q: 'Komm ___ mal vorbei, wenn du Zeit hast!', o: ['doch', 'denn', 'ja', 'eben'], a: 0, e: 'Modalpartikel „doch“ macht eine Aufforderung freundlich.' },
  { lvl: 'C1', q: 'Die Entscheidung ___ einer gründlichen Prüfung.', o: ['bedarf', 'braucht', 'benötigt', 'verlangt'], a: 0, e: '„bedürfen“ verlangt den Genitiv (einer Prüfung).' },
  { lvl: 'C2', q: 'Er hat bei seinem Chef einen Stein im ___.', o: ['Brett', 'Garten', 'Schuh', 'Weg'], a: 0, e: 'Redewendung: einen Stein im Brett haben = sehr beliebt sein.' },
  { lvl: 'C2', q: 'Die Verhandlungen sind ins ___ geraten.', o: ['Stocken', 'Stoppen', 'Halten', 'Stehen'], a: 0, e: 'Feste Verbindung: ins Stocken geraten.' },
  { lvl: 'C2', q: 'Sie hat das Angebot ___ abgelehnt – ohne lange zu zögern.', o: ['kurzerhand', 'kurzfristig', 'kürzlich', 'kurzweilig'], a: 0, e: 'kurzerhand = schnell und ohne Überlegung.' },
  { lvl: 'C2', q: '___ er sich auch bemühte, es gelang ihm nicht.', o: ['So sehr', 'Obwohl', 'Trotzdem', 'Wenn'], a: 0, e: 'Konzessiver Satz „so sehr … auch“ + nicht-integrierter Hauptsatz.' },
  { lvl: 'C2', q: 'Die Zahl der Arbeitslosen ist ___ gesunken.', o: ['merklich', 'merkwürdig', 'bemerkenswürdig', 'vermerkt'], a: 0, e: 'merklich = spürbar; merkwürdig = seltsam.' },
];

/* ---------------- Method page ---------------- */
GT.ref.method = `
<h2>🧪 Warum DeutschWeg so aufgebaut ist</h2>
<p>DeutschWeg kombiniert die Stärken bekannter Plattformen (kurze Lektionen wie bei Duolingo, Spaced Repetition wie bei Anki, Lücken­texte wie bei Clozemaster, Lesen mit Wortschatz­hilfe wie bei LingQ, klare Grammatik wie bei Babbel und der DW) mit Methoden, deren Wirksamkeit in der Lern­forschung gut belegt ist.</p>
<table>
<tr><th>Prinzip</th><th>Was es bedeutet</th><th>Wo du es hier findest</th></tr>
<tr><td><b>Verteiltes Wiederholen</b> (Spacing-Effekt)</td><td>Wiederholungen mit wachsenden Abständen schlagen „Pauken“ deutlich. Der Algorithmus zeigt dir jedes Wort kurz bevor du es vergessen würdest.</td><td>🔁 Wiederholen</td></tr>
<tr><td><b>Abrufübung</b> (Testing-Effekt)</td><td>Aktives Erinnern verankert Wissen stärker als erneutes Lesen. Darum fragt die App fast immer, statt nur zu zeigen.</td><td>🧠 Üben, 🏁 Tests</td></tr>
<tr><td><b>Verschachteltes Üben</b> (Interleaving)</td><td>Gemischte Aufgaben­typen und Themen trainieren, <i>wann</i> man welche Regel anwendet.</td><td>Alle Übungen sind gemischt</td></tr>
<tr><td><b>Wünschenswerte Erschwernisse</b></td><td>Erst Wiedererkennen, dann selbst schreiben, dann hören – die Aufgaben werden mit deinem Fortschritt schwerer.</td><td>Wiederholungs­karten</td></tr>
<tr><td><b>Sofortiges Feedback & Fehlerbank</b></td><td>Fehler werden sofort erklärt und später gezielt wiederholt.</td><td>🎯 Fehler-Training</td></tr>
<tr><td><b>Verständlicher Input</b> (i + 1)</td><td>Viel lesen und hören, was knapp über deinem Niveau liegt.</td><td>📰 Lesen, 🎧 Hören</td></tr>
<tr><td><b>Output</b></td><td>Erst beim Sprechen und Schreiben merkst du, was dir fehlt.</td><td>✍️ Schreiben, 🗣️ Shadowing</td></tr>
<tr><td><b>Mastery Learning</b></td><td>Nächster Schritt erst, wenn der aktuelle sitzt (≥ 80 %). Wer schon mehr kann, springt per Test weiter.</td><td>🏁 Abschlusstest, 🎓 Niveau-Prüfung</td></tr>
<tr><td><b>Häufigkeit zuerst</b></td><td>Wenige tausend häufige Wörter decken den Großteil normaler Texte ab. Wortschatz ist nach Thema & Nützlichkeit ausgewählt.</td><td>🗂️ Wortschatz</td></tr>
<tr><td><b>Gewohnheit</b></td><td>Täglich kurz lernen schlägt selten lang lernen. Tagesziel & Serie helfen dir dranzubleiben.</td><td>🔥 Serie, Tagesziel</td></tr>
</table>

<h2>🗓️ Dein idealer Lerntag (15–30 Minuten)</h2>
<ol>
<li><b>Zuerst Wiederholungen</b> (5–10 Min.) – fällige Karten nie aufschieben, sonst stauen sie sich.</li>
<li><b>Ein Schritt in der aktuellen Lektion</b> (10–15 Min.).</li>
<li><b>Ein kurzes Training</b> für deine schwächste Fertigkeit (siehe 📈 Fortschritt).</li>
<li><b>Bonus:</b> 10 Minuten echtes Deutsch hören oder lesen (Tipps unten).</li>
</ol>

<h2>🎯 Tipps für schnellen Fortschritt</h2>
<ul>
<li><b>Laut sprechen.</b> Lies Beispielsätze laut, sprich bei jedem neuen Wort mit. Shadowing (gleichzeitig mit dem Audio sprechen) verbessert Aussprache und Hörverstehen.</li>
<li><b>Nomen immer mit Artikel</b> lernen – und mit Plural, sobald du B1 bist.</li>
<li><b>Satz statt Wort:</b> Merke dir Wörter in einem Beispielsatz („Chunks“), nicht isoliert.</li>
<li><b>Fehler lieben.</b> Jeder Fehler wird zu einer Wiederholungskarte. Das ist genau der Teil, wo du lernst.</li>
<li><b>Schreib täglich 3 Sätze</b> über deinen Tag – und lass sie korrigieren (Tandempartner, Lehrkraft oder KI). Schreib die korrigierte Version noch einmal ab.</li>
<li><b>Ab B1:</b> Stell dein Handy auf Deutsch, schau Serien mit deutschen Untertiteln.</li>
<li><b>Ab B2:</b> Lies Nachrichten und Sachtexte, sammle Redemittel für Diskussionen.</li>
<li><b>Ab C1:</b> Achte auf Register (formell/informell), Nominalstil und Nuancen; lies Literatur und Kommentare.</li>
</ul>

<h2>🌍 Ergänzende Quellen (kostenlos)</h2>
<table>
<tr><th>Niveau</th><th>Hören & Sehen</th><th>Lesen</th></tr>
<tr><td>A2–B1</td><td>DW „Nicos Weg“, „Easy German“ (YouTube), Podcast „Slow German“</td><td>nachrichtenleicht.de, DW „Top-Thema“</td></tr>
<tr><td>B1–B2</td><td>DW „Langsam gesprochene Nachrichten“, „Tagesschau in 100 Sekunden“, Kinderserien („Die Sendung mit der Maus“)</td><td>DW „Deutsch Aktuell“, Kinder- & Jugendbücher</td></tr>
<tr><td>C1–C2</td><td>Tagesschau, Deutschlandfunk, Podcasts zu deinen Hobbys, ARD/ZDF-Mediathek</td><td>Zeitungen (Zeit, SZ, FAZ), Sachbücher, Romane</td></tr>
</table>
<p>Zertifikate, die zu den Niveaus passen: Goethe-Zertifikat, telc, ÖSD, TestDaF (B2–C1) und DSH (Hochschulzugang).</p>

<h2>⌨️ Tastenkürzel</h2>
<p><kbd>Enter</kbd> prüfen / weiter · <kbd>1</kbd>–<kbd>4</kbd> Antwort wählen · <kbd>Esc</kbd> Übung beenden</p>
`;
