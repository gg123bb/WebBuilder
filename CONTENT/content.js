// Funktion zum Laden der JSON-Datei für Sprachpakete
async function loadLanguagePacks(link) {
    if (!link) {
        console.error("Kein Link für das Sprachpaket bereitgestellt.");
        return;
    }

    console.log("Lade Sprachpaket von Link:", link);

    try {
        const response = await fetch(link);
        const data = await response.json();
        console.log("Sprachpaket erfolgreich geladen:", data);
        return data;
    } catch (error) {
        console.error("Fehler beim Laden des Sprachpakets:", error);
    }
}

// Funktion zur Auswahl des passenden Sprachpakets basierend auf Sprache und anderen Kriterien
function selectLanguagePack(languagePacks, userLang, category) {
    const now = new Date();

    console.log("Aktuelle Sprache des Benutzers:", userLang);
    console.log("Aktuelles Datum und Uhrzeit:", now);
    console.log("Ausgewählte Kategorie:", category);

    // Filtere die Sprachpakete basierend auf Sprache, Start-/Enddatum, Privat-Status und Kategorie
    const filteredPacks = languagePacks.filter(pack => {
        const startDate = (pack.start !== "false" && pack.start !== "true") ? new Date(pack.start) : null;
        const endDate = pack.end !== "false" ? new Date(pack.end) : null;
        const isPrivate = pack.private === "true";

        const isValidPack = (pack.lang === userLang) &&
            (!isPrivate) &&
            (pack.start === "true" || !startDate || now >= startDate) &&
            (!endDate || now <= endDate) &&
            (!category || pack.category === category);

        console.log(`Überprüfung des Pakets mit ID: ${pack.id}`);
        console.log(`Sprache: ${pack.lang}, Startdatum: ${startDate}, Enddatum: ${endDate}, Privat: ${isPrivate}, Kategorie: ${pack.category}, Gültig: ${isValidPack}`);

        return isValidPack;
    });

    // Sortiere die Pakete nach Priorität
    filteredPacks.sort((a, b) => b.priority - a.priority);

    // Falls es Pakete in der bevorzugten Sprache gibt, verwende das erste
    if (filteredPacks.length > 0) {
        console.log("Gewähltes Sprachpaket:", filteredPacks[0]);
        return filteredPacks[0];
    }

    // Kein passendes Paket in der gewünschten Sprache gefunden, jetzt suchen wir in allen Sprachen mit der gleichen Kategorie
    console.error("Kein passendes Sprachpaket für Sprache gefunden. Fallback auf andere Sprachen.");

    const fallbackPacks = languagePacks.filter(pack => {
        const startDate = (pack.start !== "false" && pack.start !== "true") ? new Date(pack.start) : null;
        const endDate = pack.end !== "false" ? new Date(pack.end) : null;
        const isPrivate = pack.private === "true";

        // Überprüfe Pakete nur basierend auf Kategorie und anderen Kriterien (ohne Sprache)
        const isValidPack = (!isPrivate) &&
            (pack.start === "true" || !startDate || now >= startDate) &&
            (!endDate || now <= endDate) &&
            (!category || pack.category === category);

        console.log(`Überprüfung des Fallback-Pakets mit ID: ${pack.id}`);
        console.log(`Sprache: ${pack.lang}, Startdatum: ${startDate}, Enddatum: ${endDate}, Privat: ${isPrivate}, Kategorie: ${pack.category}, Gültig: ${isValidPack}`);

        return isValidPack;
    });

    // Sortiere die Fallback-Pakete nach Priorität
    fallbackPacks.sort((a, b) => b.priority - a.priority);

    // Wenn wir ein Fallback-Paket finden, verwenden wir es
    if (fallbackPacks.length > 0) {
        console.log("Fallback Sprachpaket gewählt:", fallbackPacks[0]);
        return fallbackPacks[0];
    }

    // Kein passendes Sprachpaket in irgendeiner Sprache gefunden, versuche die "not found"-Kategorie zu laden
    console.error("Kein passendes Sprachpaket in irgendeiner Sprache gefunden. Fallback auf 'not found'-Kategorie.");

    const notFoundPack = languagePacks.find(pack => pack.category === "notfound");

    if (notFoundPack) {
        console.log("Not found Sprachpaket gewählt:", notFoundPack);
        return notFoundPack;
    }

    console.error("Kein 'not found'-Sprachpaket gefunden.");
    return null;
}

// Funktion zum Laden des gewählten Sprachpakets
async function loadSelectedLanguagePack(packURL) {
    try {
        const response = await fetch(packURL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Fehler beim Laden des Sprachpakets:", error);
    }
}

// Dynamisches Laden von ES-Modulen mit import()
async function loadScript(scriptURL) {
    try {
        const module = await import(scriptURL);
        return module;
    } catch (error) {
        console.error(`error by loading a module ${scriptURL}:`, error);
    }
}

// Funktion zum Einfügen des Inhalts aus einem Sprachpaket
async function insertContentFromPack(content) {
    const container = document.getElementById("dynamic-content");

    if (!container) {
        console.error("Kein Container gefunden, in den der Inhalt eingefügt werden kann.");
        return;
    }

    console.log("Füge Inhalt in den Container ein:", content);

    // Leere den Container
    container.innerHTML = '';

    // Überprüfe, ob der Inhalt Module enthält
    if (content.modules && Array.isArray(content.modules)) {
        for (const module of content.modules) {
            const { scriptURL, meta, content: moduleContent } = module;

            // Lade das Modul-Skript dynamisch
            const moduleScript = await loadScript(scriptURL);

            // Wenn das Modul-Skript eine createModule-Funktion hat, erstelle das HTML
            if (moduleScript && typeof moduleScript.createModule === 'function') {
                const moduleHTML = moduleScript.createModule(meta, moduleContent);
                container.appendChild(moduleHTML);
            } else {
                console.error("createModule-Funktion nicht gefunden oder Modul konnte nicht geladen werden.");
            }
        }
    } else {
        // Wenn kein modularer Inhalt vorhanden ist, zeige den Inhalt direkt an
        container.innerHTML = `<p>${JSON.stringify(content)}</p>`;
    }
}

// Hauptfunktion zur Verwaltung der Sprachpakete und Auswahl der passenden
async function manageLanguagePacks(category) {
    const languagePackLink = "./packs/programContentmanager.json"; // Dieser sollte den richtigen Link zur JSON haben
    const languagePackData = await loadLanguagePacks(languagePackLink);

    if (!languagePackData || !Array.isArray(languagePackData.content) || languagePackData.content.length === 0) {
        console.error("Keine Sprachpakete gefunden.");
        return;
    }

    const languagePacks = languagePackData.content;

    console.log("Alle verfügbaren Sprachpakete:", languagePacks);

    // Bestimme die Sprache des Benutzers (z.B. "de" oder "en")
    const urlParamsArray = getURLParamsAsArray();
    let userLang = urlParamsArray.find(param => param.hasOwnProperty('lang'))?.lang || languageNavigator();

    console.log("Gewählte Sprache:", userLang);

    // Wähle das passende Sprachpaket basierend auf Sprache, Priorität und der übergebenen Kategorie
    const selectedPack = selectLanguagePack(languagePacks, userLang, category);

    if (!selectedPack) {
        console.error("Kein passendes Sprachpaket gefunden.");
        return;
    }

    console.log(`Gewähltes Sprachpaket: ${selectedPack.link}`);

    // Lade das ausgewählte Sprachpaket
    const languageContent = await loadSelectedLanguagePack(selectedPack.link);

    // Verarbeite das Sprachpaket
    if (languageContent) {
        insertContentFromPack(languageContent);
    }
}