export function createModule(meta, content) {
    // Erstelle das Hauptdiv mit der Meta-ID
    const Binfodiv = document.createElement("div");
    Binfodiv.id = meta.id || ""; // ID setzen

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
