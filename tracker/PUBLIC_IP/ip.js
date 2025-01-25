export async function ip() {
    const url = "http://ip-api.com/json/?fields=61439"; // Die Felder umfassen Status, Land, Region, Stadt, ZIP, ISP, IP

    try {
        const response = await fetch(url); // Anfrage an die API senden
        if (!response.ok) {
            throw new Error(`Fehler: ${response.statusText}`);
        }
        const data = await response.json(); // Die Antwort als JSON interpretieren
        console.log("IP-Informationen:", data);

        // Die Daten werden zurückgegeben
        return data;
    } catch (error) {
        console.error("Fehler beim Abrufen der IP-Informationen:", error);
        return null; // Gib null zurück, wenn ein Fehler auftritt
    }
}
