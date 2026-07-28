"use strict";

const MIN_ROWS = 2;
const MAX_ROWS = 10;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 12;

const setupPanel =
    document.getElementById("setupPanel");

const gamePanel =
    document.getElementById("gamePanel");

const resultPanel =
    document.getElementById("resultPanel");

const rowInput =
    document.getElementById("rowInput");

const columnInput =
    document.getElementById("columnInput");

const playerOneInput =
    document.getElementById("playerOneInput");

const playerTwoInput =
    document.getElementById("playerTwoInput");

const startingPlayerSelect =
    document.getElementById("startingPlayerSelect");

const startGameButton =
    document.getElementById("startGameButton");

const gridBoard =
    document.getElementById("gridBoard");

const turnHeading =
    document.getElementById("turnHeading");

const dimensionBadge =
    document.getElementById("dimensionBadge");

const remainingBadge =
    document.getElementById("remainingBadge");

const boardMessage =
    document.getElementById("boardMessage");

const undoMoveButton =
    document.getElementById("undoMoveButton");

const resetGameButton =
    document.getElementById("resetGameButton");

const changeSetupButton =
    document.getElementById("changeSetupButton");

const moveCountBadge =
    document.getElementById("moveCountBadge");

const moveHistoryElement =
    document.getElementById("moveHistory");

const resultHeading =
    document.getElementById("resultHeading");

const resultExplanation =
    document.getElementById("resultExplanation");

const playAgainButton =
    document.getElementById("playAgainButton");

const resultSetupButton =
    document.getElementById("resultSetupButton");

const gameAnnouncement =
    document.getElementById("gameAnnouncement");

const menuButton =
    document.getElementById("menuButton");

const mainNavigation =
    document.getElementById("mainNavigation");

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

initializePage();


function initializePage() {
    startGameButton.addEventListener(
        "click",
        startConfiguredGame
    );

    undoMoveButton.addEventListener(
        "click",
        undoLastMove
    );

    resetGameButton.addEventListener(
        "click",
        resetCurrentBoard
    );

    changeSetupButton.addEventListener(
        "click",
        showSetup
    );

    playAgainButton.addEventListener(
        "click",
        resetCurrentBoard
    );

    resultSetupButton.addEventListener(
        "click",
        showSetup
    );

    gridBoard.addEventListener(
        "mouseleave",
        clearPreview
    );

    rowInput.addEventListener(
        "input",
        clampDimensionInputs
    );

    columnInput.addEventListener(
        "input",
        clampDimensionInputs
    );

    if (menuButton && mainNavigation) {
        menuButton.addEventListener(
            "click",
            toggleNavigation
        );

        mainNavigation
            .querySelectorAll("a")
            .forEach(function (link) {
                link.addEventListener(
                    "click",
                    closeNavigation
                );
            });
    }

    startConfiguredGame();
}


function startConfiguredGame() {
    rows =
        clampInteger(
            rowInput.value,
            MIN_ROWS,
            MAX_ROWS,
            5
        );

    columns =
        clampInteger(
            columnInput.value,
            MIN_COLUMNS,
            MAX_COLUMNS,
            7
        );

    rowInput.value =
        String(rows);

    columnInput.value =
        String(columns);

    players = [
        normalizePlayerName(
            playerOneInput.value,
            "Player 1"
        ),
        normalizePlayerName(
            playerTwoInput.value,
            "Player 2"
        )
    ];

    playerOneInput.value =
        players[0];

    playerTwoInput.value =
        players[1];

    startingPlayerIndex =
        startingPlayerSelect.value === "1"
            ? 1
            : 0;

    resetGameState();

    setupPanel.hidden = true;
    gamePanel.hidden = false;
    resultPanel.hidden = true;

    renderAll();

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

    gameAnnouncement.textContent =
        "The board was reset. " +
        players[currentPlayerIndex] +
        " begins.";
}


function resetGameState() {
    activeTiles =
        Array.from(
            { length: rows },
            function () {
                return Array(
                    columns
                ).fill(true);
            }
        );

    currentPlayerIndex =
        startingPlayerIndex;

    moveHistory = [];
    undoStack = [];
    gameOver = false;
    previewCoordinate = null;
}


function showSetup() {
    setupPanel.hidden = false;
    gamePanel.hidden = true;
    resultPanel.hidden = true;

    window.scrollTo({
        top:
            setupPanel.getBoundingClientRect().top +
            window.scrollY -
            96,
        behavior:
            "smooth"
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

    gridBoard.style.setProperty(
        "--grid-columns",
        String(columns)
    );

    for (
        let row = 0;
        row < rows;
        row += 1
    ) {
        for (
            let column = 0;
            column < columns;
            column += 1
        ) {
            const tile =
                document.createElement("button");

            tile.type = "button";
            tile.className = "grid-tile";
            tile.dataset.row = String(row);
            tile.dataset.column = String(column);
            tile.setAttribute(
                "role",
                "gridcell"
            );

            const isActive =
                activeTiles[row][column];

            const isPoison =
                isPoisonCoordinate(
                    row,
                    column
                );

            if (!isActive) {
                tile.classList.add(
                    "removed"
                );

                tile.disabled = true;
                tile.setAttribute(
                    "aria-label",
                    buildTileLabel(
                        row,
                        column,
                        true,
                        isPoison
                    )
                );

                gridBoard.appendChild(tile);
                continue;
            }

            if (isPoison) {
                tile.classList.add(
                    "poison"
                );

                tile.textContent =
                    "POISON";
            } else {
                tile.textContent =
                    coordinateLabel(
                        row,
                        column
                    );
            }

            if (
                previewCoordinate &&
                isTileRemovedByMove(
                    row,
                    column,
                    previewCoordinate.row,
                    previewCoordinate.column
                )
            ) {
                tile.classList.add(
                    "preview"
                );
            }

            tile.setAttribute(
                "aria-label",
                buildTileLabel(
                    row,
                    column,
                    false,
                    isPoison
                )
            );

            tile.addEventListener(
                "mouseenter",
                function () {
                    previewMove(
                        row,
                        column
                    );
                }
            );

            tile.addEventListener(
                "focus",
                function () {
                    previewMove(
                        row,
                        column
                    );
                }
            );

            tile.addEventListener(
                "click",
                function () {
                    commitMove(
                        row,
                        column
                    );
                }
            );

            gridBoard.appendChild(tile);
        }
    }
}


function previewMove(row, column) {
    if (
        gameOver ||
        !activeTiles[row][column]
    ) {
        return;
    }

    previewCoordinate = {
        row:
            row,
        column:
            column
    };

    const removalCount =
        getTilesRemovedByMove(
            row,
            column
        ).length;

    const isPoison =
        isPoisonCoordinate(
            row,
            column
        );

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
            (
                removalCount === 1
                    ? "tile"
                    : "tiles"
            ) +
            ". Click to confirm.",
            ""
        );
    }

    renderBoard();
}


function clearPreview() {
    if (!previewCoordinate) {
        return;
    }

    previewCoordinate = null;

    if (!gameOver) {
        setBoardMessage(
            "Hover over a tile to preview the move, then click to remove it.",
            ""
        );
    }

    renderBoard();
}


function commitMove(row, column) {
    if (
        gameOver ||
        !activeTiles[row][column]
    ) {
        return;
    }

    undoStack.push(
        createSnapshot()
    );

    const actingPlayerIndex =
        currentPlayerIndex;

    const actingPlayer =
        players[actingPlayerIndex];

    const removedCoordinates =
        getTilesRemovedByMove(
            row,
            column
        );

    removedCoordinates.forEach(
        function (coordinate) {
            activeTiles[
                coordinate.row
            ][
                coordinate.column
            ] = false;
        }
    );

    const poisonTaken =
        isPoisonCoordinate(
            row,
            column
        );

    moveHistory.push({
        player:
            actingPlayer,
        row:
            row,
        column:
            column,
        count:
            removedCoordinates.length,
        poison:
            poisonTaken
    });

    previewCoordinate = null;

    if (poisonTaken) {
        finishGame(
            actingPlayerIndex
        );

        return;
    }

    currentPlayerIndex =
        otherPlayerIndex(
            currentPlayerIndex
        );

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
        (
            removedCoordinates.length === 1
                ? "tile"
                : "tiles"
        ) +
        ". It is now " +
        players[currentPlayerIndex] +
        "'s turn.";
}


function finishGame(losingPlayerIndex) {
    gameOver = true;

    const winningPlayerIndex =
        otherPlayerIndex(
            losingPlayerIndex
        );

    gamePanel.hidden = false;
    resultPanel.hidden = false;

    resultHeading.textContent =
        players[winningPlayerIndex] +
        " wins!";

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
        behavior:
            "smooth",
        block:
            "center"
    });

    gameAnnouncement.textContent =
        players[winningPlayerIndex] +
        " wins because " +
        players[losingPlayerIndex] +
        " took the poison tile.";
}


function undoLastMove() {
    const snapshot =
        undoStack.pop();

    if (!snapshot) {
        return;
    }

    activeTiles =
        snapshot.activeTiles.map(
            function (row) {
                return row.slice();
            }
        );

    currentPlayerIndex =
        snapshot.currentPlayerIndex;

    moveHistory =
        snapshot.moveHistory.map(
            function (move) {
                return {
                    ...move
                };
            }
        );

    gameOver =
        snapshot.gameOver;

    previewCoordinate = null;

    resultPanel.hidden = true;

    renderAll();

    setBoardMessage(
        "The previous move was undone. " +
        players[currentPlayerIndex] +
        "'s turn.",
        ""
    );

    gameAnnouncement.textContent =
        "The previous move was undone.";
}


function createSnapshot() {
    return {
        activeTiles:
            activeTiles.map(
                function (row) {
                    return row.slice();
                }
            ),
        currentPlayerIndex:
            currentPlayerIndex,
        moveHistory:
            moveHistory.map(
                function (move) {
                    return {
                        ...move
                    };
                }
            ),
        gameOver:
            gameOver
    };
}


function getTilesRemovedByMove(
    selectedRow,
    selectedColumn
) {
    const removed = [];

    for (
        let row = 0;
        row < rows;
        row += 1
    ) {
        for (
            let column = 0;
            column < columns;
            column += 1
        ) {
            if (
                activeTiles[row][column] &&
                isTileRemovedByMove(
                    row,
                    column,
                    selectedRow,
                    selectedColumn
                )
            ) {
                removed.push({
                    row:
                        row,
                    column:
                        column
                });
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
    return (
        tileRow <= selectedRow &&
        tileColumn >= selectedColumn
    );
}


function isPoisonCoordinate(
    row,
    column
) {
    return (
        row === rows - 1 &&
        column === 0
    );
}


function renderStatus() {
    turnHeading.textContent =
        gameOver
            ? "Game over"
            : players[currentPlayerIndex];

    dimensionBadge.textContent =
        rows +
        " × " +
        columns +
        " grid";

    const remaining =
        countRemainingTiles();

    remainingBadge.textContent =
        remaining +
        " " +
        (
            remaining === 1
                ? "tile remaining"
                : "tiles remaining"
        );
}


function renderHistory() {
    moveCountBadge.textContent =
        moveHistory.length +
        " " +
        (
            moveHistory.length === 1
                ? "move"
                : "moves"
        );

    moveHistoryElement.innerHTML = "";

    if (moveHistory.length === 0) {
        const empty =
            document.createElement("li");

        empty.className =
            "empty-history";

        empty.textContent =
            "Moves will appear here.";

        moveHistoryElement.appendChild(
            empty
        );

        return;
    }

    moveHistory.forEach(
        function (move, index) {
            const item =
                document.createElement("li");

            const poisonText =
                move.poison
                    ? " The selected tile was poisoned."
                    : "";

            item.textContent =
                String(index + 1) +
                ". " +
                move.player +
                " selected " +
                coordinateLabel(
                    move.row,
                    move.column
                ) +
                " and removed " +
                move.count +
                " " +
                (
                    move.count === 1
                        ? "tile."
                        : "tiles."
                ) +
                poisonText;

            moveHistoryElement.appendChild(
                item
            );
        }
    );
}


function renderControls() {
    undoMoveButton.disabled =
        undoStack.length === 0;

    Array.from(
        gridBoard.querySelectorAll(
            ".grid-tile:not(.removed)"
        )
    ).forEach(
        function (tile) {
            tile.disabled =
                gameOver;
        }
    );
}


function setBoardMessage(
    message,
    type
) {
    boardMessage.textContent =
        message;

    boardMessage.className =
        "board-message";

    if (type) {
        boardMessage.classList.add(
            type
        );
    }
}


function countRemainingTiles() {
    return activeTiles.reduce(
        function (total, row) {
            return (
                total +
                row.filter(Boolean).length
            );
        },
        0
    );
}


function coordinateLabel(row, column) {
    const columnLabel =
        String.fromCharCode(
            65 + column
        );

    const rowLabel =
        rows - row;

    return (
        columnLabel +
        String(rowLabel)
    );
}


function buildTileLabel(
    row,
    column,
    removed,
    poison
) {
    const coordinate =
        coordinateLabel(
            row,
            column
        );

    if (removed) {
        return (
            coordinate +
            ", removed tile"
        );
    }

    if (poison) {
        return (
            coordinate +
            ", poisoned bottom-left tile. Selecting it loses the game."
        );
    }

    return (
        coordinate +
        ", available tile"
    );
}


function normalizePlayerName(
    value,
    fallback
) {
    const trimmed =
        String(value || "")
            .trim();

    return trimmed || fallback;
}


function clampDimensionInputs() {
    if (rowInput.value !== "") {
        rowInput.value =
            String(
                clampInteger(
                    rowInput.value,
                    MIN_ROWS,
                    MAX_ROWS,
                    5
                )
            );
    }

    if (columnInput.value !== "") {
        columnInput.value =
            String(
                clampInteger(
                    columnInput.value,
                    MIN_COLUMNS,
                    MAX_COLUMNS,
                    7
                )
            );
    }
}


function clampInteger(
    value,
    minimum,
    maximum,
    fallback
) {
    const parsed =
        Number.parseInt(
            value,
            10
        );

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(
        maximum,
        Math.max(
            minimum,
            parsed
        )
    );
}


function otherPlayerIndex(index) {
    return index === 0 ? 1 : 0;
}


function toggleNavigation() {
    const isOpen =
        mainNavigation.classList.toggle(
            "open"
        );

    menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    menuButton.setAttribute(
        "aria-label",
        isOpen
            ? "Close navigation menu"
            : "Open navigation menu"
    );
}


function closeNavigation() {
    mainNavigation.classList.remove(
        "open"
    );

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    menuButton.setAttribute(
        "aria-label",
        "Open navigation menu"
    );
}
