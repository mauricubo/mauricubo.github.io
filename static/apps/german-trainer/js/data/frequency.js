/* ==========================================================================
   DeutschWeg – the most frequent German words
   Roughly ordered by frequency in written and spoken German (compiled after
   the usual corpus frequency dictionaries; the exact order is approximate).
   One line per word:  German | English | type | theme | emoji | example
   type:  art pron prep konj adv part v n npl (plural noun) adj num
   ========================================================================== */
window.GT = window.GT || {};

GT.FREQ_THEMES = {
  pro: { name: 'Pronomen & Artikel', icon: '👉' },
  pra: { name: 'Präpositionen', icon: '📍' },
  kon: { name: 'Verbindungswörter', icon: '🔗' },
  par: { name: 'Kleine Wörter', icon: '✨' },
  ver: { name: 'Grundverben', icon: '⚙️' },
  bew: { name: 'Bewegung & Lage', icon: '🏃' },
  kom: { name: 'Sagen, Denken, Wahrnehmen', icon: '💬' },
  zeit: { name: 'Zeit', icon: '⏰' },
  ort: { name: 'Orte & Raum', icon: '🗺️' },
  men: { name: 'Menschen & Familie', icon: '👪' },
  leb: { name: 'Körper, Leben & Gefühle', icon: '❤️' },
  arb: { name: 'Arbeit, Geld & Gesellschaft', icon: '💼' },
  all: { name: 'Alltag & Dinge', icon: '🏠' },
  eig: { name: 'Eigenschaften', icon: '🎨' },
  zah: { name: 'Zahlen & Mengen', icon: '🔢' },
  abs: { name: 'Ideen & Abstraktes', icon: '💡' },
};

GT.FREQ_RAW = `
der, die, das|the|art|pro||Der Mann, die Frau und das Kind warten.
und|and|konj|kon||Ich trinke Kaffee und lese die Zeitung.
sein|to be|v|ver||Das Wetter ist heute schön.
in|in, into|prep|pra||Wir wohnen in Berlin.
ein, eine|a, an; one|art|pro||Ich habe eine Frage.
zu|to; too|prep|pra||Ich gehe zu meiner Mutter.
haben|to have|v|ver||Hast du heute Zeit?
ich|I|pron|pro||Ich komme aus Spanien.
werden|to become; will|v|ver||Es wird langsam dunkel.
sie|she; they|pron|pro||Sie arbeitet in einer Bank.
von|from; of|prep|pra||Das ist ein Geschenk von meinem Vater.
nicht|not|adv|par||Ich verstehe das nicht.
mit|with|prep|pra||Kommst du mit mir ins Kino?
es|it|pron|pro||Es regnet schon den ganzen Tag.
sich|oneself, himself, herself|pron|pro||Er freut sich auf den Urlaub.
auch|also, too|adv|par||Ich komme auch mit.
auf|on, onto|prep|pra||Das Buch liegt auf dem Tisch.
für|for|prep|pra||Das Geschenk ist für dich.
an|at, on (vertical)|prep|pra||Das Bild hängt an der Wand.
er|he|pron|pro||Er spielt gern Fußball.
so|so, like this|adv|par||Mach es bitte so.
dass|that (conjunction)|konj|kon||Ich glaube, dass er recht hat.
können|can, to be able to|v|ver||Kannst du mir helfen?
dieser|this|pron|pro||Dieser Film ist wirklich gut.
als|as; than; when (past)|konj|kon||Sie ist älter als ich.
ihr|you (plural); her; their|pron|pro||Habt ihr schon gegessen?
ja|yes|part|par|👍|Ja, das stimmt.
wie|how; like|adv|par||Wie geht es dir?
bei|at, near, with|prep|pra||Ich wohne noch bei meinen Eltern.
oder|or|konj|kon||Möchtest du Tee oder Kaffee?
wir|we|pron|pro||Wir fahren morgen nach Hamburg.
aber|but|konj|kon||Das Essen ist gut, aber teuer.
dann|then|adv|zeit||Erst essen wir, dann gehen wir spazieren.
man|one, you (people in general)|pron|pro||Hier darf man nicht rauchen.
da|there; since (because)|adv|ort||Da ist der Bahnhof.
sein, seine|his, its|pron|pro||Er sucht seinen Schlüssel.
noch|still; yet|adv|par||Bist du noch wach?
nach|after; to (cities, countries)|prep|pra||Nach dem Essen fahren wir nach Wien.
was|what|pron|pro|❓|Was machst du am Wochenende?
also|so, therefore|adv|kon||Es regnet, also bleiben wir zu Hause.
aus|out of; from|prep|pra||Sie kommt aus Italien.
alle|all, everyone|pron|pro||Alle sind eingeladen.
wenn|if; whenever|konj|kon||Wenn du Zeit hast, ruf mich an.
nur|only, just|adv|par||Ich habe nur fünf Euro.
müssen|must, to have to|v|ver||Ich muss morgen früh aufstehen.
sagen|to say|v|kom|💬|Was hast du gerade gesagt?
um|around; at (clock time)|prep|pra||Der Film beginnt um acht Uhr.
über|over, above; about|prep|pra||Wir sprechen über das Wetter.
machen|to make, to do|v|ver|🛠️|Was machst du heute Abend?
kein, keine|no, not a|pron|pro|🚫|Ich habe keine Zeit.
das Jahr|year|n|zeit|📅|Das Jahr hat zwölf Monate.
du|you (informal)|pron|pro||Kommst du heute?
mein, meine|my|pron|pro||Das ist mein Bruder.
schon|already|adv|zeit||Bist du schon fertig?
vor|in front of; before; ago|prep|pra||Vor drei Jahren war ich in Rom.
durch|through|prep|pra||Wir gehen durch den Park.
geben|to give|v|ver|🎁|Kannst du mir das Salz geben?
mehr|more|adv|zah|➕|Ich brauche mehr Zeit.
andere|other|adj|eig||Die anderen kommen später.
viel|much, a lot|adj|zah||Danke, das ist sehr viel.
kommen|to come|v|bew|👋|Wann kommst du nach Hause?
jetzt|now|adv|zeit||Ich habe jetzt keine Zeit.
sollen|should, to be supposed to|v|ver||Du sollst mehr Wasser trinken.
wollen|to want|v|ver||Ich will Deutsch lernen.
ganz|whole; quite|adj|eig||Ich habe den ganzen Tag gearbeitet.
immer|always|adv|zeit|♾️|Er kommt immer zu spät.
gehen|to go, to walk|v|bew|🚶|Wir gehen zu Fuß.
sehen|to see|v|kom|👀|Ich sehe dich morgen.
neu|new|adj|eig|🆕|Ich habe ein neues Handy.
gut|good; well|adj|eig|👍|Das Essen schmeckt gut.
unter|under; among|prep|pra||Die Katze schläft unter dem Bett.
sehr|very|adv|par||Das ist sehr nett von dir.
selbst|self; even|adv|par||Das mache ich selbst.
bis|until; by|prep|pra||Bis morgen!
hier|here|adv|ort|📍|Wohnst du hier?
groß|big; tall|adj|eig|🐘|Unser Garten ist sehr groß.
das Mal|time (occasion)|n|zeit||Das war das erste Mal.
zwei|two|num|zah|✌️|Ich habe zwei Brüder.
gegen|against; around (time)|prep|pra||Wir spielen gegen Bayern.
zwischen|between|prep|pra||Die Bank steht zwischen den Bäumen.
erst|first; only (not until)|adv|zeit||Ich komme erst um zehn.
wo|where|adv|ort||Wo ist der Bahnhof?
heute|today|adv|zeit||Heute ist Montag.
weil|because|konj|kon||Ich bleibe zu Hause, weil ich krank bin.
lassen|to let; to leave|v|ver||Lass mich in Ruhe!
stehen|to stand|v|bew|🧍|Die Flasche steht im Kühlschrank.
finden|to find; to think (opinion)|v|ver||Ich finde meinen Schlüssel nicht.
bleiben|to stay, to remain|v|bew||Wir bleiben noch eine Woche.
der Mensch|human being, person|n|men|🧑|Jeder Mensch ist anders.
dürfen|may, to be allowed to|v|ver||Darf ich hier parken?
nun|now; well…|adv|zeit||Nun, was machen wir jetzt?
die Zeit|time|n|zeit|⏰|Ich habe leider keine Zeit.
eigen|own|adj|eig||Sie hat eine eigene Wohnung.
liegen|to lie, to be located|v|bew|🛌|Das Handy liegt auf dem Tisch.
heißen|to be called|v|kom|🏷️|Wie heißt du?
doch|but; yes (contradicting)|part|par||Kommst du nicht? – Doch!
einmal|once|adv|zeit|1️⃣|Ich war einmal in Paris.
die Frau|woman; wife; Mrs|n|men|👩|Die Frau dort ist meine Lehrerin.
der Mann|man; husband|n|men|👨|Der Mann liest die Zeitung.
nehmen|to take|v|ver|🤲|Ich nehme den Bus.
tun|to do|v|ver||Was kann ich für Sie tun?
das Kind|child|n|men|🧒|Das Kind spielt im Garten.
denn|for (because); then (in questions)|konj|kon||Wo warst du denn?
bringen|to bring|v|bew|📦|Bringst du bitte das Brot mit?
wissen|to know (a fact)|v|kom|💡|Ich weiß es nicht.
der Tag|day|n|zeit|☀️|Guten Tag!
jeder, jede|every, each|pron|pro||Ich lerne jeden Tag Deutsch.
klein|small, little|adj|eig|🐭|Wir haben eine kleine Wohnung.
wieder|again|adv|zeit|🔁|Ich komme bald wieder.
alt|old|adj|eig|👴|Das Haus ist sehr alt.
weit|far; wide|adj|ort|🔭|Ist es noch weit?
halten|to hold; to stop|v|bew|✋|Der Bus hält hier.
lang|long|adj|eig|📏|Das war ein langer Tag.
sprechen|to speak|v|kom|🗣️|Sprechen Sie Deutsch?
das Land|country; countryside|n|ort|🏞️|Deutschland ist ein schönes Land.
die Hand|hand|n|leb|✋|Gib mir die Hand.
zeigen|to show|v|kom|👉|Kannst du mir den Weg zeigen?
deutsch|German|adj|eig|🇩🇪|Ich lese gern deutsche Bücher.
die Frage|question|n|kom|❓|Ich habe eine Frage.
das Leben|life|n|leb|🌱|Das Leben ist schön.
hoch|high|adj|eig|🏔️|Der Berg ist sehr hoch.
drei|three|num|zah|3️⃣|Wir bleiben drei Tage.
die Welt|world|n|ort|🌍|Sie will die Welt sehen.
die Stadt|city, town|n|ort|🏙️|Ich wohne in der Stadt.
kennen|to know (be familiar with)|v|kom|🤝|Kennst du meinen Bruder?
spielen|to play|v|all|⚽|Die Kinder spielen draußen.
dort|there (over there)|adv|ort||Dort drüben ist die Post.
richtig|right, correct|adj|eig|✅|Die Antwort ist richtig.
fragen|to ask|v|kom|🙋|Darf ich dich etwas fragen?
glauben|to believe|v|kom|🙏|Ich glaube dir.
bekommen|to get, to receive|v|ver|📬|Ich habe einen Brief bekommen.
das Haus|house|n|all|🏠|Wir haben ein Haus gekauft.
der Herr|gentleman; Mr|n|men|🎩|Guten Tag, Herr Müller!
letzter|last|adj|zeit||Letzte Woche war ich krank.
der Teil|part|n|zah|🧩|Ein Teil der Arbeit ist fertig.
ohne|without|prep|pra||Ich trinke Kaffee ohne Zucker.
die Seite|side; page|n|ort|📄|Lies bitte Seite zehn.
denken|to think|v|kom|💭|Ich denke oft an dich.
der Weg|way, path|n|ort|🛤️|Ich kenne den Weg.
das Ende|end|n|zeit|🏁|Am Ende war alles gut.
die Arbeit|work; job|n|arb|💼|Ich fahre mit dem Rad zur Arbeit.
das Problem|problem|n|abs|⚠️|Kein Problem!
der Grund|reason; ground|n|abs||Aus welchem Grund?
der Fall|case; fall|n|abs||Auf jeden Fall komme ich.
das Beispiel|example|n|abs||Zum Beispiel Äpfel oder Birnen.
die Sache|thing, matter|n|abs||Das ist eine gute Sache.
die Art|kind, type; manner|n|abs||Welche Art von Musik hörst du?
nein|no|part|par|👎|Nein, danke.
warum|why|adv|par|🤔|Warum lernst du Deutsch?
wann|when (question)|adv|zeit||Wann beginnt der Kurs?
mal|times; just (softener)|part|par||Komm mal her!
die Uhr|clock, watch; o'clock|n|zeit|🕒|Es ist drei Uhr.
schön|beautiful, nice|adj|eig|🌸|Was für ein schöner Tag!
wichtig|important|adj|eig|❗|Das ist sehr wichtig.
möglich|possible|adj|abs||Ist das möglich?
einige|some, a few|pron|zah||Ich habe einige Fragen.
schnell|fast, quick|adj|eig|⚡|Fahr nicht so schnell!
genau|exact(ly)|adj|eig|🎯|Genau, so ist es.
früh|early|adj|zeit|🐓|Ich stehe immer früh auf.
spät|late|adj|zeit|🦉|Es ist schon spät.
ob|whether, if|konj|kon||Ich weiß nicht, ob er kommt.
während|during; while|prep|pra||Während des Essens telefoniert man nicht.
seit|since; for (time)|prep|pra||Ich lerne seit zwei Jahren Deutsch.
gerade|just (now); straight|adv|zeit||Ich esse gerade.
bereits|already (formal)|adv|zeit||Der Zug ist bereits abgefahren.
etwa|about, approximately|adv|zah||Die Fahrt dauert etwa eine Stunde.
etwas|something; somewhat|pron|pro||Möchtest du etwas trinken?
nichts|nothing|pron|pro|🕳️|Ich habe nichts gehört.
wer|who|pron|pro||Wer ist das?
sondern|but (rather)|konj|kon||Nicht heute, sondern morgen.
jedoch|however|konj|kon||Das Hotel war teuer, jedoch sehr schön.
die Familie|family|n|men|👪|Meine Familie wohnt in München.
die Eltern|parents|npl|men|👫|Meine Eltern sind im Urlaub.
die Mutter|mother|n|men|👩‍👧|Meine Mutter kocht sehr gut.
der Vater|father|n|men|👨‍👦|Mein Vater arbeitet bei der Bahn.
der Sohn|son|n|men|👦|Ihr Sohn studiert in Köln.
die Tochter|daughter|n|men|👧|Unsere Tochter ist drei Jahre alt.
der Bruder|brother|n|men||Mein Bruder ist älter als ich.
die Schwester|sister|n|men||Meine Schwester wohnt in Wien.
der Freund|friend; boyfriend|n|men|🤝|Er ist mein bester Freund.
der Name|name|n|kom|🏷️|Wie ist Ihr Name?
das Auge|eye|n|leb|👁️|Sie hat blaue Augen.
der Kopf|head|n|leb|🤯|Mir tut der Kopf weh.
das Herz|heart|n|leb|❤️|Sie hat ein gutes Herz.
das Wasser|water|n|all|💧|Ein Glas Wasser, bitte.
das Geld|money|n|arb|💶|Ich habe kein Geld mehr.
der Euro|euro|n|arb|💶|Das kostet zehn Euro.
das Prozent|percent|n|zah|💯|Die Preise sind um fünf Prozent gestiegen.
die Million|million|n|zah||Die Stadt hat drei Millionen Einwohner.
die Zahl|number|n|zah|🔢|Sieben ist meine Glückszahl.
vier|four|num|zah|4️⃣|Wir sind vier Personen.
fünf|five|num|zah|🖐️|Der Bus kommt in fünf Minuten.
zehn|ten|num|zah|🔟|Der Kurs dauert zehn Wochen.
hundert|hundred|num|zah||Das Haus ist hundert Jahre alt.
tausend|thousand|num|zah||Tausend Dank!
erste|first|adj|zah|🥇|Das ist mein erster Tag hier.
zweite|second|adj|zah|🥈|Wir wohnen im zweiten Stock.
halb|half|adj|zah|🌗|Es ist halb drei.
die Woche|week|n|zeit|🗓️|Ich arbeite fünf Tage pro Woche.
der Monat|month|n|zeit|📆|Nächsten Monat ziehe ich um.
die Stunde|hour; lesson|n|zeit|⏳|Ich warte seit einer Stunde.
die Minute|minute|n|zeit|⏱️|Ich bin in fünf Minuten da.
der Abend|evening|n|zeit|🌆|Guten Abend!
der Morgen|morning|n|zeit|🌅|Guten Morgen!
die Nacht|night|n|zeit|🌙|Gute Nacht!
morgen|tomorrow|adv|zeit||Bis morgen!
gestern|yesterday|adv|zeit||Gestern war ich im Kino.
bald|soon|adv|zeit||Bis bald!
oft|often|adv|zeit||Wir gehen oft ins Kino.
nie|never|adv|zeit||Ich war noch nie in Japan.
manchmal|sometimes|adv|zeit||Manchmal koche ich selbst.
lange|(for) a long time|adv|zeit|🐢|Ich habe lange gewartet.
der Moment|moment|n|zeit||Einen Moment, bitte!
der Anfang|beginning|n|zeit|🚩|Am Anfang war alles neu.
beginnen|to begin|v|zeit|▶️|Der Unterricht beginnt um neun.
aufhören|to stop, to quit|v|zeit|⏹️|Hör auf zu rauchen!
anfangen|to start|v|zeit||Wann fängst du mit der Arbeit an?
die Geschichte|story; history|n|kom|📖|Erzähl mir eine Geschichte.
das Wort|word|n|kom|🔤|Wie schreibt man dieses Wort?
die Sprache|language|n|kom|🌐|Deutsch ist eine schöne Sprache.
das Buch|book|n|all|📕|Ich lese gerade ein spannendes Buch.
der Brief|letter|n|all|✉️|Ich schreibe meiner Oma einen Brief.
lesen|to read|v|kom|📖|Ich lese jeden Morgen die Zeitung.
schreiben|to write|v|kom|✍️|Schreib mir eine Nachricht!
hören|to hear, to listen|v|kom|👂|Hörst du die Musik?
verstehen|to understand|v|kom|🧠|Ich verstehe dich nicht.
erklären|to explain|v|kom|🧑‍🏫|Kannst du mir das erklären?
antworten|to answer|v|kom||Bitte antworte mir bald.
die Antwort|answer|n|kom|💡|Danke für deine Antwort.
erzählen|to tell, to narrate|v|kom||Erzähl mal, wie war der Urlaub?
meinen|to mean; to think (opinion)|v|kom||Was meinst du damit?
die Meinung|opinion|n|kom||Meiner Meinung nach hast du recht.
lernen|to learn; to study|v|kom|🎓|Ich lerne jeden Tag zehn Wörter.
die Schule|school|n|arb|🏫|Die Kinder gehen in die Schule.
der Lehrer|teacher|n|men|🧑‍🏫|Unser Lehrer ist sehr geduldig.
die Universität|university|n|arb|🎓|Sie studiert an der Universität.
arbeiten|to work|v|arb|🛠️|Ich arbeite in einem Büro.
die Firma|firm, company|n|arb|🏢|Die Firma hat hundert Mitarbeiter.
das Unternehmen|enterprise, business|n|arb|🏭|Das Unternehmen wächst schnell.
der Markt|market|n|arb|🛒|Samstags gehe ich auf den Markt.
der Preis|price; prize|n|arb|🏷️|Der Preis ist zu hoch.
kaufen|to buy|v|arb|🛍️|Ich kaufe Brot beim Bäcker.
verkaufen|to sell|v|arb|🤑|Wir verkaufen unser altes Auto.
bezahlen|to pay|v|arb|💳|Kann ich mit Karte bezahlen?
kosten|to cost|v|arb|💸|Was kostet das?
der Staat|state (nation)|n|arb|🏛️|Der Staat baut neue Schulen.
die Regierung|government|n|arb||Die Regierung plant neue Gesetze.
die Politik|politics; policy|n|arb|🗳️|Interessierst du dich für Politik?
die Gesellschaft|society; company (firm)|n|arb||Wir leben in einer offenen Gesellschaft.
das Recht|right; law (system)|n|arb|⚖️|Jeder hat das Recht auf Bildung.
das Gesetz|law (a single law)|n|arb|📜|Das neue Gesetz gilt ab Januar.
der Krieg|war|n|arb|⚔️|Der Krieg dauerte sechs Jahre.
die Polizei|police|n|arb|🚓|Ruf sofort die Polizei!
die Partei|(political) party|n|arb||Welche Partei wählst du?
der Präsident|president|n|men||Der Präsident hält eine Rede.
die Gruppe|group|n|men|👥|Wir arbeiten in Gruppen.
die Leute|people|npl|men|🧑‍🤝‍🧑|Hier sind viele Leute.
der Kollege|colleague|n|men||Mein Kollege ist heute krank.
der Chef|boss|n|men|🧑‍💼|Mein Chef ist im Urlaub.
der Arzt|doctor|n|men|🩺|Du solltest zum Arzt gehen.
der Körper|body|n|leb|🧍|Sport ist gut für den Körper.
krank|ill, sick|adj|leb|🤒|Ich bin seit Montag krank.
gesund|healthy|adj|leb|🍏|Obst ist gesund.
sterben|to die|v|leb|🥀|Die Pflanze ist leider gestorben.
leben|to live, to be alive|v|leb|🌱|Wir leben seit zehn Jahren hier.
der Tod|death|n|leb|💀|Sein Tod war ein Schock.
geboren|born|adj|leb|👶|Ich bin 1995 geboren.
das Gefühl|feeling|n|leb||Ich habe ein gutes Gefühl.
fühlen|to feel|v|leb||Wie fühlst du dich?
die Angst|fear|n|leb|😨|Ich habe Angst vor Spinnen.
die Liebe|love|n|leb|💕|Liebe auf den ersten Blick.
lieben|to love|v|leb|😍|Ich liebe dich.
der Spaß|fun|n|leb|😄|Viel Spaß!
das Glück|luck; happiness|n|leb|🍀|Viel Glück bei der Prüfung!
froh|glad|adj|leb|🙂|Ich bin froh, dass du da bist.
glücklich|happy|adj|leb|😊|Sie sieht glücklich aus.
traurig|sad|adj|leb|😢|Warum bist du so traurig?
lachen|to laugh|v|leb|😂|Wir haben viel gelacht.
essen|to eat|v|all|🍽️|Was essen wir heute?
trinken|to drink|v|all|🥤|Ich trinke keinen Alkohol.
schlafen|to sleep|v|leb|😴|Hast du gut geschlafen?
das Essen|food; meal|n|all|🍲|Das Essen ist fertig!
das Brot|bread|n|all|🍞|Ich kaufe frisches Brot.
der Kaffee|coffee|n|all|☕|Einen Kaffee, bitte.
der Tisch|table|n|all||Das Essen steht auf dem Tisch.
die Tür|door|n|all|🚪|Mach bitte die Tür zu.
das Zimmer|room (in a home)|n|all|🛏️|Mein Zimmer ist klein, aber hell.
der Raum|space; room|n|ort|🌌|Der Raum ist voller Menschen.
die Wohnung|flat, apartment|n|all|🏢|Wir suchen eine neue Wohnung.
wohnen|to live, to reside|v|all|🏡|Wo wohnst du?
die Straße|street, road|n|ort|🛣️|In welcher Straße wohnst du?
das Auto|car|n|all|🚗|Wir fahren mit dem Auto.
der Zug|train|n|all|🚆|Der Zug hat Verspätung.
fahren|to drive, to go (by vehicle)|v|bew|🚗|Ich fahre mit dem Bus.
fliegen|to fly|v|bew|✈️|Wir fliegen nach Mallorca.
laufen|to run; to walk|v|bew|🏃|Ich laufe jeden Morgen fünf Kilometer.
die Reise|journey, trip|n|bew|🧳|Gute Reise!
reisen|to travel|v|bew|🌍|Sie reist gern allein.
ankommen|to arrive|v|bew|🛬|Wann kommt der Zug an?
folgen|to follow|v|bew|👣|Folgen Sie mir bitte.
treffen|to meet; to hit|v|men|🤝|Wir treffen uns um acht.
besuchen|to visit|v|men|🚪|Ich besuche am Sonntag meine Oma.
helfen|to help|v|men|🆘|Kann ich Ihnen helfen?
die Hilfe|help|n|men|🛟|Danke für deine Hilfe.
suchen|to look for, to search|v|ver|🔍|Ich suche meine Brille.
brauchen|to need|v|ver||Ich brauche einen neuen Laptop.
versuchen|to try|v|ver||Ich versuche es noch einmal.
legen|to lay, to put (flat)|v|bew||Leg das Buch auf den Tisch.
stellen|to put (upright), to place|v|bew||Stell die Flasche in den Kühlschrank.
setzen|to set; to sit (someone) down|v|bew||Setz dich doch!
sitzen|to sit, to be sitting|v|bew|🪑|Wir sitzen im Garten.
öffnen|to open|v|all|🔓|Kannst du das Fenster öffnen?
schließen|to close; to lock|v|all|🔒|Die Geschäfte schließen um acht.
warten|to wait|v|zeit|⌛|Ich warte auf den Bus.
ziehen|to pull; to move (house)|v|bew|🧲|Wir ziehen nach Berlin.
tragen|to carry; to wear|v|bew|🎒|Sie trägt ein rotes Kleid.
fallen|to fall|v|bew|🍂|Das Glas ist auf den Boden gefallen.
steigen|to climb; to rise|v|bew|📈|Die Preise steigen.
bewegen|to move|v|bew|🤸|Du solltest dich mehr bewegen.
bauen|to build|v|arb|🏗️|Sie bauen ein neues Haus.
entstehen|to arise, to come into being|v|abs||Hier entsteht ein neuer Park.
entwickeln|to develop|v|abs||Die Firma entwickelt neue Software.
die Entwicklung|development|n|abs|📈|Die Entwicklung geht schnell.
entscheiden|to decide|v|abs|🔀|Ich kann mich nicht entscheiden.
die Entscheidung|decision|n|abs||Das war die richtige Entscheidung.
ändern|to change|v|abs|🔄|Das kann man nicht ändern.
erreichen|to reach, to achieve|v|abs|🏆|Wir haben unser Ziel erreicht.
das Ziel|goal; destination|n|abs|🎯|Mein Ziel ist das C1-Zertifikat.
die Idee|idea|n|abs|💡|Das ist eine gute Idee!
das Bild|picture, image|n|all|🖼️|Das Bild hängt im Wohnzimmer.
die Musik|music|n|all|🎵|Welche Musik hörst du gern?
der Film|film, movie|n|all|🎬|Der Film war langweilig.
das Spiel|game; match|n|all|🎲|Wer hat das Spiel gewonnen?
der Sport|sport|n|all|🏅|Ich mache jeden Tag Sport.
der Ort|place, location|n|ort|📍|Das ist ein schöner Ort.
der Platz|square; seat; room (space)|n|ort|🪑|Ist dieser Platz noch frei?
die Stelle|spot; position, job|n|ort||An deiner Stelle würde ich warten.
der Punkt|point; dot; full stop|n|abs|⚫|Das ist ein wichtiger Punkt.
die Mitte|middle, centre|n|ort|🎯|Das Hotel liegt in der Mitte der Stadt.
oben|above, upstairs|adv|ort|⬆️|Das Bad ist oben.
unten|below, downstairs|adv|ort|⬇️|Die Küche ist unten.
links|(on the) left|adv|ort|⬅️|Gehen Sie hier links.
rechts|(on the) right|adv|ort|➡️|Die Apotheke ist rechts.
nah|near, close|adj|ort||Der Bahnhof ist ganz nah.
die Nähe|vicinity, nearness|n|ort||Gibt es hier in der Nähe eine Bank?
der Garten|garden|n|all|🌷|Die Kinder spielen im Garten.
der Baum|tree|n|all|🌳|Im Herbst fallen die Blätter vom Baum.
das Tier|animal|n|all|🐾|Hast du ein Haustier?
der Hund|dog|n|all|🐕|Der Hund bellt.
die Katze|cat|n|all|🐈|Die Katze schläft auf dem Sofa.
die Sonne|sun|n|all|☀️|Die Sonne scheint.
das Wetter|weather|n|all|🌦️|Wie ist das Wetter heute?
die Luft|air|n|all|💨|Ich brauche frische Luft.
das Licht|light|n|all|💡|Mach bitte das Licht an.
die Farbe|colour|n|all|🎨|Was ist deine Lieblingsfarbe?
schwarz|black|adj|eig|⚫|Ich trinke den Kaffee schwarz.
weiß|white|adj|eig|⚪|Im Winter ist alles weiß.
rot|red|adj|eig|🔴|Die Ampel ist rot.
grün|green|adj|eig|🟢|Das Gras ist grün.
blau|blue|adj|eig|🔵|Der Himmel ist blau.
hell|bright, light|adj|eig|🔆|Die Wohnung ist schön hell.
dunkel|dark|adj|eig|🌑|Im Winter wird es früh dunkel.
warm|warm|adj|eig|🌤️|Heute ist es schön warm.
kalt|cold|adj|eig|🥶|Mir ist kalt.
heiß|hot|adj|eig|🔥|Vorsicht, die Suppe ist heiß!
jung|young|adj|eig|🐣|Sie ist noch sehr jung.
kurz|short|adj|eig|✂️|Die Pause ist zu kurz.
leicht|easy; light (weight)|adj|eig|🪶|Die Prüfung war leicht.
schwer|heavy; difficult|adj|eig|🏋️|Der Koffer ist sehr schwer.
einfach|simple; simply|adj|eig||Das ist ganz einfach.
schwierig|difficult|adj|eig|🧗|Die Grammatik ist schwierig.
stark|strong|adj|eig|💪|Der Kaffee ist sehr stark.
schwach|weak|adj|eig|🪫|Ich fühle mich schwach.
voll|full|adj|eig|🈵|Der Bus ist total voll.
leer|empty|adj|eig|🫙|Die Flasche ist leer.
offen|open|adj|eig|🔓|Das Geschäft ist bis 20 Uhr offen.
frei|free; vacant|adj|eig|🕊️|Ist der Platz frei?
sicher|safe; sure|adj|eig|🛡️|Bist du sicher?
klar|clear; of course|adj|eig|💎|Alles klar!
falsch|wrong, false|adj|eig|❌|Die Nummer ist falsch.
wahr|true|adj|eig|☑️|Das ist nicht wahr!
schlecht|bad|adj|eig|👎|Das Wetter ist schlecht.
toll|great, terrific|adj|eig|🤩|Das ist eine tolle Idee!
bekannt|well-known, famous|adj|eig|⭐|Die Stadt ist für ihr Bier bekannt.
ähnlich|similar|adj|eig|👯|Die Geschwister sehen sich ähnlich.
gleich|same; right away|adj|eig|🟰|Ich komme gleich!
verschieden|different, various|adj|eig|🔀|Wir haben verschiedene Meinungen.
anders|different(ly)|adv|eig||Das sehe ich anders.
allgemein|general|adj|abs||Im Allgemeinen bin ich zufrieden.
politisch|political|adj|arb||Das ist eine politische Frage.
öffentlich|public|adj|arb||Ich fahre mit öffentlichen Verkehrsmitteln.
die Wirtschaft|economy|n|arb|📊|Die Wirtschaft wächst wieder.
bestimmt|certain(ly), definitely|adj|abs||Er kommt bestimmt gleich.
natürlich|natural; of course|adv|par||Natürlich helfe ich dir!
wirklich|really|adv|par||Das ist wirklich lecker.
vielleicht|maybe, perhaps|adv|par|🤷|Vielleicht regnet es morgen.
eigentlich|actually, really|adv|par||Eigentlich habe ich keine Lust.
sogar|even|adv|par||Er spricht sogar Chinesisch.
fast|almost|adv|par||Ich bin fast fertig.
ziemlich|quite, rather|adv|par||Es ist ziemlich kalt heute.
besonders|especially|adv|par||Mir gefällt besonders der Garten.
eben|just; flat|part|par||Das ist eben so.
gar|at all (gar nicht)|part|par||Das ist gar nicht schlimm.
zusammen|together|adv|men|🫂|Wir essen zusammen.
allein|alone|adv|men|🧍|Ich wohne allein.
weiter|further, on|adv|ort|⏩|Mach weiter so!
zurück|back|adv|ort|🔙|Ich bin gleich zurück.
vorbei|over, past|adv|zeit||Der Sommer ist vorbei.
draußen|outside|adv|ort|🌳|Die Kinder spielen draußen.
überall|everywhere|adv|ort||Ich habe überall gesucht.
dabei|with it; in the process|adv|par||Hast du deinen Pass dabei?
deshalb|therefore, that's why|adv|kon||Ich bin müde, deshalb gehe ich ins Bett.
trotzdem|nevertheless, anyway|adv|kon||Es regnet, trotzdem gehen wir spazieren.
obwohl|although|konj|kon||Obwohl es spät ist, bin ich nicht müde.
damit|so that; with it|konj|kon||Ich spare, damit ich reisen kann.
bevor|before (conjunction)|konj|kon||Wasch dir die Hände, bevor du isst.
nachdem|after (conjunction)|konj|kon||Nachdem wir gegessen hatten, gingen wir.
sowohl … als auch|both … and|konj|kon||Sie spricht sowohl Englisch als auch Spanisch.
entweder … oder|either … or|konj|kon||Entweder heute oder morgen.
weder … noch|neither … nor|konj|kon||Ich trinke weder Bier noch Wein.
außerdem|besides, in addition|adv|kon|➕|Außerdem ist es zu teuer.
nämlich|namely; you see|adv|par||Ich bleibe zu Hause, ich bin nämlich krank.
sonst|otherwise, else|adv|kon||Beeil dich, sonst verpasst du den Zug!
ab|from (on)|prep|pra||Ab Montag habe ich Urlaub.
hinter|behind|prep|pra||Der Garten ist hinter dem Haus.
neben|next to|prep|pra||Setz dich neben mich.
wegen|because of|prep|pra||Wegen des Regens bleiben wir hier.
trotz|despite|prep|pra||Trotz des Regens gehen wir raus.
statt|instead of|prep|pra||Statt Kaffee trinke ich Tee.
welcher|which|pron|pro||Welcher Bus fährt zum Bahnhof?
unser|our|pron|pro||Unser Haus ist klein.
dein|your (informal)|pron|pro||Ist das dein Fahrrad?
Ihr (Sie-Form)|your (formal)|pron|pro||Wie ist Ihr Name?
jemand|someone|pron|pro||Hat jemand meinen Schlüssel gesehen?
niemand|nobody|pron|pro||Niemand war zu Hause.
beide|both|pron|zah||Beide Kinder schlafen schon.
wenig|little, few|adj|zah|🤏|Ich habe wenig Zeit.
mehrere|several|pron|zah||Ich war mehrere Male dort.
genug|enough|adv|zah||Hast du genug Geld?
die Hälfte|half (noun), the half|n|zah|🌓|Die Hälfte ist schon weg.
ein paar|a few|pron|zah||Ich brauche noch ein paar Minuten.
die Menge|amount; crowd|n|zah||Eine Menge Leute warten.
das Stück|piece|n|zah|🍰|Möchtest du ein Stück Kuchen?
erhalten|to receive; to preserve|v|ver||Sie erhalten die Antwort per E-Mail.
gehören|to belong|v|ver||Wem gehört das Handy?
fehlen|to be missing|v|ver||Mir fehlt noch ein Euro.
bieten|to offer|v|ver||Die Stadt bietet viel Kultur.
nutzen|to use, to make use of|v|ver||Wir nutzen jede Chance.
schauen|to look|v|kom|👀|Schau mal!
aussehen|to look (appearance)|v|kom|🪞|Du siehst müde aus.
scheinen|to seem; to shine|v|kom|🌞|Die Sonne scheint.
bedeuten|to mean, to signify|v|kom||Was bedeutet dieses Wort?
die Bedeutung|meaning; importance|n|kom||Das Wort hat zwei Bedeutungen.
nennen|to name, to call|v|kom||Alle nennen ihn Tom.
rufen|to call, to shout|v|kom|📣|Ruf bitte ein Taxi!
anrufen|to phone, to call|v|kom|📞|Ich rufe dich heute Abend an.
das Handy|mobile phone|n|all|📱|Mein Handy ist kaputt.
der Computer|computer|n|all|💻|Der Computer ist sehr langsam.
das Internet|internet|n|all|🌐|Ich habe das im Internet gefunden.
die Zeitung|newspaper|n|kom|📰|Hast du die Zeitung gelesen?
die Nachricht|message; (piece of) news|n|kom|📩|Ich habe deine Nachricht bekommen.
die Information|information|n|kom|ℹ️|Danke für die Information.
das Thema|topic, subject|n|kom||Das ist ein interessantes Thema.
das System|system|n|abs||Das System funktioniert gut.
die Möglichkeit|possibility, opportunity|n|abs|🚪|Es gibt viele Möglichkeiten.
die Situation|situation|n|abs||Die Situation ist schwierig.
das Ergebnis|result|n|abs|📊|Das Ergebnis ist gut.
der Erfolg|success|n|abs|🏆|Viel Erfolg!
die Kraft|strength, force|n|leb|💪|Ich habe keine Kraft mehr.
die Macht|power|n|arb|👑|Wissen ist Macht.
das Interesse|interest|n|abs||Ich habe großes Interesse an Kunst.
interessant|interesting|adj|eig|🧐|Das Buch ist sehr interessant.
gefallen|to please (I like it)|v|leb|👍|Das Kleid gefällt mir.
mögen|to like|v|leb|😋|Ich mag Schokolade.
gern|gladly; like to (+ verb)|adv|leb|😊|Ich koche gern.
sich freuen|to be glad, to look forward|v|leb|🎉|Ich freue mich auf das Wochenende.
hoffen|to hope|v|leb|🤞|Ich hoffe, es geht dir gut.
der Wunsch|wish|n|leb|🌠|Hast du einen Wunsch?
wünschen|to wish|v|leb|✨|Ich wünsche dir alles Gute!
vergessen|to forget|v|kom|🫥|Ich habe seinen Namen vergessen.
sich erinnern|to remember|v|kom|🧠|Erinnerst du dich an mich?
die Erfahrung|experience|n|kom||Sie hat viel Erfahrung.
stimmen|to be correct; to vote|v|kom|✔️|Das stimmt nicht.
passieren|to happen|v|abs|💥|Was ist passiert?
führen|to lead|v|bew|🧭|Der Weg führt zum See.
schaffen|to manage; to create|v|ver|💪|Du schaffst das!
verlieren|to lose|v|ver|💔|Ich habe meinen Schlüssel verloren.
gewinnen|to win|v|ver|🏆|Wer hat gewonnen?
benutzen|to use|v|ver||Darf ich dein Handy benutzen?
kochen|to cook|v|all|🍳|Heute koche ich Spaghetti.
das Frühstück|breakfast|n|all|🥐|Das Frühstück ist um sieben.
das Fenster|window|n|all|🪟|Mach bitte das Fenster auf.
das Bett|bed|n|all|🛏️|Ich gehe jetzt ins Bett.
die Kleidung|clothes, clothing|n|all|👕|Ich brauche warme Kleidung.
der Schuh|shoe|n|all|👟|Die Schuhe sind zu klein.
der Fuß|foot|n|leb|🦶|Wir gehen zu Fuß.
das Bein|leg|n|leb|🦵|Mir tut das Bein weh.
der Mund|mouth|n|leb|👄|Mach den Mund auf.
das Ohr|ear|n|leb|👂|Ich bin ganz Ohr.
das Gesicht|face|n|leb|🙂|Sie hat ein freundliches Gesicht.
`;

/** Word families: words that share a root (makes them easier to remember together) */
GT.FREQ_FAMILIES = [
  ['fragen', 'die Frage'],
  ['das Wort', 'die Antwort', 'antworten'],
  ['sprechen', 'die Sprache'],
  ['spielen', 'das Spiel'],
  ['arbeiten', 'die Arbeit'],
  ['essen', 'das Essen'],
  ['leben', 'das Leben'],
  ['lieben', 'die Liebe'],
  ['meinen', 'die Meinung'],
  ['helfen', 'die Hilfe'],
  ['reisen', 'die Reise'],
  ['wohnen', 'die Wohnung'],
  ['fühlen', 'das Gefühl'],
  ['wünschen', 'der Wunsch'],
  ['bedeuten', 'die Bedeutung'],
  ['entscheiden', 'die Entscheidung'],
  ['entwickeln', 'die Entwicklung'],
  ['möglich', 'die Möglichkeit'],
  ['nah', 'die Nähe'],
  ['das Glück', 'glücklich'],
  ['halb', 'die Hälfte'],
  ['das Interesse', 'interessant'],
  ['die Zeit', 'die Zeitung'],
  ['rufen', 'anrufen'],
  ['kaufen', 'verkaufen'],
  ['kommen', 'ankommen', 'bekommen'],
  ['stehen', 'verstehen'],
  ['stellen', 'die Stelle'],
  ['legen', 'liegen'],
  ['setzen', 'sitzen', 'das Gesetz'],
  ['sehen', 'das Gesicht', 'aussehen'],
  ['das Recht', 'richtig', 'rechts'],
  ['fallen', 'der Fall'],
  ['ziehen', 'der Zug'],
  ['der Weg', 'bewegen'],
  ['fahren', 'die Erfahrung'],
  ['froh', 'sich freuen'],
  ['das Mal', 'einmal', 'manchmal'],
  ['erst', 'erste'],
  ['zwei', 'zweite'],
  ['ein, eine', 'einmal', 'einfach'],
  ['der Morgen', 'morgen'],
  ['lang', 'lange'],
  ['der Anfang', 'anfangen'],
];

/** Opposites */
GT.FREQ_OPPOSITES = [
  ['groß', 'klein'], ['alt', 'neu'], ['alt', 'jung'], ['gut', 'schlecht'], ['lang', 'kurz'], ['früh', 'spät'],
  ['leicht', 'schwer'], ['einfach', 'schwierig'], ['stark', 'schwach'], ['voll', 'leer'], ['hell', 'dunkel'],
  ['warm', 'kalt'], ['heiß', 'kalt'], ['schwarz', 'weiß'], ['richtig', 'falsch'], ['wahr', 'falsch'], ['krank', 'gesund'],
  ['glücklich', 'traurig'], ['froh', 'traurig'], ['oben', 'unten'], ['links', 'rechts'], ['kommen', 'gehen'],
  ['kaufen', 'verkaufen'], ['die Frage', 'die Antwort'], ['fragen', 'antworten'], ['der Anfang', 'das Ende'],
  ['beginnen', 'aufhören'], ['öffnen', 'schließen'], ['leben', 'sterben'], ['das Leben', 'der Tod'],
  ['der Mann', 'die Frau'], ['der Vater', 'die Mutter'], ['der Sohn', 'die Tochter'], ['der Bruder', 'die Schwester'],
  ['der Tag', 'die Nacht'], ['der Morgen', 'der Abend'], ['gestern', 'morgen'], ['immer', 'nie'], ['jemand', 'niemand'],
  ['alle', 'nichts'], ['mit', 'ohne'], ['vor', 'hinter'], ['viel', 'wenig'], ['gewinnen', 'verlieren'],
  ['sich erinnern', 'vergessen'], ['nah', 'weit'], ['hier', 'dort'], ['allein', 'zusammen'], ['ähnlich', 'verschieden'],
  ['ja', 'nein'], ['geben', 'nehmen'], ['sitzen', 'stehen'], ['bevor', 'nachdem'], ['oft', 'nie'],
];

/** Parsed list: [{rank, de, en, pos, theme, emoji, ex}] */
GT.freqWords = GT.FREQ_RAW.trim().split('\n').map((line, i) => {
  const [de, en, pos, theme, emoji, ex] = line.split('|');
  return { rank: i + 1, de, en, pos, theme, emoji: emoji || '', ex: ex || '' };
});
