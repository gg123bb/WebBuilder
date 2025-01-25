export function createModule(meta, content) {
    const navbarDiv = document.createElement("div");

    if (meta.id) {
        navbarDiv.id = meta.id;
    }

    navbarDiv.classList.add("FLATnavbarBODY");

    if (meta.width) {
        navbarDiv.style.width = meta.width;
    }
    if (meta.height) {
        navbarDiv.style.height = meta.height;
    }
    if (meta.center) {
        navbarDiv.style.margin = "auto";
    }
    if (meta.bg) {
        navbarDiv.style.backgroundColor = meta.bg;
    }
    if (meta.padding) {
        navbarDiv.style.padding = meta.padding;
    }

    content.forEach(item => {
        if (item.body.type === "link") {
            const linkDiv = document.createElement("div");
            linkDiv.classList.add("FLATnavbar");

            const link = document.createElement("a");
            link.classList.add("FLATnavLink");
            link.href = item.body.url;  // URL wird hinzugefügt
            link.innerText = item.body.name;

            // Klick-Event für Kategorie-Wechsel
            link.addEventListener("click", function (event) {
                event.preventDefault(); // Verhindert die Standardaktion (Navigation)

                if (item.body.onclick) {
                    // Wenn eine Klickfunktion definiert ist, führe sie aus
                    item.body.onclick();
                } else if (item.body.category) {
                    // Wechsel der Kategorie und Neuladen des Packs
                    manageLanguagePacks(item.body.category); // Die Kategorie wird übergeben
                } else {
                    // Wenn keine spezielle Aktion definiert ist, leite zur URL weiter
                    window.location.href = item.body.url;
                }
            });

            const separator = document.createElement("div");
            separator.classList.add("FLATnavTRText");
            separator.innerText = "|";

            linkDiv.appendChild(link);
            navbarDiv.appendChild(linkDiv);

            if (!meta.tr) {
                navbarDiv.appendChild(separator);
            }
        } else if (item.body.type === "imagelink") {
            const IMGlinkDiv = document.createElement("div");
            IMGlinkDiv.classList.add("FLATnavbar");

            const link = document.createElement("a");
            link.classList.add("FLATnavLink");
            link.href = item.body.url;
            if (item.body.title) {
                link.title = item.body.title;
            }

            const image = document.createElement("img");
            image.src = item.body.src;
            image.style.width = item.body.width;
            image.style.height = item.body.height;
            image.style.borderRadius = item.body.borderRadius;
            image.style.backgroundColor = item.body.BGcolor;

            if (item.body.center) {
                navbarDiv.style.justifyContent = "center";
            }

            link.appendChild(image);
            IMGlinkDiv.appendChild(link);

            // Klick-Event für Imagelinks
            link.addEventListener("click", function (event) {
                event.preventDefault(); // Verhindert die Standardaktion (Navigation)

                if (item.body.category) {
                    // Wechsel der Kategorie und Neuladen des Packs
                    manageLanguagePacks(item.body.category);
                } else {
                    // Wenn keine spezielle Aktion definiert ist, leite zur URL weiter
                    window.location.href = item.body.url;
                }
            });

            navbarDiv.appendChild(IMGlinkDiv);
        }
    });

    return navbarDiv;
}
