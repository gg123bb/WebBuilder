export function createPopupModule(meta, content, scripts) {
    // Popup-Container erstellen
    const popupDiv = document.createElement("div");
    popupDiv.id = meta.id || "popup";
    popupDiv.style.width = meta.width || "50vw";
    popupDiv.style.height = meta.height || "50vh";
    popupDiv.style.backgroundColor = meta.background || "#fff";
    popupDiv.style.position = "fixed";
    popupDiv.style.top = "50%";
    popupDiv.style.left = "50%";
    popupDiv.style.transform = "translate(-50%, -50%)";
    popupDiv.style.zIndex = "1000";
    popupDiv.style.display = "none"; // Startet versteckt

    // Inhalte dynamisch erzeugen
    content.forEach(item => {
        const element = document.createElement(item.type);
        if (item.attributes) {
            Object.keys(item.attributes).forEach(attr => {
                element.setAttribute(attr, item.attributes[attr]);
            });
        }
        if (item.text) {
            element.innerText = item.text;
        }
        popupDiv.appendChild(element);
    });

    // Schließen-Button, falls aktiviert
    if (meta.closeButton) {
        const closeButton = document.createElement("button");
        closeButton.innerText = "Schließen";
        closeButton.style.position = "absolute";
        closeButton.style.top = "10px";
        closeButton.style.right = "10px";
        closeButton.addEventListener("click", () => {
            popupDiv.style.display = "none";
        });
        popupDiv.appendChild(closeButton);
    }

    // Popup zum Body hinzufügen
    document.body.appendChild(popupDiv);

    // Popup-Trigger einrichten
    const triggerElement = document.querySelector(meta.trigger);
    if (triggerElement) {
        triggerElement.addEventListener("click", () => {
            popupDiv.style.display = "block";
            loadPopupScripts(scripts); // Lädt die definierten Skripte beim Öffnen des Popups
        });
    }

    return popupDiv;
}

// Funktion zum Laden der Skripte
function loadPopupScripts(scripts) {
    scripts.forEach(script => {
        if (script.type === "inline") {
            const inlineScript = document.createElement("script");
            inlineScript.innerHTML = script.content;
            document.body.appendChild(inlineScript);
        } else if (script.type === "external") {
            const externalScript = document.createElement("script");
            externalScript.src = script.src;
            externalScript.onload = () => console.log(`Loaded script: ${script.src}`);
            document.body.appendChild(externalScript);
        }
    });
}

