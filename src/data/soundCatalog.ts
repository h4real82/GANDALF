export interface SoundItem {
  id: string;
  key: string;
  title: string;
  quote: string;
  cat: 'memes' | 'alkohol' | 'aggro' | 'drops' | 'philosophie';
  duration: string;
  icon: string;
  freq: number;
  tags: string[];
}

export const SOUND_CATALOG: SoundItem[] = [
  { id: 'kraniche', key: '1', title: 'Hörst du die Kraniche?', quote: '»Hörst du die Kraniche, Günther? Sie fliegen nach Süden!«', cat: 'memes', duration: '0:06', icon: 'flight_takeoff', freq: 65, tags: ['chillin', 'memes'] },
  { id: 'otto-geworden', key: '2', title: 'Otto geworden', quote: '»Der ist ein bisschen ein Otto geworden, aber ich hab Respekt vor dem!«', cat: 'memes', duration: '0:08', icon: 'theater_comedy', freq: 72, tags: ['memes', 'vocals'] },
  { id: 'auf-alkohol', key: '3', title: 'Auf den Alkohol', quote: '»Auf den Alkohol: Der Ursprung und die Lösung aller Probleme!«', cat: 'alkohol', duration: '0:05', icon: 'liquor', freq: 55, tags: ['alkohol', 'philosophie'] },
  { id: 'bier-bier-bier', key: '4', title: 'Bier, Bier, Bier', quote: '»Bier, Bier, Bier, Bett, Bett, Bett!«', cat: 'alkohol', duration: '0:04', icon: 'sports_bar', freq: 60, tags: ['alkohol', 'eskalation'] },
  { id: 'alarm-stueberl', key: '5', title: 'Aaaalarm!', quote: '»Alarm! Alarm! Was liegt denn hier überhaupt für Stroh rum?«', cat: 'aggro', duration: '0:07', icon: 'warning', freq: 88, tags: ['aggro', 'drops'] },
  { id: 'willi-ansage', key: '6', title: 'Halt die Fresse Willi!', quote: '»Halt jetzt einfach mal dein Maul, Willi!«', cat: 'aggro', duration: '0:03', icon: 'campaign', freq: 95, tags: ['aggro'] },
  { id: 'sub-drop', key: '7', title: '148 BPM Psy-Drop', quote: '»Membranen auf Vollausschlag — KICK & 303 SWEEP!«', cat: 'drops', duration: '0:04', icon: 'speaker', freq: 48, tags: ['drops', 'techno'] },
  { id: 'spaeti-erleuchtung', key: '8', title: 'Späti-Offenbarung', quote: '»Gott segne den Späti-Mann an der Warschauer Brücke!«', cat: 'philosophie', duration: '0:06', icon: 'storefront', freq: 68, tags: ['philosophie', 'alkohol'] },
  { id: 'pfeffi-notstand', key: '9', title: 'Pfeffi-Sirene', quote: '»Zwei Flaschen Pfeffi auf Ex, sonst geht hier gar nix mehr!«', cat: 'alkohol', duration: '0:05', icon: 'local_bar', freq: 80, tags: ['alkohol', 'drops'] },

  { id: 'abfahrt-pur', key: '', title: 'Abfahrt, keine Gnade!', quote: '»Jetzt wird komplett abgerissen! Abfahrt!«', cat: 'drops', duration: '0:04', icon: 'rocket_launch', freq: 92, tags: ['drops', 'techno'] },
  { id: 'sternburg-export', key: '', title: 'Sternburg Export Zisch', quote: '»Merke dir: Sterni zischt immer wie ein neuer Tag!«', cat: 'alkohol', duration: '0:03', icon: 'sports_bar', freq: 58, tags: ['alkohol'] },
  { id: 'was-los-hier', key: '', title: 'Was ist denn hier los?', quote: '»Was ist denn hier los? Sieht aus wie ein Schlachtfeld!«', cat: 'memes', duration: '0:04', icon: 'help_center', freq: 70, tags: ['memes'] },
  { id: 'der-bass-muss-ficken', key: '', title: 'Der Bass muss f!cken', quote: '»Der Bass muss f!cken, sonst taugt das alles nichts!«', cat: 'drops', duration: '0:05', icon: 'volume_up', freq: 44, tags: ['drops', 'techno'] },
  { id: 'psychotrip-303', key: '', title: '303 Acid Spiral Loop', quote: '»Resonanzfilter auf Maximum. Kopfkirmes pur.«', cat: 'drops', duration: '0:06', icon: 'graphic_eq', freq: 82, tags: ['drops'] },
  { id: 'wichtig-und-richtig', key: '', title: 'Wichtig und Richtig', quote: '»Das ist jetzt in dieser Verfassung extrem wichtig und richtig.«', cat: 'philosophie', duration: '0:05', icon: 'done_all', freq: 62, tags: ['philosophie'] },
  { id: 'kein-bier-vor-vier', key: '', title: 'Kein Bier vor vier', quote: '»Kein Bier vor vier? Es ist irgendwo auf der Welt vier Uhr morgens!«', cat: 'alkohol', duration: '0:06', icon: 'schedule', freq: 54, tags: ['alkohol'] },
  { id: 'warum-liegt-hier-stroh', key: '', title: 'Warum liegt hier Stroh?', quote: '»Warum liegt hier überhaupt Stroh? Und warum hast du ne Maske auf?«', cat: 'memes', duration: '0:06', icon: 'masks', freq: 74, tags: ['memes'] },
  { id: 'wo-ist-mein-schluessel', key: '', title: 'Wo ist mein Schlüssel?', quote: '»Ich schwöre, der war eben noch in der linken Jackentasche!«', cat: 'memes', duration: '0:05', icon: 'key', freq: 66, tags: ['memes'] },
  { id: 'berlin-tag-und-nacht', key: '', title: 'Berlin TN Eskalation', quote: '»Das ist mein Club! Verpiss dich hier!«', cat: 'aggro', duration: '0:04', icon: 'dangerous', freq: 90, tags: ['aggro'] },
  { id: 'glitch-rewind', key: '', title: 'Tape Rewind Glitch FX', quote: '»DJ wirft den Track zurück ins Jahr 2004!«', cat: 'drops', duration: '0:03', icon: 'fast_rewind', freq: 110, tags: ['drops'] },
  { id: 'pfeffi-shotgun', key: '', title: 'Pfeffi Shotgun Hit', quote: '»Frisch wie eine arktische Meeresbrise in der Kehle!«', cat: 'alkohol', duration: '0:03', icon: 'ac_unit', freq: 78, tags: ['alkohol'] },
  { id: 'elefant-tanzt', key: '', title: 'Der Elefant tanzt', quote: '»Wenn der Elefant einmal stampft, wackelt ganz Kreuzberg!«', cat: 'drops', duration: '0:07', icon: 'pets', freq: 40, tags: ['drops'] },
  { id: 'keine-termine', key: '', title: 'Keine Termine', quote: '»Keine Termine und leicht einen sitzen — mehr will ich nicht.«', cat: 'philosophie', duration: '0:06', icon: 'event_busy', freq: 56, tags: ['philosophie', 'alkohol'] },
  { id: 'katerfruehstueck', key: '', title: 'Katerfrühstück Döner', quote: '»Mit allem, scharf und extra Tsatsiki für die Regeneration!«', cat: 'philosophie', duration: '0:05', icon: 'lunch_dining', freq: 64, tags: ['philosophie'] },
  { id: 'mischung-1-zu-1', key: '', title: 'Mische 1:1', quote: '»Was heißt hier Mischung? Das ist halbe-halbe Vodka-E!«', cat: 'alkohol', duration: '0:04', icon: 'blender', freq: 70, tags: ['alkohol'] },
  { id: 'mach-lauder', key: '', title: 'Mach laudaaaaa!', quote: '»Mach noch 3 dB lauter, die Nachbarn sind eh im Berghain!«', cat: 'aggro', duration: '0:04', icon: 'volume_up', freq: 85, tags: ['aggro', 'techno'] },
  { id: 'stueberl-ruhe', key: '', title: 'Ruhe im Stüberl!', quote: '»Jetzt ist aber mal zappenduster hier! Alle mal Ruhe!«', cat: 'aggro', duration: '0:04', icon: 'hearing_disabled', freq: 88, tags: ['aggro'] },
  { id: 'berghain-tuer', key: '', title: 'Heute leider nicht...', quote: '»Heute leider nicht. Schönes Wochenende noch.«', cat: 'memes', duration: '0:04', icon: 'block', freq: 50, tags: ['memes'] },
  { id: 'sonnenaufgang-panik', key: '', title: 'Sonnenaufgang Panik', quote: '»Zieht die Vorhänge zu! Das gelbe Ding am Himmel blendet!«', cat: 'philosophie', duration: '0:06', icon: 'wb_sunny', freq: 65, tags: ['philosophie'] },
  { id: 'schluckimpfung', key: '', title: 'Pfeffi Schluckimpfung', quote: '»Gegen Viren, Kater und schlechte Laune immunisiert!«', cat: 'alkohol', duration: '0:04', icon: 'vaccines', freq: 75, tags: ['alkohol'] },
  { id: 'turbo-kick-overdrive', key: '', title: 'Psy-Kick 165 BPM Turbo', quote: '»Vollgas auf die Doppel-16tel! Anschnallen!«', cat: 'drops', duration: '0:04', icon: 'bolt', freq: 42, tags: ['drops', 'techno'] },
  { id: 'spitz-wie-nachbars-lumpi', key: '', title: 'Spitz wie Lumpi', quote: '»Die Meute ist heiß! Jetzt gibt es kein Halten mehr!«', cat: 'memes', duration: '0:05', icon: 'celebration', freq: 72, tags: ['memes'] },
  { id: 'koma-patient', key: '', title: 'Aufwachen, Koma!', quote: '»Junge, wach auf! Der Track droppt gleich!«', cat: 'aggro', duration: '0:04', icon: 'bedtime', freq: 80, tags: ['aggro'] },
  { id: 'pfand-zurueck', key: '', title: 'Pfandbon Millionär', quote: '»27 Pfandflaschen = 3 neue Sternis finanziert!«', cat: 'philosophie', duration: '0:05', icon: 'receipt_long', freq: 60, tags: ['philosophie'] },
  { id: 'luftgitarre-solo', key: '', title: 'Acid Riff Solo', quote: '»Unkontrolliertes Mitnicken im 4/4 Takt!«', cat: 'drops', duration: '0:06', icon: 'music_note', freq: 95, tags: ['drops'] },
  { id: 'was-kost-die-welt', key: '', title: 'Was kostet die Welt?', quote: '»Zahl ich alles aus der Portokasse! Runde für alle!«', cat: 'alkohol', duration: '0:05', icon: 'payments', freq: 68, tags: ['alkohol'] },
  { id: 'schon-wieder-montag', key: '', title: 'Montag existiert nicht', quote: '»Montag ist ein soziales Konstrukt der Nüchternen!«', cat: 'philosophie', duration: '0:06', icon: 'calendar_month', freq: 56, tags: ['philosophie'] },
  { id: 'spontan-eskalation', key: '', title: 'Spontan-Eskalation 1000%', quote: '»Eigentlich wollten wir nur ein schnelles Feierabendbier trinken...«', cat: 'memes', duration: '0:06', icon: 'trending_up', freq: 63, tags: ['memes'] },
  { id: 'club-mate-spritz', key: '', title: 'Club-Mate Zisch', quote: '»Koffein-Schock direkt ins Herz-Kreislaufsystem!«', cat: 'alkohol', duration: '0:03', icon: 'local_cafe', freq: 74, tags: ['alkohol'] },
  { id: 'feuerzeug-klau', key: '', title: 'Wer hat mein Feuer?', quote: '»Irgendeiner von euch hat mein Clipper eingesteckt!«', cat: 'aggro', duration: '0:05', icon: 'local_fire_department', freq: 82, tags: ['aggro'] },
  { id: 'buddha-giggle', key: '', title: 'Buddhas Mittelfinger', quote: '»Erleuchtung durch radikales Loslassen & Mittelfinger oben.«', cat: 'philosophie', duration: '0:05', icon: 'self_improvement', freq: 52, tags: ['philosophie'] },
  { id: 'bass-massage', key: '', title: 'Subwoofer Herzmassage', quote: '»Tieffrequenter Sinuston bringt die Hosenbeine zum Flattern.«', cat: 'drops', duration: '0:05', icon: 'vibration', freq: 36, tags: ['drops', 'techno'] },
  { id: 'spiegeltrinker', key: '', title: 'Spiegeltrinker-Präzision', quote: '»Konstant 2.8 Promille halten wie ein Uhrwerk!«', cat: 'alkohol', duration: '0:05', icon: 'speed', freq: 66, tags: ['alkohol'] },
  { id: 'party-polizei', key: '', title: 'Die Party-Polizei', quote: '»Hier wird nicht geschlafen! Weiterfeiern ist Bürgerpflicht!«', cat: 'aggro', duration: '0:05', icon: 'local_police', freq: 86, tags: ['aggro'] },
  { id: 'berliner-luft', key: '', title: 'Berliner Luft Aroma', quote: '»Pfefferminz-Orkan erfrischt den verwüsteten Gaumen!«', cat: 'alkohol', duration: '0:04', icon: 'air', freq: 72, tags: ['alkohol'] },
  { id: 'glitch-drop-3', key: '', title: 'Matrix Laser Glitch', quote: '»Cyber-Böller knallen durch die Boxengitter!«', cat: 'drops', duration: '0:04', icon: 'electric_bolt', freq: 105, tags: ['drops'] },
  { id: 'letzte-runde', key: '', title: 'Letzte Runde gibt es nicht', quote: '»Die Bar schließt erst, wenn der Putzlappen singt!«', cat: 'memes', duration: '0:05', icon: 'liquor', freq: 62, tags: ['memes'] },
  { id: 'taxi-rufe', key: '', title: 'Taxi nach Nirgendwo', quote: '»Chef, fahr einfach der aufgehenden Sonne hinterher!«', cat: 'memes', duration: '0:05', icon: 'local_taxi', freq: 68, tags: ['memes'] },
  { id: 'zen-gong', key: '', title: 'Tibetischer Bass-Gong', quote: '»Tiefer metallischer Nachhall für pure Entrückung.«', cat: 'philosophie', duration: '0:07', icon: 'notifications_active', freq: 45, tags: ['philosophie'] },
  { id: 'laser-harfe', key: '', title: 'Psytrance Laserharfe', quote: '»Laserstrahlen zerschneiden den dichten Nebel auf Floor 7.«', cat: 'drops', duration: '0:05', icon: 'auto_awesome', freq: 115, tags: ['drops'] },
  { id: 'pfeffi-drop-finale', key: '', title: 'Absoluter Pfeffi-Drop', quote: '»Kollaps aller Hemmungen — voller Bass-Overdrive!«', cat: 'alkohol', duration: '0:06', icon: 'star', freq: 84, tags: ['alkohol', 'drops'] },
  { id: 'stueberl-hymne', key: '', title: 'Stüberl Hymne v3', quote: '»Die Treuesten der Treuen halten bis 14 Uhr mittags durch!«', cat: 'memes', duration: '0:06', icon: 'military_tech', freq: 58, tags: ['memes'] },
  { id: 'over-and-out', key: '', title: 'Over and Out', quote: '»G.A.N.D.A.L.F. klinkt sich aus. Schlaft euren Rausch aus!«', cat: 'philosophie', duration: '0:05', icon: 'power_settings_new', freq: 40, tags: ['philosophie'] }
];
