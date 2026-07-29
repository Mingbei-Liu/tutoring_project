"use strict";

document.addEventListener("DOMContentLoaded", initializePage);

const MIN_ROWS = 2;
const MAX_ROWS = 10;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 12;

let rows = 5;
let columns = 7;
let players = ["Player 1", "Player 2"];
let startingPlayerIndex = 0;
let currentPlayerIndex = 0;
let activeTiles = [];
let moveHistory = [];
let undoStack = [];
let gameOver = false;
let previewCoordinate = null;

let setupPanel;
let gamePanel;
let resultPanel;
let rowInput;
let columnInput;
let playerOneInput;
let playerTwoInput;
let startingPlayerSelect;
let startGameButton;
let gridBoard;
let turnHeading;
let dimensionBadge;
let remainingBadge;
let boardMessage;
let undoMoveButton;
let resetGameButton;
let changeSetupButton;
let moveCountBadge;
let moveHistoryElement;
let resultHeading;
let resultExplanation;
let playAgainButton;
let resultSetupButton;
let gameAnnouncement;
let menuButton;
let mainNavigation;


function initializePage() {
    setupPanel = document.getElementById("setupPanel");
    gamePanel = document.getElementById("gamePanel");
    resultPanel = document.getElementById("resultPanel");
    rowInput = document.getElementById("rowInput");
    columnInput = document.getElementById("columnInput");
    playerOneInput = document.getElementById("playerOneInput");
    playerTwoInput = document.getElementById("playerTwoInput");
    startingPlayerSelect = document.getElementById("startingPlayerSelect");
    startGameButton = document.getElementById("startGameButton");
    gridBoard = document.getElementById("gridBoard");
    turnHeading = document.getElementById("turnHeading");
    dimensionBadge = document.getElementById("dimensionBadge");
    remainingBadge = document.getElementById("remainingBadge");
    boardMessage = document.getElementById("boardMessage");
    undoMoveButton = document.getElementById("undoMoveButton");
    resetGameButton = document.getElementById("resetGameButton");
    changeSetupButton = document.getElementById("changeSetupButton");
    moveCountBadge = document.getElementById("moveCountBadge");
    moveHistoryElement = document.getElementById("moveHistory");
    resultHeading = document.getElementById("resultHeading");
    resultExplanation = document.getElementById("resultExplanation");
    playAgainButton = document.getElementById("playAgainButton");
    resultSetupButton = document.getElementById("resultSetupButton");
    gameAnnouncement = document.getElementById("gameAnnouncement");
    menuButton = document.getElementById("menuButton");
    mainNavigation = document.getElementById("mainNavigation");

    const requiredElements = [
        setupPanel,
        gamePanel,
        resultPanel,
        rowInput,
        columnInput,
        playerOneInput,
        playerTwoInput,
        startingPlayerSelect,
        startGameButton,
        gridBoard,
        turnHeading,
        dimensionBadge,
        remainingBadge,
        boardMessage,
        undoMoveButton,
        resetGameButton,
        changeSetupButton,
        moveCountBadge,
        moveHistoryElement,
        resultHeading,
        resultExplanation,
        playAgainButton,
        resultSetupButton,
        gameAnnouncement
    ];

    if (requiredElements.some(function (element) { return !element; })) {
        console.error("Poison Grid could not initialize because required HTML elements are missing.");
        return;
    }

    startGameButton.addEventListener("click", startConfiguredGame);
    undoMoveButton.addEventListener("click", undoLastMove);
    resetGameButton.addEventListener("click", resetCurrentBoard);
    changeSetupButton.addEventListener("click", showSetup);
    playAgainButton.addEventListener("click", resetCurrentBoard);
    resultSetupButton.addEventListener("click", showSetup);

    gridBoard.addEventListener("mouseleave", clearPreview);

    rowInput.addEventListener("change", clampDimensionInputs);
    columnInput.addEventListener("change", clampDimensionInputs);
    playerOneInput.addEventListener("input", updateStartingPlayerOptions);
    playerTwoInput.addEventListener("input", updateStartingPlayerOptions);

    if (menuButton && mainNavigation) {
        menuButton.addEventListener("click", toggleNavigation);

        mainNavigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeNavigation);
        });
    }

    updateStartingPlayerOptions();
    setupPanel.hidden = false;
    gamePanel.hidden = true;
    resultPanel.hidden = true;
}


function updateStartingPlayerOptions() {
    const firstName = normalizePlayerName(playerOneInput.value, "Player 1");
    const secondName = normalizePlayerName(playerTwoInput.value, "Player 2");

    startingPlayerSelect.options[0].textContent = firstName;
    startingPlayerSelect.options[1].textContent = secondName;
}


function startConfiguredGame() {
    rows = clampInteger(rowInput.value, MIN_ROWS, MAX_ROWS, 5);
    columns = clampInteger(columnInput.value, MIN_COLUMNS, MAX_COLUMNS, 7);

    rowInput.value = String(rows);
    columnInput.value = String(columns);

    players = [
        normalizePlayerName(playerOneInput.value, "Player 1"),
        normalizePlayerName(playerTwoInput.value, "Player 2")
    ];

    playerOneInput.value = players[0];
    playerTwoInput.value = players[1];
    updateStartingPlayerOptions();

    startingPlayerIndex = startingPlayerSelect.value === "1" ? 1 : 0;

    resetGameState();

    setupPanel.hidden = true;
    gamePanel.hidden = false;
    resultPanel.hidden = true;

    renderAll();
    setBoardMessage(
        players[currentPlayerIndex] +
        "'s turn. Hover over a tile to preview the move.",
        ""
    );

    gameAnnouncement.textContent =
        players[currentPlayerIndex] +
        " begins on a " +
        rows +
        " by " +
        columns +
        " grid.";
}


function resetCurrentBoard() {
    resetGameState();

    gamePanel.hidden = false;
    resultPanel.hidden = true;

    renderAll();
    setBoardMessage(
        players[currentPlayerIndex] +
        "'s turn. The board has been reset.",
        ""
    );

    gameAnnouncement.textContent =
        "The board was reset. " +
        players[currentPlayerIndex] +
        " begins.";
}


function resetGameState() {
    activeTiles = Array.from(
        { length: rows },
        function () {
            return Array(columns).fill(true);
        }
    );

    currentPlayerIndex = startingPlayerIndex;
    moveHistory = [];
    undoStack = [];
    gameOver = false;
    previewCoordinate = null;
}


function showSetup() {
    clearPreview();

    setupPanel.hidden = false;
    gamePanel.hidden = true;
    resultPanel.hidden = true;

    setupPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function renderAll() {
    renderBoard();
    renderStatus();
    renderHistory();
    renderControls();
}


function renderBoard() {
    gridBoard.innerHTML = "";
    gridBoard.style.setProperty("--grid-columns", String(columns));

    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const tile = document.createElement("button");
            tile.type = "button";
            tile.className = "grid-tile";
            tile.dataset.row = String(row);
            tile.dataset.column = String(column);
            tile.setAttribute("role", "gridcell");

            const isActive = activeTiles[row][column];
            const isPoison = isPoisonCoordinate(row, column);

            if (!isActive) {
                tile.classList.add("removed");
                tile.disabled = true;
                tile.setAttribute(
                    "aria-label",
                    buildTileLabel(row, column, true, isPoison)
                );
                gridBoard.appendChild(tile);
                continue;
            }

            if (isPoison) {
                tile.classList.add("poison");
                tile.textContent = "POISON";
            } else {
                tile.textContent = coordinateLabel(row, column);
            }

            tile.setAttribute(
                "aria-label",
                buildTileLabel(row, column, false, isPoison)
            );

            tile.addEventListener("mouseenter", function () {
                previewMove(row, column);
            });

            tile.addEventListener("focus", function () {
                previewMove(row, column);
            });

            tile.addEventListener("click", function () {
                commitMove(row, column);
            });

            gridBoard.appendChild(tile);
        }
    }

    updatePreviewClasses();
}


function previewMove(row, column) {
    if (gameOver || !activeTiles[row][column]) {
        return;
    }

    previewCoordinate = { row: row, column: column };

    const removalCount = getTilesRemovedByMove(row, column).length;
    const isPoison = isPoisonCoordinate(row, column);

    if (isPoison) {
        setBoardMessage(
            "Danger: this is the poisoned bottom-left tile. Taking it loses the game.",
            "danger"
        );
    } else {
        setBoardMessage(
            "This move removes " +
            removalCount +
            " " +
            (removalCount === 1 ? "tile" : "tiles") +
            ". Click to confirm.",
            ""
        );
    }

    updatePreviewClasses();
}


function clearPreview() {
    if (!previewCoordinate) {
        return;
    }

    previewCoordinate = null;
    updatePreviewClasses();

    if (!gameOver && boardMessage) {
        setBoardMessage(
            players[currentPlayerIndex] +
            "'s turn. Hover over a tile to preview the move.",
            ""
        );
    }
}


function updatePreviewClasses() {
    if (!gridBoard) {
        return;
    }

    gridBoard.querySelectorAll(".grid-tile").forEach(function (tile) {
        tile.classList.remove("preview");

        if (!previewCoordinate || tile.classList.contains("removed")) {
            return;
        }

        const tileRow = Number(tile.dataset.row);
        const tileColumn = Number(tile.dataset.column);

        if (
            isTileRemovedByMove(
                tileRow,
                tileColumn,
                previewCoordinate.row,
                previewCoordinate.column
            )
        ) {
            tile.classList.add("preview");
        }
    });
}


function commitMove(row, column) {
    if (gameOver || !activeTiles[row][column]) {
        return;
    }

    undoStack.push(createSnapshot());

    const actingPlayerIndex = currentPlayerIndex;
    const actingPlayer = players[actingPlayerIndex];
    const removedCoordinates = getTilesRemovedByMove(row, column);

    removedCoordinates.forEach(function (coordinate) {
        activeTiles[coordinate.row][coordinate.column] = false;
    });

    const poisonTaken = isPoisonCoordinate(row, column);

    moveHistory.push({
        player: actingPlayer,
        row: row,
        column: column,
        count: removedCoordinates.length,
        poison: poisonTaken
    });

    previewCoordinate = null;

    if (poisonTaken) {
        finishGame(actingPlayerIndex);
        return;
    }

    currentPlayerIndex = otherPlayerIndex(currentPlayerIndex);

    renderAll();
    setBoardMessage(
        players[currentPlayerIndex] +
        "'s turn. Choose any remaining tile.",
        "success"
    );

    gameAnnouncement.textContent =
        actingPlayer +
        " removed " +
        removedCoordinates.length +
        " " +
        (removedCoordinates.length === 1 ? "tile" : "tiles") +
        ". It is now " +
        players[currentPlayerIndex] +
        "'s turn.";
}


function finishGame(losingPlayerIndex) {
    gameOver = true;

    const winningPlayerIndex = otherPlayerIndex(losingPlayerIndex);

    gamePanel.hidden = false;
    resultPanel.hidden = false;

    resultHeading.textContent = players[winningPlayerIndex] + " wins!";
    resultExplanation.textContent =
        players[losingPlayerIndex] +
        " took the poisoned bottom-left tile and loses the game.";

    renderAll();
    setBoardMessage(
        players[losingPlayerIndex] +
        " took the poison tile. Game over.",
        "danger"
    );

    resultPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    gameAnnouncement.textContent =
        players[winningPlayerIndex] +
        " wins because " +
        players[losingPlayerIndex] +
        " took the poison tile.";
}


function undoLastMove() {
    const snapshot = undoStack.pop();

    if (!snapshot) {
        return;
    }

    activeTiles = snapshot.activeTiles.map(function (row) {
        return row.slice();
    });

    currentPlayerIndex = snapshot.currentPlayerIndex;
    moveHistory = snapshot.moveHistory.map(function (move) {
        return { ...move };
    });
    gameOver = snapshot.gameOver;
    previewCoordinate = null;

    resultPanel.hidden = true;

    renderAll();
    setBoardMessage(
        "The previous move was undone. " +
        players[currentPlayerIndex] +
        "'s turn.",
        ""
    );

    gameAnnouncement.textContent = "The previous move was undone.";
}


function createSnapshot() {
    return {
        activeTiles: activeTiles.map(function (row) {
            return row.slice();
        }),
        currentPlayerIndex: currentPlayerIndex,
        moveHistory: moveHistory.map(function (move) {
            return { ...move };
        }),
        gameOver: gameOver
    };
}


function getTilesRemovedByMove(selectedRow, selectedColumn) {
    const removed = [];

    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            if (
                activeTiles[row][column] &&
                isTileRemovedByMove(
                    row,
                    column,
                    selectedRow,
                    selectedColumn
                )
            ) {
                removed.push({ row: row, column: column });
            }
        }
    }

    return removed;
}


function isTileRemovedByMove(
    tileRow,
    tileColumn,
    selectedRow,
    selectedColumn
) {
    return tileRow <= selectedRow && tileColumn >= selectedColumn;
}


function isPoisonCoordinate(row, column) {
    return row === rows - 1 && column === 0;
}


function renderStatus() {
    turnHeading.textContent =
        gameOver ? "Game over" : players[currentPlayerIndex];

    dimensionBadge.textContent = rows + " × " + columns + " grid";

    const remaining = countRemainingTiles();
    remainingBadge.textContent =
        remaining +
        " " +
        (remaining === 1 ? "tile remaining" : "tiles remaining");
}


function renderHistory() {
    moveCountBadge.textContent =
        moveHistory.length +
        " " +
        (moveHistory.length === 1 ? "move" : "moves");

    moveHistoryElement.innerHTML = "";

    if (moveHistory.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-history";
        empty.textContent = "Moves will appear here.";
        moveHistoryElement.appendChild(empty);
        return;
    }

    moveHistory.forEach(function (move, index) {
        const item = document.createElement("li");
        const poisonText = move.poison
            ? " The selected tile was poisoned."
            : "";

        item.textContent =
            String(index + 1) +
            ". " +
            move.player +
            " selected " +
            coordinateLabel(move.row, move.column) +
            " and removed " +
            move.count +
            " " +
            (move.count === 1 ? "tile." : "tiles.") +
            poisonText;

        moveHistoryElement.appendChild(item);
    });
}


function renderControls() {
    undoMoveButton.disabled = undoStack.length === 0;

    gridBoard.querySelectorAll(".grid-tile:not(.removed)").forEach(
        function (tile) {
            tile.disabled = gameOver;
        }
    );
}


function setBoardMessage(message, type) {
    boardMessage.textContent = message;
    boardMessage.className = "board-message";

    if (type) {
        boardMessage.classList.add(type);
    }
}


function countRemainingTiles() {
    return activeTiles.reduce(function (total, row) {
        return total + row.filter(Boolean).length;
    }, 0);
}


function coordinateLabel(row, column) {
    const columnLabel = String.fromCharCode(65 + column);
    const rowLabel = rows - row;

    return columnLabel + String(rowLabel);
}


function buildTileLabel(row, column, removed, poison) {
    const coordinate = coordinateLabel(row, column);

    if (removed) {
        return coordinate + ", removed tile";
    }

    if (poison) {
        return (
            coordinate +
            ", poisoned bottom-left tile. Selecting it loses the game."
        );
    }

    return coordinate + ", available tile";
}


function normalizePlayerName(value, fallback) {
    const trimmed = String(value || "").trim();
    return trimmed || fallback;
}


function clampDimensionInputs() {
    if (rowInput.value !== "") {
        rowInput.value = String(
            clampInteger(rowInput.value, MIN_ROWS, MAX_ROWS, 5)
        );
    }

    if (columnInput.value !== "") {
        columnInput.value = String(
            clampInteger(columnInput.value, MIN_COLUMNS, MAX_COLUMNS, 7)
        );
    }
}


function clampInteger(value, minimum, maximum, fallback) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(maximum, Math.max(minimum, parsed));
}


function otherPlayerIndex(index) {
    return index === 0 ? 1 : 0;
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
