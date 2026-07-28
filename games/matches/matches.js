"use strict";

const modeInputs = Array.from(document.querySelectorAll('input[name="mode"]'));
const styleInputs = Array.from(document.querySelectorAll('input[name="computerStyle"]'));
const orderInputs = Array.from(document.querySelectorAll('input[name="turnOrder"]'));
const computerStyleFieldset = document.getElementById("computerStyleFieldset");
const turnOrderLegend = document.getElementById("turnOrderLegend");
const firstTurnLabel = document.getElementById("firstTurnLabel");
const firstTurnDescription = document.getElementById("firstTurnDescription");
const secondTurnLabel = document.getElementById("secondTurnLabel");
const secondTurnDescription = document.getElementById("secondTurnDescription");
const gameLengthSelect = document.getElementById("gameLength");
const setupSummary = document.getElementById("setupSummary");
const startGameButton = document.getElementById("startGameButton");

const boardHeading = document.getElementById("boardHeading");
const modeBadge = document.getElementById("modeBadge");
const turnMessage = document.getElementById("turnMessage");
const pileContainers = [document.getElementById("pileA"), document.getElementById("pileB")];
const pileCountElements = [document.getElementById("pileACount"), document.getElementById("pileBCount")];
const clearSelectionButtons = Array.from(document.querySelectorAll(".clear-pile-selection"));
const selectionText = document.getElementById("selectionText");
const takeMatchesButton = document.getElementById("takeMatchesButton");
const computerThinking = document.getElementById("computerThinking");
const totalMatchesBadge = document.getElementById("totalMatchesBadge");
const matchHistory = document.getElementById("matchHistory");
const resetMatchesButton = document.getElementById("resetMatchesButton");
const newMatchesButton = document.getElementById("newMatchesButton");
const gameOverPanel = document.getElementById("gameOverPanel");
const gameOverHeading = document.getElementById("gameOverHeading");
const gameOverText = document.getElementById("gameOverText");
const playAgainButton = document.getElementById("playAgainButton");
const menuButton = document.getElementById("menuButton");
const mainNavigation = document.getElementById("mainNavigation");

const AI_DELAY_MS = 850;
const winningMemo = new Map();

let settings = readSettings();
let startingPiles = [12, 10];
let piles = startingPiles.slice();
let currentPlayer = 0;
let startingPlayer = 0;
let selectedPile = null;
let selectedCount = 0;
let history = [];
let gameOver = false;
let computerTimer = null;

initialize();

function initialize() {
    [...modeInputs, ...styleInputs, ...orderInputs].forEach(function (input) {
        input.addEventListener("change", handleSettingsChange);
    });

    gameLengthSelect.addEventListener("change", handleSettingsChange);
    startGameButton.addEventListener("click", startNewRandomGame);
    takeMatchesButton.addEventListener("click", performHumanMove);
    resetMatchesButton.addEventListener("click", resetSamePiles);
    newMatchesButton.addEventListener("click", startNewRandomGame);
    playAgainButton.addEventListener("click", startNewRandomGame);

    clearSelectionButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            clearSelection();
            render();
        });
    });

    if (menuButton && mainNavigation) {
        menuButton.addEventListener("click", toggleNavigation);
        mainNavigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeNavigation);
        });
    }

    updateSettingsInterface();
    startNewRandomGame();
}

function handleSettingsChange() {
    updateSettingsInterface(readSettings());
}

function readSettings() {
    return {
        mode: getCheckedValue(modeInputs, "computer"),
        computerStyle: getCheckedValue(styleInputs, "optimal"),
        turnOrder: getCheckedValue(orderInputs, "first"),
        length: gameLengthSelect ? gameLengthSelect.value : "standard"
    };
}

function getCheckedValue(inputs, fallback) {
    const selected = inputs.find(function (input) { return input.checked; });
    return selected ? selected.value : fallback;
}

function updateSettingsInterface(configuration = settings) {
    const versusComputer = configuration.mode === "computer";
    computerStyleFieldset.hidden = !versusComputer;

    if (versusComputer) {
        turnOrderLegend.textContent = "Your turn order";
        firstTurnLabel.textContent = "I go first";
        firstTurnDescription.textContent = "You take the opening turn.";
        secondTurnLabel.textContent = "Computer goes first";
        secondTurnDescription.textContent = "The computer takes the opening turn.";
        setupSummary.textContent =
            "Versus computer · " +
            (configuration.turnOrder === "first" ? "You go first" : "Computer goes first") +
            " · " +
            (configuration.computerStyle === "optimal" ? "Optimal" : "Casual");
    } else {
        turnOrderLegend.textContent = "Starting player";
        firstTurnLabel.textContent = "Player 1 starts";
        firstTurnDescription.textContent = "Player 1 takes the opening turn.";
        secondTurnLabel.textContent = "Player 2 starts";
        secondTurnDescription.textContent = "Player 2 takes the opening turn.";
        setupSummary.textContent =
            "Two real players · " +
            (configuration.turnOrder === "first" ? "Player 1 starts" : "Player 2 starts");
    }
}

function startNewRandomGame() {
    cancelComputerTimer();
    settings = readSettings();
    updateSettingsInterface();
    startingPiles = generatePiles(settings.length);
    beginGameFromStartingPiles();
}

function resetSamePiles() {
    cancelComputerTimer();
    beginGameFromStartingPiles();
}

function beginGameFromStartingPiles() {
    piles = startingPiles.slice();
    startingPlayer = settings.turnOrder === "first" ? 0 : 1;
    currentPlayer = startingPlayer;
    selectedPile = null;
    selectedCount = 0;
    history = [];
    gameOver = false;
    gameOverPanel.hidden = true;
    computerThinking.hidden = true;
    render();
    maybeStartComputerTurn();
}

function generatePiles(length) {
    const ranges = {
        short: [5, 9],
        standard: [9, 15],
        long: [15, 22]
    };
    const range = ranges[length] || ranges.standard;
    let first = randomInteger(range[0], range[1]);
    let second = randomInteger(range[0], range[1]);

    if (first === second) {
        second = second < range[1] ? second + 1 : second - 1;
    }

    return [first, second];
}

function render() {
    renderStatus();
    renderPiles();
    renderSelection();
    renderHistory();
}

function renderStatus() {
    modeBadge.textContent = settings.mode === "computer"
        ? "Vs. Computer · " + (settings.computerStyle === "optimal" ? "Optimal" : "Casual")
        : "Two Real Players";

    const playerName = getPlayerName(currentPlayer);
    boardHeading.textContent = gameOver ? "Game complete" : playerName + "'s turn";

    turnMessage.className = "turn-message";
    if (gameOver) {
        turnMessage.textContent = "The final match was taken. The player who took it loses.";
        turnMessage.classList.add("game-over");
    } else if (isComputerTurn()) {
        turnMessage.textContent = "Computer is choosing how many matches to take from one pile.";
        turnMessage.classList.add("computer-turn");
    } else {
        turnMessage.textContent =
            "Select a match in one pile. That match and every match to its right will be removed.";
    }

    const total = piles[0] + piles[1];
    totalMatchesBadge.textContent = total + " " + (total === 1 ? "match remains" : "matches remain");
}

function renderPiles() {
    piles.forEach(function (count, pileIndex) {
        const container = pileContainers[pileIndex];
        container.innerHTML = "";
        pileCountElements[pileIndex].textContent = String(count);

        if (count === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-pile-message";
            empty.textContent = "Empty pile";
            container.appendChild(empty);
        }

        for (let index = 0; index < count; index += 1) {
            const removeCount = count - index;
            const match = document.createElement("button");
            match.type = "button";
            match.className = "match-stick";
            match.setAttribute(
                "aria-label",
                "Select " + removeCount + " " +
                (removeCount === 1 ? "match" : "matches") +
                " from Pile " + (pileIndex === 0 ? "A" : "B")
            );
            match.disabled = !isHumanTurn() || gameOver;

            if (selectedPile === pileIndex && index >= count - selectedCount) {
                match.classList.add("selected");
            }

            match.addEventListener("click", function () {
                selectMatches(pileIndex, removeCount);
            });
            container.appendChild(match);
        }

        const clearButton = clearSelectionButtons.find(function (button) {
            return Number(button.dataset.pile) === pileIndex;
        });
        if (clearButton) {
            clearButton.hidden = selectedPile !== pileIndex;
        }
    });
}

function renderSelection() {
    const canTake = isHumanTurn() && !gameOver && selectedPile !== null && selectedCount > 0;
    takeMatchesButton.disabled = !canTake;

    if (selectedPile === null || selectedCount === 0) {
        selectionText.textContent = isComputerTurn()
            ? "Waiting for the computer's move."
            : "Select matches from one pile.";
        return;
    }

    selectionText.textContent =
        "Take " + selectedCount + " " +
        (selectedCount === 1 ? "match" : "matches") +
        " from Pile " + (selectedPile === 0 ? "A" : "B") + ".";
}

function renderHistory() {
    matchHistory.innerHTML = "";
    if (history.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-history";
        empty.textContent = "The first move will appear here.";
        matchHistory.appendChild(empty);
        return;
    }

    history.forEach(function (move) {
        const item = document.createElement("li");
        item.textContent =
            move.player + " took " + move.count + " " +
            (move.count === 1 ? "match" : "matches") +
            " from Pile " + (move.pile === 0 ? "A" : "B") +
            ". " + move.remaining + " remained." +
            (move.usedOptimalStrategy ? " Computer used its optimal strategy." : "");
        matchHistory.appendChild(item);
    });
    matchHistory.scrollTop = matchHistory.scrollHeight;
}

function selectMatches(pileIndex, count) {
    if (!isHumanTurn() || gameOver) {
        return;
    }
    selectedPile = pileIndex;
    selectedCount = count;
    renderPiles();
    renderSelection();
}

function clearSelection() {
    selectedPile = null;
    selectedCount = 0;
}

function performHumanMove() {
    if (!isHumanTurn() || selectedPile === null || selectedCount < 1) {
        return;
    }
    applyMove(selectedPile, selectedCount, false);
}

function applyMove(pileIndex, count, usedOptimalStrategy) {
    if (gameOver || count < 1 || count > piles[pileIndex]) {
        return;
    }

    const playerName = getPlayerName(currentPlayer);
    piles[pileIndex] -= count;
    const remaining = piles[0] + piles[1];

    history.push({
        player: playerName,
        pile: pileIndex,
        count: count,
        remaining: remaining,
        usedOptimalStrategy: usedOptimalStrategy && settings.mode === "computer"
    });

    clearSelection();

    if (remaining === 0) {
        endGame(currentPlayer);
        return;
    }

    currentPlayer = currentPlayer === 0 ? 1 : 0;
    render();
    maybeStartComputerTurn();
}

function endGame(losingPlayerIndex) {
    gameOver = true;
    cancelComputerTimer();
    const loser = getPlayerName(losingPlayerIndex);
    const winnerIndex = losingPlayerIndex === 0 ? 1 : 0;
    const winner = getPlayerName(winnerIndex);

    gameOverHeading.textContent = winner + " wins!";
    gameOverText.textContent =
        loser + " took the absolute last match and therefore loses the game.";
    gameOverPanel.hidden = false;
    gameOverPanel.classList.add("winner-panel");
    render();
    gameOverPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function maybeStartComputerTurn() {
    if (!isComputerTurn() || gameOver) {
        computerThinking.hidden = true;
        return;
    }

    computerThinking.hidden = false;
    renderStatus();
    cancelComputerTimer();
    computerTimer = window.setTimeout(function () {
        computerTimer = null;
        const decision = chooseComputerMove(piles[0], piles[1]);
        computerThinking.hidden = true;
        applyMove(decision.pile, decision.count, decision.usedOptimalStrategy);
    }, AI_DELAY_MS);
}

function chooseComputerMove(firstPile, secondPile) {
    const useOptimal = settings.computerStyle === "optimal" || Math.random() < 0.10;
    if (useOptimal) {
        const move = chooseOptimalMove(firstPile, secondPile);
        return { ...move, usedOptimalStrategy: true };
    }

    const move = chooseGentleRandomMove(firstPile, secondPile);
    return { ...move, usedOptimalStrategy: false };
}

function chooseOptimalMove(firstPile, secondPile) {
    const legalMoves = getLegalMoves(firstPile, secondPile);
    const nonTerminalMoves = legalMoves.filter(function (move) {
        return move.result[0] + move.result[1] > 0;
    });

    const winningMoves = nonTerminalMoves.filter(function (move) {
        return !canCurrentPlayerForceWin(move.result[0], move.result[1]);
    });

    const candidates = winningMoves.length > 0
        ? winningMoves
        : (nonTerminalMoves.length > 0 ? nonTerminalMoves : legalMoves);

    candidates.sort(function (left, right) {
        if (left.count !== right.count) {
            return left.count - right.count;
        }
        const leftRemaining = left.result[0] + left.result[1];
        const rightRemaining = right.result[0] + right.result[1];
        return rightRemaining - leftRemaining;
    });

    return candidates[0];
}

function canCurrentPlayerForceWin(firstPile, secondPile) {
    const key = canonicalStateKey(firstPile, secondPile);
    if (winningMemo.has(key)) {
        return winningMemo.get(key);
    }

    if (firstPile + secondPile === 0) {
        winningMemo.set(key, true);
        return true;
    }

    const moves = getLegalMoves(firstPile, secondPile);
    for (const move of moves) {
        const remaining = move.result[0] + move.result[1];
        if (remaining === 0) {
            continue;
        }
        if (!canCurrentPlayerForceWin(move.result[0], move.result[1])) {
            winningMemo.set(key, true);
            return true;
        }
    }

    winningMemo.set(key, false);
    return false;
}

function chooseGentleRandomMove(firstPile, secondPile) {
    const legalMoves = getLegalMoves(firstPile, secondPile);
    let candidates = legalMoves.filter(function (move) {
        return move.result[0] + move.result[1] > 0;
    });
    if (candidates.length === 0) {
        candidates = legalMoves;
    }

    const weighted = [];
    candidates.forEach(function (move) {
        const originalPileSize = move.pile === 0 ? firstPile : secondPile;
        const emptiesPile = move.count === originalPileSize;
        let weight = 18 / Math.pow(move.count, 1.35);
        if (emptiesPile && originalPileSize > 2) {
            weight *= 0.28;
        }
        if (move.count <= 3) {
            weight *= 1.35;
        }
        const entries = Math.max(1, Math.round(weight));
        for (let index = 0; index < entries; index += 1) {
            weighted.push(move);
        }
    });

    return weighted[randomInteger(0, weighted.length - 1)];
}

function getLegalMoves(firstPile, secondPile) {
    const state = [firstPile, secondPile];
    const moves = [];
    state.forEach(function (pileSize, pileIndex) {
        for (let count = 1; count <= pileSize; count += 1) {
            const result = state.slice();
            result[pileIndex] -= count;
            moves.push({ pile: pileIndex, count: count, result: result });
        }
    });
    return moves;
}

function canonicalStateKey(firstPile, secondPile) {
    return firstPile <= secondPile
        ? firstPile + "," + secondPile
        : secondPile + "," + firstPile;
}

function getPlayerName(playerIndex) {
    if (settings.mode === "computer") {
        return playerIndex === 0 ? "You" : "Computer";
    }
    return playerIndex === 0 ? "Player 1" : "Player 2";
}

function isComputerTurn() {
    return settings.mode === "computer" && currentPlayer === 1 && !gameOver;
}

function isHumanTurn() {
    return settings.mode === "human" || currentPlayer === 0;
}

function cancelComputerTimer() {
    if (computerTimer !== null) {
        window.clearTimeout(computerTimer);
        computerTimer = null;
    }
}

function randomInteger(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function toggleNavigation() {
    const isOpen = mainNavigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
    );
}

function closeNavigation() {
    mainNavigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
}
