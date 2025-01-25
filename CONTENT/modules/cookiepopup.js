export function createModule(meta, content) {
    // Erstelle das Hauptdiv mit der Meta-ID
    const Binfodiv = document.createElement("div");
    Binfodiv.id = meta.id || ""; // ID setzen

    // Popup-Wert aus der Meta-Daten
    const popup = meta.popup; // Name des Cookies
    const popupStatus = meta.popupStatus; // Statuswert, der gesetzt werden muss, um das Popup zu schließen
    console.log(`Popup-Name: ${popup}, Erwarteter Status: ${popupStatus}`);

    // Funktion, um den Cookie-Wert zu lesen
    function getCookieValue(name) {
        console.log("Überprüfe Cookies:", document.cookie); // Debug: Alle Cookies anzeigen
        const cookies = document.cookie.split("; ");
        for (let i = 0; i < cookies.length; i++) {
            const [key, value] = cookies[i].split("=");
            console.log(`Cookie gefunden: Schlüssel = "${key}", Wert = "${value}"`); // Debug: Gefundene Cookies
            if (key.trim() === name.trim()) {
                const decodedValue = decodeURIComponent(value.trim());
                console.log(`Passender Cookie-Wert für "${name}": ${decodedValue}`); // Debug: Passender Cookie-Wert
                return decodedValue;
            }
        }
        return null; // Cookie nicht gefunden
    }

    // Überprüfe, ob Popup bereits aktiviert wurde
    const cookieValue = getCookieValue(popup)?.trim(); // Cookie-Wert bereinigen
    console.log(`Gelesener Cookie-Wert: "${cookieValue}", Erwarteter Status: "${popupStatus.trim()}"`);
    const isPopupActive = cookieValue === popupStatus.trim();
    console.log(`Popup-Aktivierungsstatus: ${isPopupActive}`);


    if (isPopupActive) {
        console.log(`Popup "${popup}" ist bereits aktiv. Es wird nicht erneut erstellt.`);

        // Gib ein leeres Div zurück, um Fehler beim Anhängen zu vermeiden
        const emptyDiv = document.createElement("div");
        emptyDiv.style.display = "none"; // Unsichtbar machen
        return emptyDiv;
    }

    // Funktion zum Erstellen von Elementen und ihren Kindern
    function createElement(item) {
        const element = document.createElement(item.type);

        // Setze die Attribute des Elements
        if (item.attributes) {
            Object.keys(item.attributes).forEach(attr => {
                element.setAttribute(attr, item.attributes[attr]);
            });
        }

        // Setze den Text des Elements, falls vorhanden
        if (item.text) {
            element.innerText = item.text;
        }

        // Verarbeite die Children des Elements, falls vorhanden
        if (item.children && Array.isArray(item.children)) {
            item.children.forEach(childItem => {
                const childElement = createElement(childItem); // Rekursiver Aufruf für Kinder
                element.appendChild(childElement); // Füge jedes Child-Element hinzu
            });
        }

        return element;
    }

    // Verarbeite jedes Element im Content
    content.forEach(item => {
        const newElement = createElement(item); // Erstellt jedes Haupt-Element
        Binfodiv.appendChild(newElement); // Füge es zum Hauptdiv hinzu
    });

    return Binfodiv; // Rückgabe des erstellten Divs
}
