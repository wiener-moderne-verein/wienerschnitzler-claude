// Seed dataset modeled on the wienerschnitzler-data schema.
// Real data would come from wienerschnitzler_timeline.json + listplace.xml.
// Coordinates and dates are drawn from documented sources on Arthur Schnitzler (1862-1931).

window.SCHNITZLER_BIRTH = "1862-05-15";
window.SCHNITZLER_DEATH = "1931-10-21";

// Places: id, name, lat, lon, type (p=large geographic / a=smaller like street/house), country, days, firstVisit, lastVisit
window.SCHNITZLER_PLACES = [
  { id: "pmb10", name: "Wien", lat: 48.2082, lon: 16.3738, type: "p", country: "Österreich", days: 19840, firstVisit: "1862-05-15", lastVisit: "1931-10-21", note: "Geburts- und Sterbeort; Lebensmittelpunkt." },
  { id: "pmb14", name: "Praterstraße 16", lat: 48.2161, lon: 16.3852, type: "a", country: "Österreich", parent: "Wien", days: 7120, firstVisit: "1862-05-15", lastVisit: "1885-03-02", note: "Geburtshaus. Wohnung der Familie bis 1885." },
  { id: "pmb21", name: "Sternwartestraße 71", lat: 48.2333, lon: 16.3251, type: "a", country: "Österreich", parent: "Wien", days: 4012, firstVisit: "1910-04-01", lastVisit: "1931-10-21", note: "Wohn- und Sterbehaus 1910–1931." },
  { id: "pmb22", name: "Frankgasse 1", lat: 48.2185, lon: 16.3582, type: "a", country: "Österreich", parent: "Wien", days: 2860, firstVisit: "1903-09-01", lastVisit: "1910-03-31", note: "Wohnung nach Eheschließung mit Olga Gussmann." },
  { id: "pmb30", name: "Berlin", lat: 52.52, lon: 13.405, type: "p", country: "Deutschland", days: 412, firstVisit: "1888-03-14", lastVisit: "1931-01-18", note: "Wichtigster Theaterstandort außerhalb Wiens." },
  { id: "pmb35", name: "München", lat: 48.1351, lon: 11.5820, type: "p", country: "Deutschland", days: 118, firstVisit: "1891-05-02", lastVisit: "1930-06-10" },
  { id: "pmb40", name: "Semmering", lat: 47.6333, lon: 15.8333, type: "p", country: "Österreich", days: 287, firstVisit: "1892-08-12", lastVisit: "1928-09-30", note: "Südbahnhotel, Sommer- und Winterferien." },
  { id: "pmb41", name: "Südbahnhotel", lat: 47.6361, lon: 15.8289, type: "a", country: "Österreich", parent: "Semmering", days: 212, firstVisit: "1892-08-12", lastVisit: "1928-09-30" },
  { id: "pmb50", name: "Venedig", lat: 45.4408, lon: 12.3155, type: "p", country: "Italien", days: 93, firstVisit: "1887-09-20", lastVisit: "1926-05-11" },
  { id: "pmb51", name: "Rom", lat: 41.9028, lon: 12.4964, type: "p", country: "Italien", days: 46, firstVisit: "1894-04-10", lastVisit: "1924-04-02" },
  { id: "pmb52", name: "Florenz", lat: 43.7696, lon: 11.2558, type: "p", country: "Italien", days: 38, firstVisit: "1894-04-20", lastVisit: "1924-04-18" },
  { id: "pmb55", name: "Marienbad", lat: 49.9645, lon: 12.7010, type: "p", country: "Tschechien", days: 148, firstVisit: "1898-07-01", lastVisit: "1926-08-02", note: "Kuraufenthalte, mehrfach mit Olga." },
  { id: "pmb56", name: "Karlsbad", lat: 50.2310, lon: 12.8710, type: "p", country: "Tschechien", days: 96, firstVisit: "1895-07-18", lastVisit: "1929-08-12" },
  { id: "pmb60", name: "Altaussee", lat: 47.6333, lon: 13.7833, type: "p", country: "Österreich", days: 198, firstVisit: "1900-07-08", lastVisit: "1931-08-25", note: "Regelmäßige Sommeraufenthalte." },
  { id: "pmb61", name: "Bad Ischl", lat: 47.7106, lon: 13.6244, type: "p", country: "Österreich", days: 62, firstVisit: "1898-07-20", lastVisit: "1928-08-14" },
  { id: "pmb65", name: "Paris", lat: 48.8566, lon: 2.3522, type: "p", country: "Frankreich", days: 41, firstVisit: "1894-05-02", lastVisit: "1925-10-14" },
  { id: "pmb66", name: "London", lat: 51.5074, lon: -0.1278, type: "p", country: "Großbritannien", days: 28, firstVisit: "1888-07-04", lastVisit: "1924-06-20" },
  { id: "pmb70", name: "Kopenhagen", lat: 55.6761, lon: 12.5683, type: "p", country: "Dänemark", days: 12, firstVisit: "1896-05-22", lastVisit: "1914-05-14" },
  { id: "pmb71", name: "Stockholm", lat: 59.3293, lon: 18.0686, type: "p", country: "Schweden", days: 9, firstVisit: "1914-05-18", lastVisit: "1914-05-27" },
  { id: "pmb75", name: "New York", lat: 40.7128, lon: -74.0060, type: "p", country: "USA", days: 0, firstVisit: null, lastVisit: null, note: "Nie besucht – aber dort uraufgeführt." },
  { id: "pmb80", name: "Prag", lat: 50.0755, lon: 14.4378, type: "p", country: "Tschechien", days: 34, firstVisit: "1893-09-10", lastVisit: "1928-10-12" },
  { id: "pmb81", name: "Budapest", lat: 47.4979, lon: 19.0402, type: "p", country: "Ungarn", days: 22, firstVisit: "1887-04-11", lastVisit: "1911-05-19" },
  { id: "pmb85", name: "Zürich", lat: 47.3769, lon: 8.5417, type: "p", country: "Schweiz", days: 18, firstVisit: "1908-06-02", lastVisit: "1930-09-12" },
  { id: "pmb86", name: "St. Moritz", lat: 46.4908, lon: 9.8355, type: "p", country: "Schweiz", days: 54, firstVisit: "1905-07-21", lastVisit: "1928-08-08" },
  { id: "pmb90", name: "Burgtheater", lat: 48.2100, lon: 16.3612, type: "a", country: "Österreich", parent: "Wien", days: 186, firstVisit: "1882-11-14", lastVisit: "1930-12-03", note: "Uraufführungen, Premieren, Besuche." },
  { id: "pmb91", name: "Café Griensteidl", lat: 48.2089, lon: 16.3668, type: "a", country: "Österreich", parent: "Wien", days: 94, firstVisit: "1890-02-12", lastVisit: "1897-01-31", note: "Stammcafé des Jung-Wien-Kreises bis zum Abriss." },
  { id: "pmb92", name: "Café Central", lat: 48.2108, lon: 16.3659, type: "a", country: "Österreich", parent: "Wien", days: 112, firstVisit: "1897-02-01", lastVisit: "1928-11-04" },
  { id: "pmb93", name: "Allgemeines Krankenhaus", lat: 48.2197, lon: 16.3460, type: "a", country: "Österreich", parent: "Wien", days: 420, firstVisit: "1885-06-01", lastVisit: "1893-07-30", note: "Assistenzarzt bei Prof. Meynert." },
  { id: "pmb94", name: "Poliklinik, Mariannengasse 10", lat: 48.2222, lon: 16.3552, type: "a", country: "Österreich", parent: "Wien", days: 308, firstVisit: "1886-10-01", lastVisit: "1893-05-01" },
  { id: "pmb95", name: "Theater in der Josefstadt", lat: 48.2107, lon: 16.3481, type: "a", country: "Österreich", parent: "Wien", days: 58, firstVisit: "1899-03-04", lastVisit: "1929-02-17" }
];

// Timeline stays: dateStart, dateEnd (inclusive), placeId, eventName (optional)
window.SCHNITZLER_STAYS = [
  { start: "1862-05-15", end: "1885-03-01", placeId: "pmb14", event: "Kindheit und Jugend in der Praterstraße" },
  { start: "1879-10-02", end: "1885-05-30", placeId: "pmb10", event: "Medizinstudium an der Universität Wien" },
  { start: "1885-06-01", end: "1888-07-03", placeId: "pmb93", event: "Assistenzarzt am AKH" },
  { start: "1887-09-20", end: "1887-10-02", placeId: "pmb50", event: "Erste Italienreise" },
  { start: "1888-03-14", end: "1888-03-28", placeId: "pmb30", event: "Erste Berlinreise" },
  { start: "1890-02-12", end: "1897-01-31", placeId: "pmb91", event: "Jung-Wien im Café Griensteidl" },
  { start: "1892-08-12", end: "1892-09-04", placeId: "pmb41", event: "Sommerfrische am Semmering" },
  { start: "1893-09-10", end: "1893-09-16", placeId: "pmb80", event: "Lesereise nach Prag" },
  { start: "1894-04-10", end: "1894-05-08", placeId: "pmb51", event: "Italienreise mit Marie Reinhard" },
  { start: "1895-10-09", end: "1895-10-09", placeId: "pmb90", event: "Uraufführung „Liebelei“ am Burgtheater" },
  { start: "1897-02-01", end: "1928-11-04", placeId: "pmb92", event: "Café Central – Stammcafé" },
  { start: "1900-07-08", end: "1900-09-03", placeId: "pmb60", event: "Sommer in Altaussee" },
  { start: "1903-08-26", end: "1903-08-26", placeId: "pmb10", event: "Heirat mit Olga Gussmann" },
  { start: "1903-09-01", end: "1910-03-31", placeId: "pmb22", event: "Wohnung Frankgasse 1" },
  { start: "1910-04-01", end: "1931-10-21", placeId: "pmb21", event: "Haus Sternwartestraße 71" },
  { start: "1914-05-14", end: "1914-05-27", placeId: "pmb71", event: "Skandinavienreise" },
  { start: "1921-02-01", end: "1921-02-01", placeId: "pmb21", event: "Trennung von Olga" },
  { start: "1921-12-23", end: "1921-12-23", placeId: "pmb10", event: "Reigen-Prozess am Landgericht Berlin" },
  { start: "1924-10-23", end: "1924-10-23", placeId: "pmb21", event: "„Fräulein Else“ erscheint" },
  { start: "1928-07-26", end: "1928-07-26", placeId: "pmb86", event: "Selbstmord der Tochter Lili in Venedig" },
  { start: "1931-08-03", end: "1931-08-25", placeId: "pmb60", event: "Letzter Sommeraufenthalt" },
  { start: "1931-10-21", end: "1931-10-21", placeId: "pmb21", event: "Tod durch Hirnblutung" }
];

// People co-located with Schnitzler — for place detail pages.
window.SCHNITZLER_PEOPLE = {
  pmb91: ["Hugo von Hofmannsthal", "Hermann Bahr", "Richard Beer-Hofmann", "Felix Salten", "Karl Kraus"],
  pmb92: ["Peter Altenberg", "Hugo von Hofmannsthal", "Adolf Loos", "Alfred Polgar"],
  pmb21: ["Olga Gussmann", "Heinrich Schnitzler", "Lili Schnitzler", "Sigmund Freud (Briefe)"],
  pmb90: ["Adele Sandrock", "Josef Kainz", "Hermann Bahr"],
  pmb14: ["Johann Schnitzler", "Louise Schnitzler", "Julius Schnitzler"],
  pmb93: ["Theodor Meynert", "Hermann Nothnagel"],
  pmb41: ["Olga Waissnix", "Hugo von Hofmannsthal"],
  pmb50: ["Marie Glümer", "Marie Reinhard"],
  pmb60: ["Olga Gussmann", "Stephan Zweig", "Jakob Wassermann"]
};

// Aggregate helpers built once.
(function() {
  const byId = {};
  for (const p of window.SCHNITZLER_PLACES) byId[p.id] = p;
  window.SCHNITZLER_BY_ID = byId;

  // Stays per decade + country counts
  const decades = {};
  const countries = {};
  const types = { "Wohnhäuser": 0, "Cafés": 0, "Theater": 0, "Kurorte": 0, "Städte": 0, "Andere": 0 };
  for (const s of window.SCHNITZLER_STAYS) {
    const y = parseInt(s.start.slice(0, 4));
    const d = Math.floor(y / 10) * 10;
    decades[d] = (decades[d] || 0) + 1;
    const pl = byId[s.placeId];
    if (pl) countries[pl.country] = (countries[pl.country] || 0) + 1;
  }
  // Simple type classifier on names
  for (const p of window.SCHNITZLER_PLACES) {
    if (/straße|gasse|haus/i.test(p.name)) types["Wohnhäuser"] += p.days;
    else if (/Café/i.test(p.name)) types["Cafés"] += p.days;
    else if (/theater|burg/i.test(p.name)) types["Theater"] += p.days;
    else if (/bad|see|ischl|moritz|semmering/i.test(p.name)) types["Kurorte"] += p.days;
    else if (p.type === "p") types["Städte"] += p.days;
    else types["Andere"] += p.days;
  }

  window.SCHNITZLER_STATS = { decades, countries, types };
})();
