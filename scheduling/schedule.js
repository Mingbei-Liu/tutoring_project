"use strict";

// Static Google Apps Script submission flow — version 2.1

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const TUTORS = {
    gaven: "Gaven",
    tommy: "Tommy",
    tori: "Tori"
};

const START_MINUTES = 9 * 60;
const END_MINUTES = 22 * 60;
const SLOT_MINUTES = 30;
const SUBMISSION_TIMEOUT_MS = 30000;
const IFRAME_SUCCESS_DELAY_MS = 900;

const form = document.getElementById("availabilityForm");
const tutorOptions = document.getElementById("tutorOptions");
const availabilityGrid = document.getElementById("availabilityGrid");
const clearAllButton = document.getElementById("clearAllButton");
const selectionCount = document.getElementById("selectionCount");
const availabilitySummary = document.getElementById("availabilitySummary");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");
const timezoneSelect = document.getElementById("timezone");
const emailInput = document.getElementById("studentEmail");
const phoneInput = document.getElementById("studentPhone");
const submissionFrame = document.getElementById("submissionFrame");

let isDragging = false;
let dragShouldSelect = true;
let submissionInProgress = false;
let submissionTimeoutId = null;
let submissionFrameLoadTimerId = null;

initialize();

function initialize() {
    buildAvailabilityGrid();
    setDetectedTimezone();

    availabilityGrid.addEventListener("pointermove", handlePointerMove);
    clearAllButton.addEventListener("click", clearAllSlots);
    form.addEventListener("submit", submitAvailability);
    emailInput.addEventListener("input", clearContactErrors);
    phoneInput.addEventListener("input", clearContactErrors);
    tutorOptions.addEventListener("change", clearTutorError);

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("message", handleSubmissionMessage);
    submissionFrame.addEventListener("load", handleSubmissionFrameLoad);
}

function buildAvailabilityGrid() {
    availabilityGrid.innerHTML = "";

    const corner = document.createElement("div");
    corner.className = "grid-corner";
    corner.setAttribute("role", "columnheader");
    corner.textContent = "Time";
    availabilityGrid.appendChild(corner);

    DAYS.forEach(function (day, dayIndex) {
        const heading = document.createElement("div");
        heading.className = "day-heading";
        heading.setAttribute("role", "columnheader");

        const label = document.createElement("strong");
        label.textContent = day;

        const dayAction = document.createElement("button");
        dayAction.type = "button";
        dayAction.className = "day-action";
        dayAction.textContent = "Select day";
        dayAction.dataset.dayIndex = String(dayIndex);
        dayAction.addEventListener("click", toggleWholeDay);

        heading.append(label, dayAction);
        availabilityGrid.appendChild(heading);
    });

    for (let start = START_MINUTES; start < END_MINUTES; start += SLOT_MINUTES) {
        const isHourStart = start % 60 === 0;
        const timeLabel = document.createElement("div");
        timeLabel.className = "time-label" + (isHourStart ? " hour-start" : "");
        timeLabel.setAttribute("role", "rowheader");
        timeLabel.textContent = formatTime(start);
        availabilityGrid.appendChild(timeLabel);

        DAYS.forEach(function (day, dayIndex) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "time-slot" + (isHourStart ? " hour-start" : "");
            cell.dataset.day = day;
            cell.dataset.dayIndex = String(dayIndex);
            cell.dataset.start = String(start);
            cell.dataset.end = String(start + SLOT_MINUTES);
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("aria-pressed", "false");
            cell.setAttribute(
                "aria-label",
                `${day}, ${formatTime(start)} to ${formatTime(start + SLOT_MINUTES)}`
            );

            cell.addEventListener("pointerdown", beginDragSelection);
            cell.addEventListener("pointerenter", continueDragSelection);
            cell.addEventListener("keydown", handleCellKeyboard);

            availabilityGrid.appendChild(cell);
        });
    }
}

function beginDragSelection(event) {
    if (event.button !== 0 && event.pointerType === "mouse") {
        return;
    }

    event.preventDefault();
    isDragging = true;
    dragShouldSelect = !event.currentTarget.classList.contains("selected");
    setCellSelected(event.currentTarget, dragShouldSelect);
}

function continueDragSelection(event) {
    if (!isDragging) {
        return;
    }

    setCellSelected(event.currentTarget, dragShouldSelect);
}

function handlePointerMove(event) {
    if (!isDragging) {
        return;
    }

    event.preventDefault();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cell = element ? element.closest(".time-slot") : null;

    if (cell && availabilityGrid.contains(cell)) {
        setCellSelected(cell, dragShouldSelect);
    }
}

function stopDragging() {
    if (!isDragging) {
        return;
    }

    isDragging = false;
    updateAvailabilityDisplay();
}

function handleCellKeyboard(event) {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    event.preventDefault();
    const cell = event.currentTarget;
    setCellSelected(cell, !cell.classList.contains("selected"));
    updateAvailabilityDisplay();
}

function setCellSelected(cell, shouldSelect) {
    cell.classList.toggle("selected", shouldSelect);
    cell.setAttribute("aria-pressed", String(shouldSelect));
}

function toggleWholeDay(event) {
    const dayIndex = event.currentTarget.dataset.dayIndex;
    const dayCells = Array.from(
        document.querySelectorAll(`.time-slot[data-day-index="${dayIndex}"]`)
    );
    const shouldSelect = dayCells.some(function (cell) {
        return !cell.classList.contains("selected");
    });

    dayCells.forEach(function (cell) {
        setCellSelected(cell, shouldSelect);
    });

    updateAvailabilityDisplay();
}

function clearAllSlots() {
    document.querySelectorAll(".time-slot.selected").forEach(function (cell) {
        setCellSelected(cell, false);
    });

    updateAvailabilityDisplay();
}

function updateAvailabilityDisplay() {
    const selectedCells = getSelectedCells();
    const intervalCount = selectedCells.length;
    const totalHours = intervalCount * SLOT_MINUTES / 60;

    if (intervalCount === 0) {
        selectionCount.textContent = "No time selected yet.";
        availabilitySummary.innerHTML = "";
    } else {
        selectionCount.textContent = `${formatDuration(totalHours)} selected.`;
        renderAvailabilitySummary(buildAvailabilityPayload());
    }

    DAYS.forEach(function (day, dayIndex) {
        const dayCells = Array.from(
            document.querySelectorAll(`.time-slot[data-day-index="${dayIndex}"]`)
        );
        const selectedForDay = dayCells.filter(function (cell) {
            return cell.classList.contains("selected");
        }).length;
        const action = document.querySelector(`.day-action[data-day-index="${dayIndex}"]`);

        if (action) {
            action.textContent = selectedForDay === dayCells.length ? "Clear day" : "Select day";
            action.setAttribute(
                "aria-label",
                `${selectedForDay === dayCells.length ? "Clear" : "Select"} all ${day} time slots`
            );
        }
    });
}

function getSelectedCells() {
    return Array.from(document.querySelectorAll(".time-slot.selected"));
}

function buildAvailabilityPayload() {
    return DAYS.map(function (day) {
        const starts = getSelectedCells()
            .filter(function (cell) {
                return cell.dataset.day === day;
            })
            .map(function (cell) {
                return Number(cell.dataset.start);
            })
            .sort(function (a, b) {
                return a - b;
            });

        const intervals = [];

        starts.forEach(function (start) {
            const lastInterval = intervals[intervals.length - 1];

            if (lastInterval && lastInterval.end === start) {
                lastInterval.end = start + SLOT_MINUTES;
            } else {
                intervals.push({
                    start: start,
                    end: start + SLOT_MINUTES
                });
            }
        });

        return {
            day: day,
            intervals: intervals.map(function (interval) {
                return {
                    start: minutesTo24Hour(interval.start),
                    end: minutesTo24Hour(interval.end)
                };
            })
        };
    }).filter(function (dayEntry) {
        return dayEntry.intervals.length > 0;
    });
}

function renderAvailabilitySummary(availability) {
    const list = document.createElement("ul");
    list.className = "summary-list";

    availability.forEach(function (dayEntry) {
        const item = document.createElement("li");
        const strong = document.createElement("strong");
        strong.textContent = `${dayEntry.day}: `;

        const text = document.createTextNode(
            dayEntry.intervals.map(function (interval) {
                return `${formatTime(parseTime(interval.start))}–${formatTime(parseTime(interval.end))}`;
            }).join(", ")
        );

        item.append(strong, text);
        list.appendChild(item);
    });

    availabilitySummary.innerHTML = "";
    availabilitySummary.appendChild(list);
}

function submitAvailability(event) {
    event.preventDefault();
    hideMessage();
    clearFieldErrors();

    const availability = buildAvailabilityPayload();
    const formData = new FormData(form);
    const data = {
        tutor: String(formData.get("tutor") || "").trim(),
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        subject: String(formData.get("subject") || "").trim(),
        timezone: String(formData.get("timezone") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
        website: String(formData.get("website") || "").trim(),
        availability: availability
    };

    const firstInvalidField = validateForm(data);
    if (firstInvalidField) {
        firstInvalidField.focus();
        return;
    }

    const endpoint = getSubmissionEndpoint();
    if (!endpoint) {
        showMessage(
            "error",
            "Submission setup is incomplete. Paste the deployed Google Apps Script /exec URL into scheduling/config.js."
        );
        scrollToMessage();
        return;
    }

    startSubmission();

    const outgoingForm = document.createElement("form");
    outgoingForm.method = "POST";
    outgoingForm.action = endpoint;
    outgoingForm.target = submissionFrame.name;
    outgoingForm.style.display = "none";

    const fields = {
        tutor: data.tutor,
        tutorName: TUTORS[data.tutor] || data.tutor,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        timezone: data.timezone,
        notes: data.notes,
        website: data.website,
        availability: JSON.stringify(data.availability),
        availabilityText: formatAvailabilityForSubmission(data.availability),
        clientSubmittedAt: new Date().toISOString(),
        sourcePage: window.location.href
    };

    Object.entries(fields).forEach(function ([name, value]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        outgoingForm.appendChild(input);
    });

    document.body.appendChild(outgoingForm);
    outgoingForm.submit();
    outgoingForm.remove();
}

function getSubmissionEndpoint() {
    const endpoint = String(window.TUTORING_FORM_ENDPOINT || "").trim();

    if (
        !endpoint ||
        endpoint === "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
    ) {
        return "";
    }

    try {
        const url = new URL(endpoint);
        const isGoogleScript =
            url.protocol === "https:" &&
            url.hostname === "script.google.com" &&
            url.pathname.startsWith("/macros/s/") &&
            url.pathname.endsWith("/exec");

        return isGoogleScript ? url.href : "";
    } catch (error) {
        return "";
    }
}

function startSubmission() {
    submissionInProgress = true;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting…";

    window.clearTimeout(submissionTimeoutId);
    submissionTimeoutId = window.setTimeout(function () {
        if (!submissionInProgress) {
            return;
        }

        finishSubmission();
        showMessage(
            "error",
            "The request could not be confirmed. Check your internet connection, then try submitting again."
        );
        scrollToMessage();
    }, SUBMISSION_TIMEOUT_MS);
}

function handleSubmissionFrameLoad() {
    if (!submissionInProgress) {
        return;
    }

    window.clearTimeout(submissionFrameLoadTimerId);
    submissionFrameLoadTimerId = window.setTimeout(function () {
        if (!submissionInProgress) {
            return;
        }

        finishSubmission();
        showMessage(
            "success",
            "Your availability request was sent successfully. We will contact you after reviewing the times you selected."
        );
        resetSubmittedForm();
        scrollToMessage();
    }, IFRAME_SUCCESS_DELAY_MS);
}

function handleSubmissionMessage(event) {
    if (!submissionInProgress || event.source !== submissionFrame.contentWindow) {
        return;
    }

    const result = event.data;

    if (
        !result ||
        typeof result !== "object" ||
        result.type !== "tutoringAvailabilityResult"
    ) {
        return;
    }

    finishSubmission();

    if (!result.success) {
        showMessage(
            "error",
            result.message || "Your request could not be submitted. Please try again."
        );
        scrollToMessage();
        return;
    }

    if (result.emailSent === false) {
        showMessage(
            "warning",
            "Your request reached the form, but the notification email could not be sent. Please email mingbei.liu@gmail.com directly."
        );
    } else if (result.sheetSaved === false) {
        showMessage(
            "success",
            "Your availability request was emailed successfully. The backup Google Sheet log was not updated, but no further action is needed."
        );
    } else {
        showMessage(
            "success",
            "Your availability request was sent successfully. We will contact you after reviewing the times you selected."
        );
    }

    resetSubmittedForm();
    scrollToMessage();
}

function resetSubmittedForm() {
    form.reset();
    clearAllSlots();
    clearTutorError();
    setDetectedTimezone();
}

function finishSubmission() {
    submissionInProgress = false;
    window.clearTimeout(submissionTimeoutId);
    window.clearTimeout(submissionFrameLoadTimerId);
    submissionTimeoutId = null;
    submissionFrameLoadTimerId = null;
    submitButton.disabled = false;
    submitButton.textContent = "Submit availability";
}

function formatAvailabilityForSubmission(availability) {
    return availability.map(function (dayEntry) {
        const times = dayEntry.intervals.map(function (interval) {
            return `${formatTime(parseTime(interval.start))}–${formatTime(parseTime(interval.end))}`;
        }).join(", ");

        return `${dayEntry.day}: ${times}`;
    }).join("\n");
}

function validateForm(data) {
    let firstInvalid = null;

    const selectedTutor = form.querySelector('input[name="tutor"]:checked');
    if (!data.tutor || !selectedTutor) {
        tutorOptions.setAttribute("aria-invalid", "true");
        firstInvalid = form.querySelector('input[name="tutor"]');
        showMessage("error", "Please choose a tutor.");
    }

    const requiredFields = [
        [document.getElementById("studentName"), data.name],
        [document.getElementById("subject"), data.subject],
        [timezoneSelect, data.timezone]
    ];

    requiredFields.forEach(function ([field, value]) {
        if (!value) {
            markInvalid(field);
            firstInvalid = firstInvalid || field;
        }
    });

    if (!data.email && !data.phone) {
        markInvalid(emailInput);
        markInvalid(phoneInput);
        firstInvalid = firstInvalid || emailInput;
        showMessage("error", "Please enter either an email address or a phone number.");
    } else if (data.email && !isValidEmail(data.email)) {
        markInvalid(emailInput);
        firstInvalid = firstInvalid || emailInput;
        showMessage("error", "Please enter a valid email address.");
    }

    if (data.availability.length === 0) {
        firstInvalid = firstInvalid || availabilityGrid.querySelector(".time-slot");
        showMessage("error", "Please select at least one available 30-minute interval.");
    }

    if (firstInvalid && formMessage.hidden) {
        showMessage("error", "Please complete all required fields.");
    }

    return firstInvalid;
}

function markInvalid(field) {
    field.setAttribute("aria-invalid", "true");
}

function clearFieldErrors() {
    form.querySelectorAll("[aria-invalid='true']").forEach(function (field) {
        field.removeAttribute("aria-invalid");
    });

    clearTutorError();
}

function clearTutorError() {
    tutorOptions.removeAttribute("aria-invalid");
}

function clearContactErrors() {
    emailInput.removeAttribute("aria-invalid");
    phoneInput.removeAttribute("aria-invalid");
}

function showMessage(type, message) {
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = message;
    formMessage.hidden = false;
}

function hideMessage() {
    formMessage.hidden = true;
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

function scrollToMessage() {
    window.scrollTo({
        top: formMessage.getBoundingClientRect().top + window.scrollY - 24,
        behavior: "smooth"
    });
}

function setDetectedTimezone() {
    let detectedTimezone = "";

    try {
        detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (error) {
        detectedTimezone = "";
    }

    if (!detectedTimezone) {
        return;
    }

    const existingOption = Array.from(timezoneSelect.options).find(function (option) {
        return option.value === detectedTimezone;
    });

    if (!existingOption) {
        const detectedOption = document.createElement("option");
        detectedOption.value = detectedTimezone;
        detectedOption.textContent = `${detectedTimezone.replaceAll("_", " ")} (detected)`;
        timezoneSelect.appendChild(detectedOption);
    }

    timezoneSelect.value = detectedTimezone;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function minutesTo24Hour(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function parseTime(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const normalizedHours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const suffix = normalizedHours >= 12 ? "PM" : "AM";
    const displayHours = normalizedHours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function formatDuration(hours) {
    if (Number.isInteger(hours)) {
        return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }

    return `${hours.toFixed(1)} hours`;
}
