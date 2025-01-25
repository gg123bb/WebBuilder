// Hauptfunktion zum Laden und Rendern des Popups
async function renderPopupFromJSON(jsonURL) {
    try {
        const response = await fetch(jsonURL);
        const popupData = await response.json();

        // Popup-Container erstellen und anhängen
        const container = document.getElementById("dynamic-content");
        if (!container) {
            console.error("Container für Popup nicht gefunden.");
            return;
        }
        const popupElement = createElement(popupData.popup);
        container.appendChild(popupElement);

        // Module laden und als dynamische ES-Module importieren
        if (popupData.modules && Array.isArray(popupData.modules)) {
            for (const moduleURL of popupData.modules) {
                await importModule(moduleURL);
            }
        }
    } catch (error) {
        console.error("Fehler beim Laden oder Rendern des Popups:", error);
    }
}

// Hilfsfunktion zum Erstellen von DOM-Elementen aus JSON-Daten
function createElement(data) {
    const element = document.createElement(data.type || "div");

    if (data.id) {
        element.id = data.id;
    }

    if (data.text) {
        element.innerText = data.text;
    }

    if (data.children && Array.isArray(data.children)) {
        data.children.forEach(childData => {
            const childElement = createElement(childData);
            element.appendChild(childElement);
        });
    }

    return element;
}

// Funktion zum dynamischen Laden eines Moduls
async function importModule(moduleURL) {
    try {
        const module = await import(moduleURL);
        console.log(`Modul ${moduleURL} erfolgreich geladen`, module);
        if (module.init) {
            module.init();
        }
    } catch (error) {
        console.error(`Fehler beim Laden des Moduls ${moduleURL}:`, error);
    }
}

// Automatische Initialisierung beim Laden des Moduls
renderPopupFromJSON('./');
