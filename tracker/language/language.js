function languageNavigator () {
    // Überprüfe die Browsersprache
    if (navigator.language.indexOf("en") > -1) {
        console.log("Your packs is English!");
        return "en";
    } else if (navigator.language.indexOf("de") > -1) {
        console.log("Your packs is German!");
        return "de";
    } else {
        console.log("Language not recognized, defaulting to English.");
        return "en"; // Standardmäßig auf Englisch setzen
    }
}
