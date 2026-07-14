"use strict";

/*
    Tutor information is stored directly in this file so the website
    can run locally by double-clicking schedule.html.

    No local server is required.
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
        email: "gaven@yourcompany.com",
        bookingLink:
            "https://calendar.google.com/calendar/u/0/appointments/" +
            "schedules/AcZssZ2onfBuOplXwmHRVyvlD7-Twgi_dfwOH7nvoYLglwMHNPRGknWLmokAJckgitRWe-m-lwvWt1hr"
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
        email: "tommy@yourcompany.com",
        bookingLink:
            "https://calendar.google.com/calendar/u/0/appointments/" +
            "schedules/AcZssZ3kbCHRlLoiw008OMFXiuiIpoemDMvd0IDFpcL5uM8RQ6q6DFnpyYOigXdrrhXFhgTlZJHBmBa8"
    },

    {
        id: "tori",
        name: "Tori",
        photo: "../profile_pics/tori_profile_pic.jpeg",
        subjects: [
            "Biology",
            "Statistics"
        ],
        bio:
            "Tori specializes in biology and statistics tutoring.",
        email: "tori@yourcompany.com",
        bookingLink:
            "https://calendar.google.com/calendar/u/0/appointments/" +
            "schedules/AcZssZ2SGpqRN3pG5JrTmwIpWZxvDdJxL7Zf9yitweihrB16F-l0Kd6IQ3XmXW7mXel2hLO1NIdpJ8Y2"
    }
];


let calendarLoadTimer = null;


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

const bookingFrame =
    document.getElementById("bookingFrame");

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
    Initializes the tutor-selection interface.
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
                "No valid tutor information was found."
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
    Confirms that a tutor contains all required fields.
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
    Creates a selectable card for every tutor.
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
    Selects a tutor and loads that tutor's information.
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

    loadBookingCalendar(tutor);

    selectedTutor.hidden = false;

    bookingSection.hidden = false;
}


/*
    Highlights the currently selected tutor card.
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
    Updates the larger tutor-information section.
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
    Loads the selected tutor's Google Calendar appointment
    schedule inside the iframe.
*/
function loadBookingCalendar(tutor) {
    try {
        const publicBookingUrl =
            createGoogleBookingUrl(
                tutor.bookingLink,
                false
            );

        const embeddedBookingUrl =
            createGoogleBookingUrl(
                tutor.bookingLink,
                true
            );


        bookingButton.href =
            publicBookingUrl;

        bookingButton.textContent =
            `Open ${tutor.name}'s Booking Page in a New Tab`;


        bookingFrame.title =
            `Book a tutoring appointment with ${tutor.name}`;


        calendarStatus.hidden = false;

        calendarStatus.classList.remove(
            "error"
        );

        calendarStatus.textContent =
            `Loading ${tutor.name}'s available appointments...`;


        if (calendarLoadTimer) {
            window.clearTimeout(
                calendarLoadTimer
            );
        }


        bookingFrame.onload =
            function () {
                calendarStatus.hidden = true;
            };


        bookingFrame.src =
            embeddedBookingUrl;


        calendarLoadTimer =
            window.setTimeout(
                function () {
                    if (!calendarStatus.hidden) {
                        calendarStatus.classList.add(
                            "error"
                        );

                        calendarStatus.textContent =
                            "The calendar is taking longer than expected " +
                            "to load. Use the button below to open the " +
                            "booking page in a new tab.";
                    }
                },
                12000
            );
    } catch (error) {
        console.error(error);

        calendarStatus.hidden = false;

        calendarStatus.classList.add(
            "error"
        );

        calendarStatus.textContent =
            "This tutor's Google Calendar booking link is invalid. " +
            "Check the bookingLink value inside schedule.js.";

        bookingFrame.src =
            "about:blank";

        bookingButton.removeAttribute(
            "href"
        );
    }
}


/*
    Converts the Google appointment-schedule link into
    a public link or an iframe-compatible link.
*/
function createGoogleBookingUrl(
    bookingLink,
    embedded
) {
    const url =
        new URL(bookingLink);

    if (
        url.hostname !==
        "calendar.google.com"
    ) {
        throw new Error(
            "The booking link must use calendar.google.com."
        );
    }

    if (
        !url.pathname.includes(
            "/appointments/schedules/"
        )
    ) {
        throw new Error(
            "The URL is not a Google Calendar appointment schedule."
        );
    }

    /*
        Removes the signed-in account portion, such as /u/0/,
        from the URL.
    */
    url.pathname =
        url.pathname.replace(
            /^\/calendar\/u\/\d+\//,
            "/calendar/"
        );

    if (embedded) {
        url.searchParams.set(
            "gv",
            "true"
        );
    } else {
        url.searchParams.delete(
            "gv"
        );
    }

    return url.toString();
}


/*
    Shows the tutor's initials if their profile image cannot
    be found or loaded.
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
    Creates initials such as "GJ" from a person's name.
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