function popuplogic() {
    document.addEventListener("DOMContentLoaded", function() {
        const popup = document.getElementById("cookiePopup");
        const infoButton = document.getElementById("infoCookies");
        const langButton = document.getElementById("cookielang");
        const settingsButton = document.getElementById("settCookies");
        const notCokkies = document.getElementById("notCookies");
        const cookieTextButton = document.getElementById("cookietextcontent");
        const dataTrackTextButton = document.getElementById("datatracktextcontent");
        const rightTextButton = document.getElementById("reighttextcontent");
        const contentDiv = document.getElementById("cookierighttext");

        let isExpanded = false;
        let isENG = false;
        let contentData = null;

        // Funktion, um die JSON-Daten zu laden
        async function loadContent() {
            try {
                const response = await fetch('./packs/popuppack.json');
                contentData = await response.json();
            } catch (error) {
                console.error('Fehler beim Laden der Inhalte:', error);
            }
        }

        // Funktion zur Aktualisierung des Inhalts
        function updateContent(buttonType) {
            if (contentData) {
                const lang = isENG ? 'en' : 'de';

                if (buttonType === 'cookie') {
                    contentDiv.innerText = contentData[lang].cookieContent;
                } else if (buttonType === 'dataTrack') {
                    contentDiv.innerText = contentData[lang].dataTrackContent;
                } else if (buttonType === 'right') {
                    contentDiv.innerText = contentData[lang].rightContent;
                } else if (buttonType === 'sett') {
                    contentDiv.innerText = "Settings";
                }
            }
        }

        // Funktion, um den Popup-Bereich zu erweitern oder zu verkleinern
        function clickinformation() {
            if (isExpanded) {
                popup.style.width = "";
                popup.style.height = "";
                popup.style.padding = "";
                popup.style.borderRadius = "";
                infoButton.innerText = "grÃ¶ÃŸer";
                settingsButton.style.display = "none";
                notCokkies.style.display = "none";
            } else {
                popup.style.width = "100vw";
                popup.style.height = "100vh";
                popup.style.padding = "3px";
                popup.style.borderRadius = "0px";
                infoButton.innerText = "kleiner";
                settingsButton.style.display = "inline";
                notCokkies.style.display = "inline";
            }
            isExpanded = !isExpanded;
        }

        // Funktion zum Umschalten der Sprache
        function clicklang() {
            isENG = !isENG;
            langButton.innerText = isENG ? "de" : "en";
            updateContent('cookie');
        }

        // Event-Listener fÃ¼r die Buttons
        cookieTextButton.addEventListener("click", function() {
            updateContent('cookie');
        });
        dataTrackTextButton.addEventListener("click", function() {
            updateContent('dataTrack');
        });
        rightTextButton.addEventListener("click", function() {
            updateContent('right');
        });
        settingsButton.addEventListener("click", function() {
            updateContent('sett');
        });

        infoButton.addEventListener("click", clickinformation);
        langButton.addEventListener("click", clicklang);

        // Lade die Inhalte nach dem Laden der Seite
        loadContent().then(() => {
            updateContent('cookie');
        });
    });
}