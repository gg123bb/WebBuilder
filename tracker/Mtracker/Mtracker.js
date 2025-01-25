let currentDiv = null;
let startTime = null;
let trackingData = [];
//farbe (wird noch später abgerufen bitte dort löschen nicht hier!)
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function trackMouseMovement() {
    document.addEventListener("mouseover", function(event) {
        let target = event.target;

        // id vom parent
        while (target && !target.id) {
            target = target.parentElement;
        }

        if (currentDiv !== target) {

            //änderungen im div bei div bei wechsel auf ein anderen div
            if (currentDiv && startTime) {
                const duration = (Date.now() - startTime) / 1000; // in Sekunden
                trackingData.push({
                    id: currentDiv.id || 'ohne ID',
                    duration: duration
                });
                console.log(`ID: ${currentDiv.id || 'ohne ID'}, Verweildauer: ${duration} Sekunden`);
            }

            // Neues Element als aktuelles Div speichern
            currentDiv = target;
            startTime = Date.now();


                //farbe für DEBUG zwecke hier wieder anstellen
            /*
            const randomColor = getRandomColor();
            currentDiv.style.backgroundColor = randomColor;
            */

        }
    });

    document.addEventListener("mouseout", function(event) {
        if (currentDiv && startTime) {
            const duration = (Date.now() - startTime) / 1000;
            trackingData.push({
                id: currentDiv.id || 'ohne ID',
                duration: duration
            });
            //console.log(`ID: ${currentDiv.id || 'ohne ID'}, Verweildauer: ${duration} Sekunden`);

            // Reset für das nächste Div
            currentDiv = null;
            startTime = null;
        }
    });
}
trackMouseMovement();
