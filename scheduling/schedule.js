"use strict";

/*
    Tutor information is stored directly in this file so the
    scheduling page can be opened locally without a server.
*/

const tutors = [
    {
        id: "gaven",
        name: "Gaven",
        photo: "../profile_pics/gaven_profile_pic.jpeg",
        subjects: [
            "Calculus",
            "Physics",
            "Chemistry"
        ],
        bio:
            "Gaven specializes in mathematics, science, and helping " +
            "students develop strong problem-solving skills.",
        bookingLink:
            "https://calendly.com/gjesse-g/tutoring-with-gaven"
    },

    {
        id: "tommy",
        name: "Tommy",
        photo: "../profile_pics/tommy_profile_pic.jpeg",
        subjects: [
            "Programming",
            "Discrete Math"
        ],
        bio:
            "Tommy helps students understand programming concepts " +
            "and build computational thinking skills.",
        bookingLink:
            "https://calendly.com/mingbei-liu/tutoring-with-tommy"
    },

    {
        id: "tori",
        name: "Tori",

        /*
            Add Tori's image path here when her picture is available.

            Example:
            photo: "../profile_pics/tori_profile_pic.jpeg"
        */
        photo: "",

        subjects: [
            "Biology",
            "Statistics"
        ],
        bio:
            "Tori specializes in biology and statistics tutoring.",
        bookingLink:
            "https://calendly.com/mingbei-liu/tutoring-with-tori"
    }
];


const tutorContainer =
    document.getElementById("tutorContainer");

const selectedTutor =
    document.getElementById("selectedTutor");

const bookingSection =
    document.getElementById("bookingSection");

const tutorImage =
    document.getElementById("tutorImage");

const tutorInitials =
    document.getElementById("tutorInitials");

const tutorName =
    document.getElementById("tutorName");

const tutorSubjects =
    document.getElementById("tutorSubjects");

const tutorBio =
    document.getElementById("tutorBio");

const calendlyEmbed =
    document.getElementById("calendlyEmbed");

const bookingButton =
    document.getElementById("bookingButton");

const calendarStatus =
    document.getElementById("calendarStatus");

const pageError =
    document.getElementById("pageError");


document.addEventListener(
    "DOMContentLoaded",
    initializePage
);


/*
    Creates the tutor cards and selects the first tutor.
*/
function initializePage() {
    try {
        if (!Array.isArray(tutors) || tutors.length === 0) {
            throw new Error(
                "No tutors have been added to schedule.js."
            );
        }

        const validTutors =
            tutors.filter(isValidTutor);

        if (validTutors.length === 0) {
            throw new Error(
                "No valid tutor records were found."
            );
        }

        createTutorCards(validTutors);

        selectTutor(validTutors[0].id);
    } catch (error) {
        console.error(error);

        showPageError(
            "The tutor information could not be loaded. " +
            "Check the tutor information inside schedule.js."
        );
    }
}


/*
    Checks that each tutor has all required information.
*/
function isValidTutor(tutor) {
    return (
        tutor &&
        typeof tutor.id === "string" &&
        typeof tutor.name === "string" &&
        Array.isArray(tutor.subjects) &&
        typeof tutor.bio === "string" &&
        typeof tutor.bookingLink === "string"
    );
}


/*
    Creates one selectable card for each tutor.
*/
function createTutorCards(tutorList) {
    tutorContainer.innerHTML = "";

    tutorList.forEach(function (tutor) {
        const card =
            document.createElement("button");

        card.type = "button";
        card.className = "tutor-card";
        card.dataset.tutorId = tutor.id;

        card.setAttribute(
            "aria-pressed",
            "false"
        );


        const photoWrapper =
            document.createElement("div");

        photoWrapper.className =
            "tutor-photo-wrapper";


        const photo =
            document.createElement("img");

        photo.className =
            "tutor-card-image";

        photo.alt =
            `${tutor.name} profile picture`;


        const initials =
            document.createElement("div");

        initials.className =
            "tutor-card-initials";

        initials.textContent =
            getInitials(tutor.name);

        initials.setAttribute(
            "aria-hidden",
            "true"
        );

        initials.hidden = true;


        configurePhoto(
            photo,
            initials,
            tutor
        );


        const name =
            document.createElement("h3");

        name.textContent =
            tutor.name;


        const subjects =
            document.createElement("p");

        subjects.textContent =
            tutor.subjects.join(", ");


        photoWrapper.appendChild(photo);
        photoWrapper.appendChild(initials);

        card.appendChild(photoWrapper);
        card.appendChild(name);
        card.appendChild(subjects);


        card.addEventListener(
            "click",
            function () {
                selectTutor(tutor.id);
            }
        );


        tutorContainer.appendChild(card);
    });
}


/*
    Selects a tutor and loads their Calendly page.
*/
function selectTutor(tutorId) {
    const tutor =
        tutors.find(function (item) {
            return item.id === tutorId;
        });

    if (!tutor) {
        showPageError(
            "The selected tutor could not be found."
        );

        return;
    }

    pageError.hidden = true;

    updateActiveTutorCard(tutor.id);

    updateSelectedTutorInformation(tutor);

    loadCalendlyWidget(tutor);

    selectedTutor.hidden = false;

    bookingSection.hidden = false;
}


/*
    Highlights the selected tutor card.
*/
function updateActiveTutorCard(tutorId) {
    const cards =
        document.querySelectorAll(
            ".tutor-card"
        );

    cards.forEach(function (card) {
        const isActive =
            card.dataset.tutorId === tutorId;

        card.classList.toggle(
            "active",
            isActive
        );

        card.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });
}


/*
    Updates the selected-tutor information panel.
*/
function updateSelectedTutorInformation(tutor) {
    tutorName.textContent =
        tutor.name;

    tutorSubjects.textContent =
        "Subjects: " +
        tutor.subjects.join(", ");

    tutorBio.textContent =
        tutor.bio;

    tutorImage.alt =
        `${tutor.name} profile picture`;

    configurePhoto(
        tutorImage,
        tutorInitials,
        tutor
    );
}


/*
    Loads the selected tutor's Calendly event inside the page.
*/
function loadCalendlyWidget(tutor) {
    try {
        validateCalendlyLink(
            tutor.bookingLink
        );

        bookingButton.href =
            tutor.bookingLink;

        bookingButton.textContent =
            `Open ${tutor.name}'s Calendly Page`;

        calendlyEmbed.setAttribute(
            "aria-label",
            `Schedule a tutoring appointment with ${tutor.name}`
        );

        calendarStatus.hidden = false;

        calendarStatus.classList.remove(
            "error"
        );

        calendarStatus.textContent =
            `Loading ${tutor.name}'s available appointments...`;

        /*
            Remove the previous tutor's Calendly iframe before
            creating the newly selected tutor's scheduler.
        */
        calendlyEmbed.innerHTML = "";


        if (
            !window.Calendly ||
            typeof window.Calendly.initInlineWidget !== "function"
        ) {
            throw new Error(
                "The Calendly embed script could not be loaded."
            );
        }


        window.Calendly.initInlineWidget({
            url: tutor.bookingLink,
            parentElement: calendlyEmbed
        });


        /*
            Calendly creates an iframe inside the container.
            Add an accessible title and hide the loading message
            after the iframe finishes loading.
        */
        window.setTimeout(
            function () {
                const calendlyFrame =
                    calendlyEmbed.querySelector(
                        "iframe"
                    );

                if (calendlyFrame) {
                    calendlyFrame.title =
                        `Book a tutoring appointment with ${tutor.name}`;

                    calendlyFrame.addEventListener(
                        "load",
                        function () {
                            calendarStatus.hidden = true;
                        },
                        {
                            once: true
                        }
                    );

                    /*
                        Hide the status even if the iframe loaded
                        before the event listener was attached.
                    */
                    window.setTimeout(
                        function () {
                            calendarStatus.hidden = true;
                        },
                        1000
                    );
                } else {
                    calendarStatus.hidden = true;
                }
            },
            100
        );
    } catch (error) {
        console.error(error);

        calendlyEmbed.innerHTML = "";

        calendarStatus.hidden = false;

        calendarStatus.classList.add(
            "error"
        );

        calendarStatus.textContent =
            "The embedded scheduler could not be loaded. " +
            "Use the button below to open the tutor's Calendly page.";
    }
}


/*
    Confirms that the booking URL is a Calendly link.
*/
function validateCalendlyLink(bookingLink) {
    const url =
        new URL(bookingLink);

    if (
        url.protocol !== "https:" ||
        url.hostname !== "calendly.com"
    ) {
        throw new Error(
            "The tutor booking link must use calendly.com."
        );
    }
}


/*
    Displays the tutor's initials when their image is unavailable.
*/
function configurePhoto(
    imageElement,
    initialsElement,
    tutor
) {
    initialsElement.textContent =
        getInitials(tutor.name);

    imageElement.onerror =
        function () {
            imageElement.hidden = true;
            initialsElement.hidden = false;
        };

    if (
        typeof tutor.photo === "string" &&
        tutor.photo.trim() !== ""
    ) {
        initialsElement.hidden = true;
        imageElement.hidden = false;
        imageElement.src = tutor.photo;
    } else {
        imageElement.removeAttribute(
            "src"
        );

        imageElement.hidden = true;
        initialsElement.hidden = false;
    }
}


/*
    Creates initials from a tutor's name.
*/
function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (part) {
            return part
                .charAt(0)
                .toUpperCase();
        })
        .join("");
}


/*
    Displays a page-level error.
*/
function showPageError(message) {
    pageError.textContent =
        message;

    pageError.hidden = false;

    tutorContainer.innerHTML = "";

    selectedTutor.hidden = true;

    bookingSection.hidden = true;
}