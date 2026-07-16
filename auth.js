"use strict";

const USERS_STORAGE_KEY = "tutoringProgramUsers";
const CURRENT_USER_STORAGE_KEY = "tutoringProgramCurrentUser";

const authDialog = document.getElementById("authDialog");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authMessage = document.getElementById("authMessage");
const signedOutControls = document.getElementById("signedOutControls");
const signedInControls = document.getElementById("signedInControls");
const welcomeUser = document.getElementById("welcomeUser");
const logoutButton = document.getElementById("logoutButton");
const menuButton = document.getElementById("menuButton");
const mainNavigation = document.getElementById("mainNavigation");

initializePage();

function initializePage() {
    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    document.querySelectorAll("[data-open-auth]").forEach(function (button) {
        button.addEventListener("click", function () {
            openAuthDialog(button.dataset.openAuth);
        });
    });

    document.getElementById("closeAuthButton").addEventListener(
        "click",
        closeAuthDialog
    );

    document.getElementById("desktopCloseAuthButton").addEventListener(
        "click",
        closeAuthDialog
    );

    loginTab.addEventListener("click", function () {
        showAuthPanel("login");
    });

    signupTab.addEventListener("click", function () {
        showAuthPanel("signup");
    });

    loginForm.addEventListener("submit", handleLogin);
    signupForm.addEventListener("submit", handleSignup);
    logoutButton.addEventListener("click", handleLogout);

    menuButton.addEventListener("click", toggleMobileMenu);

    mainNavigation.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMobileMenu);
    });

    authDialog.addEventListener("click", function (event) {
        const dialogBounds = authDialog.getBoundingClientRect();
        const clickedOutside =
            event.clientX < dialogBounds.left ||
            event.clientX > dialogBounds.right ||
            event.clientY < dialogBounds.top ||
            event.clientY > dialogBounds.bottom;

        if (clickedOutside) {
            closeAuthDialog();
        }
    });

    authDialog.addEventListener("close", function () {
        document.body.classList.remove("modal-open");
        clearAuthMessage();
    });

    updateAccountNavigation();
}

function openAuthDialog(panelName) {
    showAuthPanel(panelName === "signup" ? "signup" : "login");
    clearAuthMessage();
    closeMobileMenu();

    if (!authDialog.open) {
        authDialog.showModal();
    }

    document.body.classList.add("modal-open");

    window.setTimeout(function () {
        const firstField =
            panelName === "signup"
                ? document.getElementById("signupName")
                : document.getElementById("loginEmail");

        firstField.focus();
    }, 0);
}

function closeAuthDialog() {
    if (authDialog.open) {
        authDialog.close();
    }
}

function showAuthPanel(panelName) {
    const showSignup = panelName === "signup";

    loginPanel.hidden = showSignup;
    signupPanel.hidden = !showSignup;

    loginTab.classList.toggle("active", !showSignup);
    signupTab.classList.toggle("active", showSignup);

    loginTab.setAttribute("aria-selected", String(!showSignup));
    signupTab.setAttribute("aria-selected", String(showSignup));

    clearAuthMessage();
}

async function handleSignup(event) {
    event.preventDefault();
    clearAuthMessage();

    const formData = new FormData(signupForm);
    const name = String(formData.get("name") || "").trim();
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (name.length < 2) {
        showAuthMessage("Please enter your full name.", true);
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage("Please enter a valid email address.", true);
        return;
    }

    if (password.length < 8) {
        showAuthMessage("Your password must be at least 8 characters.", true);
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage("The passwords do not match.", true);
        return;
    }

    const users = getStoredUsers();
    const emailAlreadyExists = users.some(function (user) {
        return user.email === email;
    });

    if (emailAlreadyExists) {
        showAuthMessage(
            "An account with this email already exists. Try logging in.",
            true
        );
        return;
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
        id: createUserId(),
        name: name,
        email: email,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    saveCurrentUser(newUser);

    signupForm.reset();
    updateAccountNavigation();
    showAuthMessage("Your account was created successfully.", false);

    window.setTimeout(closeAuthDialog, 650);
}

async function handleLogin(event) {
    event.preventDefault();
    clearAuthMessage();

    const formData = new FormData(loginForm);
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") || "");

    if (!isValidEmail(email) || password.length === 0) {
        showAuthMessage("Enter your email address and password.", true);
        return;
    }

    const passwordHash = await hashPassword(password);
    const users = getStoredUsers();
    const matchingUser = users.find(function (user) {
        return user.email === email && user.passwordHash === passwordHash;
    });

    if (!matchingUser) {
        showAuthMessage("The email or password is incorrect.", true);
        return;
    }

    saveCurrentUser(matchingUser);
    loginForm.reset();
    updateAccountNavigation();
    showAuthMessage("You are now logged in.", false);

    window.setTimeout(closeAuthDialog, 550);
}

function handleLogout() {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    updateAccountNavigation();
    closeMobileMenu();
}

function updateAccountNavigation() {
    const currentUser = getCurrentUser();
    const isLoggedIn = Boolean(currentUser);

    signedOutControls.hidden = isLoggedIn;
    signedInControls.hidden = !isLoggedIn;

    if (currentUser) {
        const firstName = currentUser.name.split(/\s+/)[0];
        welcomeUser.textContent = `Hi, ${firstName}`;
        welcomeUser.title = currentUser.email;
    } else {
        welcomeUser.textContent = "";
        welcomeUser.removeAttribute("title");
    }
}

function getStoredUsers() {
    try {
        const storedValue = localStorage.getItem(USERS_STORAGE_KEY);
        const parsedUsers = storedValue ? JSON.parse(storedValue) : [];

        return Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch (error) {
        console.error("Could not read stored users:", error);
        return [];
    }
}

function getCurrentUser() {
    try {
        const storedValue = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        return storedValue ? JSON.parse(storedValue) : null;
    } catch (error) {
        console.error("Could not read the current user:", error);
        return null;
    }
}

function saveCurrentUser(user) {
    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem(
        CURRENT_USER_STORAGE_KEY,
        JSON.stringify(safeUser)
    );
}

async function hashPassword(password) {
    if (
        window.crypto &&
        window.crypto.subtle &&
        typeof TextEncoder !== "undefined"
    ) {
        const encodedPassword = new TextEncoder().encode(password);
        const hashBuffer = await window.crypto.subtle.digest(
            "SHA-256",
            encodedPassword
        );

        return Array.from(new Uint8Array(hashBuffer))
            .map(function (byte) {
                return byte.toString(16).padStart(2, "0");
            })
            .join("");
    }

    return fallbackHash(password);
}

function fallbackHash(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return `fallback-${(hash >>> 0).toString(16)}`;
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createUserId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showAuthMessage(message, isError) {
    authMessage.textContent = message;
    authMessage.classList.toggle("error", Boolean(isError));
    authMessage.hidden = false;
}

function clearAuthMessage() {
    authMessage.textContent = "";
    authMessage.classList.remove("error");
    authMessage.hidden = true;
}

function toggleMobileMenu() {
    const menuIsOpen = mainNavigation.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(menuIsOpen));
    menuButton.setAttribute(
        "aria-label",
        menuIsOpen ? "Close navigation menu" : "Open navigation menu"
    );
}

function closeMobileMenu() {
    mainNavigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
}
