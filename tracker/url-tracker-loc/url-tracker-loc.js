// Funktion zum Auslesen der URL-Parameter und Rückgabe als Array von Objekten
function getURLParamsAsArray() {
    const params = new URLSearchParams(window.location.search);
    const result = [];

    // Iteriere über die URL-Parameter und speichere sie als Objekte im Array
    for (const [key, value] of params.entries()) {
        const paramObj = {};
        paramObj[key] = value;
        result.push(paramObj);
    }

    return result;
}

// Beispiel: Rufe die Parameter auf und zeige sie in der Konsole an
