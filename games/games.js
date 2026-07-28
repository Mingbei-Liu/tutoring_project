"use strict";

const menuButton = document.getElementById("menuButton");
const mainNavigation = document.getElementById("mainNavigation");

if (menuButton && mainNavigation) {
    menuButton.addEventListener("click", function () {
        const isOpen = mainNavigation.classList.toggle("open");

        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });

    mainNavigation.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            mainNavigation.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open navigation menu");
        });
    });
}
