function cookieusersafer() {
    document.addEventListener("DOMContentLoaded", function () {
        const cookiePopup = document.getElementById("cookiePopup");
        const acceptButton = document.getElementById("acceptCookies");


        function checkCookieConsent() {
            const consent = localStorage.getItem("cookieConsent");
            //Ã¼berprÃ¼fung speicher und so
            if (consent === "false" || !consent) {
                cookiePopup.style.display = "block";
            }

        }

        //Speichern der Zustimmung
        function acceptCookies() {
            localStorage.setItem("cookieConsent", "true");
            cookiePopup.style.display = "none";
        }


        acceptButton.addEventListener("click", acceptCookies);


        checkCookieConsent();
    });
}