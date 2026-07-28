"use strict";


class Fraction {
    constructor(numerator, denominator = 1) {
        if (
            !Number.isInteger(numerator) ||
            !Number.isInteger(denominator)
        ) {
            throw new TypeError(
                "Fraction values must be integers."
            );
        }

        if (denominator === 0) {
            throw new Error(
                "A fraction cannot have a denominator of zero."
            );
        }

        const sign =
            denominator < 0 ? -1 : 1;

        const divisor =
            greatestCommonDivisor(
                Math.abs(numerator),
                Math.abs(denominator)
            );

        this.numerator =
            sign * numerator / divisor;

        this.denominator =
            Math.abs(denominator) / divisor;
    }

    add(other) {
        return new Fraction(
            this.numerator * other.denominator +
                other.numerator * this.denominator,
            this.denominator * other.denominator
        );
    }

    subtract(other) {
        return new Fraction(
            this.numerator * other.denominator -
                other.numerator * this.denominator,
            this.denominator * other.denominator
        );
    }

    multiply(other) {
        return new Fraction(
            this.numerator * other.numerator,
            this.denominator * other.denominator
        );
    }

    divide(other) {
        if (other.isZero()) {
            throw new Error(
                "Division by zero is not allowed."
            );
        }

        return new Fraction(
            this.numerator * other.denominator,
            this.denominator * other.numerator
        );
    }

    equals(other) {
        return (
            this.numerator === other.numerator &&
            this.denominator === other.denominator
        );
    }

    isZero() {
        return this.numerator === 0;
    }

    key() {
        return (
            String(this.numerator) +
            "/" +
            String(this.denominator)
        );
    }

    toDisplayString() {
        if (this.denominator === 1) {
            return String(this.numerator);
        }

        return (
            String(this.numerator) +
            "/" +
            String(this.denominator)
        );
    }

    clone() {
        return new Fraction(
            this.numerator,
            this.denominator
        );
    }
}


const TARGET = new Fraction(24);
const MIN_NUMBER = 1;
const MAX_NUMBER = 9;
const MIN_SOLUTIONS = 2;
const MAX_SOLUTIONS = 70;
const MAX_GENERATION_ATTEMPTS = 500;

const tileWorkspace =
    document.getElementById("tileWorkspace");

const operatorButtons =
    Array.from(
        document.querySelectorAll(
            ".operator-button"
        )
    );

const selectionPreview =
    document.getElementById("selectionPreview");

const gameFeedback =
    document.getElementById("gameFeedback");

const undoButton =
    document.getElementById("undoButton");

const resetButton =
    document.getElementById("resetButton");

const newPuzzleButton =
    document.getElementById("newPuzzleButton");

const remainingTileCount =
    document.getElementById("remainingTileCount");

const moveHistory =
    document.getElementById("moveHistory");

const solutionsButton =
    document.getElementById("solutionsButton");

const solutionsPanel =
    document.getElementById("solutionsPanel");

const solutionsList =
    document.getElementById("solutionsList");

const solutionCountBadge =
    document.getElementById("solutionCountBadge");

const solutionsPanelCount =
    document.getElementById("solutionsPanelCount");

const gameAnnouncement =
    document.getElementById("gameAnnouncement");

const menuButton =
    document.getElementById("menuButton");

const mainNavigation =
    document.getElementById("mainNavigation");

let originalNumbers = [];
let puzzleSolutions = [];
let terms = [];
let operationHistory = [];
let undoStack = [];
let selectedTermId = null;
let selectedOperator = null;
let nextTermId = 1;
let newestTermId = null;

initializeGame();


function initializeGame() {
    operatorButtons.forEach(
        function (button) {
            button.addEventListener(
                "click",
                handleOperatorSelection
            );
        }
    );

    undoButton.addEventListener(
        "click",
        undoLastMove
    );

    resetButton.addEventListener(
        "click",
        resetPuzzle
    );

    newPuzzleButton.addEventListener(
        "click",
        generateNewPuzzle
    );

    solutionsButton.addEventListener(
        "click",
        toggleSolutions
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

    generateNewPuzzle();
}


function generateNewPuzzle() {
    newPuzzleButton.disabled = true;
    newPuzzleButton.textContent =
        "Generating…";

    let selectedPuzzle = null;

    for (
        let attempt = 0;
        attempt < MAX_GENERATION_ATTEMPTS;
        attempt += 1
    ) {
        const numbers = [
            randomInteger(MIN_NUMBER, MAX_NUMBER),
            randomInteger(MIN_NUMBER, MAX_NUMBER),
            randomInteger(MIN_NUMBER, MAX_NUMBER),
            randomInteger(MIN_NUMBER, MAX_NUMBER)
        ];

        const solutions =
            findAllSolutions(numbers);

        const isSamePuzzle =
            arraysMatch(
                numbers.slice().sort(compareNumbers),
                originalNumbers.slice().sort(compareNumbers)
            );

        if (
            !isSamePuzzle &&
            solutions.length >= MIN_SOLUTIONS &&
            solutions.length <= MAX_SOLUTIONS
        ) {
            selectedPuzzle = {
                numbers: numbers,
                solutions: solutions
            };

            break;
        }
    }

    if (!selectedPuzzle) {
        const fallbackNumbers =
            [1, 3, 4, 6];

        selectedPuzzle = {
            numbers:
                fallbackNumbers,
            solutions:
                findAllSolutions(
                    fallbackNumbers
                )
        };
    }

    originalNumbers =
        selectedPuzzle.numbers.slice();

    puzzleSolutions =
        selectedPuzzle.solutions.slice();

    startPuzzle();

    newPuzzleButton.disabled = false;
    newPuzzleButton.textContent =
        "New Puzzle";

    gameAnnouncement.textContent =
        "New solvable puzzle: " +
        originalNumbers.join(", ") +
        ".";
}


function startPuzzle() {
    nextTermId = 1;

    terms =
        originalNumbers.map(
            function (number) {
                return {
                    id:
                        nextTermId++,
                    value:
                        new Fraction(number),
                    expression:
                        String(number),
                    isComposite:
                        false
                };
            }
        );

    operationHistory = [];
    undoStack = [];
    selectedTermId = null;
    selectedOperator = null;
    newestTermId = null;

    hideSolutions();
    renderAll();
}


function resetPuzzle() {
    startPuzzle();

    gameAnnouncement.textContent =
        "The puzzle was reset to its original four numbers.";
}


function handleTileSelection(termId) {
    if (terms.length <= 1) {
        return;
    }

    if (selectedTermId === null) {
        selectedTermId = termId;
        selectedOperator = null;

        renderAll();
        return;
    }

    if (
        selectedTermId === termId
    ) {
        selectedTermId = null;
        selectedOperator = null;

        renderAll();
        return;
    }

    if (!selectedOperator) {
        selectedTermId = termId;

        renderAll();
        return;
    }

    combineSelectedTerms(
        selectedTermId,
        termId,
        selectedOperator
    );
}


function handleOperatorSelection(event) {
    if (selectedTermId === null) {
        return;
    }

    selectedOperator =
        event.currentTarget.dataset.operator;

    renderAll();
}


function combineSelectedTerms(
    leftId,
    rightId,
    operator
) {
    const leftTerm =
        terms.find(
            function (term) {
                return term.id === leftId;
            }
        );

    const rightTerm =
        terms.find(
            function (term) {
                return term.id === rightId;
            }
        );

    if (!leftTerm || !rightTerm) {
        return;
    }

    if (
        operator === "/" &&
        rightTerm.value.isZero()
    ) {
        setFeedback(
            "Division by zero is not allowed. Choose a different right tile.",
            "error"
        );

        return;
    }

    undoStack.push(
        createStateSnapshot()
    );

    const resultValue =
        applyOperation(
            leftTerm.value,
            rightTerm.value,
            operator
        );

    const resultExpression =
        "(" +
        leftTerm.expression +
        " " +
        operator +
        " " +
        rightTerm.expression +
        ")";

    const resultTerm = {
        id:
            nextTermId++,
        value:
            resultValue,
        expression:
            resultExpression,
        isComposite:
            true
    };

    terms =
        terms
            .filter(
                function (term) {
                    return (
                        term.id !== leftId &&
                        term.id !== rightId
                    );
                }
            )
            .concat(resultTerm);

    operationHistory.push({
        left:
            leftTerm.value.toDisplayString(),
        right:
            rightTerm.value.toDisplayString(),
        operator:
            operator,
        result:
            resultValue.toDisplayString(),
        expression:
            resultExpression
    });

    newestTermId =
        resultTerm.id;

    selectedTermId = null;
    selectedOperator = null;

    renderAll();

    window.setTimeout(
        function () {
            newestTermId = null;
        },
        450
    );
}


function undoLastMove() {
    const snapshot =
        undoStack.pop();

    if (!snapshot) {
        return;
    }

    restoreStateSnapshot(snapshot);

    selectedTermId = null;
    selectedOperator = null;
    newestTermId = null;

    renderAll();

    gameAnnouncement.textContent =
        "The previous move was undone.";
}


function createStateSnapshot() {
    return {
        terms:
            terms.map(cloneTerm),
        operationHistory:
            operationHistory.map(
                function (move) {
                    return {
                        ...move
                    };
                }
            ),
        nextTermId:
            nextTermId
    };
}


function restoreStateSnapshot(snapshot) {
    terms =
        snapshot.terms.map(cloneTerm);

    operationHistory =
        snapshot.operationHistory.map(
            function (move) {
                return {
                    ...move
                };
            }
        );

    nextTermId =
        snapshot.nextTermId;
}


function cloneTerm(term) {
    return {
        id:
            term.id,
        value:
            term.value.clone(),
        expression:
            term.expression,
        isComposite:
            term.isComposite
    };
}


function applyOperation(
    leftValue,
    rightValue,
    operator
) {
    switch (operator) {
        case "+":
            return leftValue.add(
                rightValue
            );

        case "-":
            return leftValue.subtract(
                rightValue
            );

        case "*":
            return leftValue.multiply(
                rightValue
            );

        case "/":
            return leftValue.divide(
                rightValue
            );

        default:
            throw new Error(
                "Unsupported operator."
            );
    }
}


function renderAll() {
    renderTiles();
    renderOperators();
    renderSelectionPreview();
    renderHistory();
    renderSolutions();
    renderGameStatus();
}


function renderTiles() {
    tileWorkspace.innerHTML = "";

    terms.forEach(
        function (term) {
            const tile =
                document.createElement("button");

            tile.type = "button";
            tile.className =
                "value-tile";

            tile.dataset.termId =
                String(term.id);

            tile.setAttribute(
                "aria-label",
                buildTileAriaLabel(term)
            );

            if (
                term.id === selectedTermId
            ) {
                tile.classList.add(
                    "selected"
                );
            }

            if (
                selectedTermId !== null &&
                selectedOperator &&
                term.id !== selectedTermId
            ) {
                tile.classList.add(
                    "selectable-second"
                );
            }

            if (
                term.id === newestTermId
            ) {
                tile.classList.add(
                    "result-tile"
                );
            }

            if (terms.length === 1) {
                tile.classList.add(
                    "unavailable"
                );
            }

            const orderLabel =
                document.createElement("span");

            orderLabel.className =
                "tile-order-label";

            if (
                term.id === selectedTermId
            ) {
                orderLabel.textContent =
                    "Left value";
            } else if (
                selectedTermId !== null &&
                selectedOperator
            ) {
                orderLabel.textContent =
                    "Use as right";
            } else {
                orderLabel.textContent =
                    "Select";
            }

            const value =
                document.createElement("span");

            value.className =
                "tile-value";

            value.textContent =
                term.value.toDisplayString();

            const expression =
                document.createElement("span");

            expression.className =
                "tile-expression";

            expression.textContent =
                term.isComposite
                    ? formatExpression(
                        term.expression
                    )
                    : "Original number";

            tile.append(
                orderLabel,
                value,
                expression
            );

            tile.addEventListener(
                "click",
                function () {
                    handleTileSelection(
                        term.id
                    );
                }
            );

            tileWorkspace.appendChild(
                tile
            );
        }
    );
}


function renderOperators() {
    const shouldEnable =
        selectedTermId !== null &&
        terms.length > 1;

    operatorButtons.forEach(
        function (button) {
            button.disabled =
                !shouldEnable;

            button.classList.toggle(
                "active",
                button.dataset.operator ===
                    selectedOperator
            );

            button.setAttribute(
                "aria-pressed",
                String(
                    button.dataset.operator ===
                    selectedOperator
                )
            );
        }
    );
}


function renderSelectionPreview() {
    if (terms.length === 1) {
        selectionPreview.textContent =
            "Puzzle complete. Use Undo, Reset Puzzle, or New Puzzle to continue.";

        return;
    }

    if (selectedTermId === null) {
        selectionPreview.textContent =
            "Select the first tile.";

        return;
    }

    const selectedTerm =
        terms.find(
            function (term) {
                return term.id === selectedTermId;
            }
        );

    const leftDisplay =
        selectedTerm.value.toDisplayString();

    if (!selectedOperator) {
        selectionPreview.textContent =
            leftDisplay +
            " selected as the left value. Now choose an operator.";

        return;
    }

    selectionPreview.textContent =
        leftDisplay +
        " " +
        formatOperator(selectedOperator) +
        " ___ — select the right tile.";
}


function renderHistory() {
    remainingTileCount.textContent =
        terms.length +
        " " +
        (
            terms.length === 1
                ? "tile remaining"
                : "tiles remaining"
        );

    moveHistory.innerHTML = "";

    if (
        operationHistory.length === 0
    ) {
        const empty =
            document.createElement("li");

        empty.className =
            "empty-history";

        empty.textContent =
            "Your operations will appear here.";

        moveHistory.appendChild(empty);

        return;
    }

    operationHistory.forEach(
        function (move) {
            const item =
                document.createElement("li");

            item.textContent =
                move.left +
                " " +
                formatOperator(
                    move.operator
                ) +
                " " +
                move.right +
                " = " +
                move.result;

            moveHistory.appendChild(item);
        }
    );
}


function renderGameStatus() {
    undoButton.disabled =
        undoStack.length === 0;

    gameFeedback.className =
        "game-feedback";

    if (terms.length > 1) {
        setFeedback(
            "Combine the remaining " +
            terms.length +
            " tiles until only one value remains.",
            ""
        );

        return;
    }

    const finalTerm =
        terms[0];

    if (
        finalTerm.value.equals(TARGET)
    ) {
        setFeedback(
            "Success! Your final value is exactly 24.",
            "success"
        );

        gameAnnouncement.textContent =
            "Success. You made exactly 24.";
    } else {
        setFeedback(
            "Your final value is " +
            finalTerm.value.toDisplayString() +
            ", not 24. Undo a move or reset the puzzle and try again.",
            "error"
        );

        gameAnnouncement.textContent =
            "The final value is not 24.";
    }
}


function setFeedback(message, type) {
    gameFeedback.textContent =
        message;

    gameFeedback.className =
        "game-feedback";

    if (type) {
        gameFeedback.classList.add(
            type
        );
    }
}


function toggleSolutions() {
    if (solutionsPanel.hidden) {
        showSolutions();
    } else {
        hideSolutions();
    }
}


function showSolutions() {
    solutionsPanel.hidden = false;

    solutionsButton.textContent =
        "Hide All Solutions";

    solutionsButton.setAttribute(
        "aria-expanded",
        "true"
    );

    gameAnnouncement.textContent =
        "All solutions are now visible.";
}


function hideSolutions() {
    solutionsPanel.hidden = true;

    solutionsButton.textContent =
        "View All Solutions";

    solutionsButton.setAttribute(
        "aria-expanded",
        "false"
    );
}


function renderSolutions() {
    const count =
        puzzleSolutions.length;

    solutionCountBadge.textContent =
        count +
        " unique " +
        (
            count === 1
                ? "solution"
                : "solutions"
        );

    solutionsPanelCount.textContent =
        count +
        " total";

    solutionsList.innerHTML = "";

    puzzleSolutions.forEach(
        function (solution) {
            const item =
                document.createElement("li");

            item.textContent =
                formatExpression(solution) +
                " = 24";

            solutionsList.appendChild(item);
        }
    );
}


function findAllSolutions(numbers) {
    const startingItems =
        numbers.map(
            function (number) {
                return {
                    value:
                        new Fraction(number),
                    expression:
                        String(number)
                };
            }
        );

    const solutions =
        new Set();

    findSolutionsRecursively(
        startingItems,
        solutions
    );

    return Array
        .from(solutions)
        .sort();
}


function findSolutionsRecursively(
    items,
    solutions
) {
    if (items.length === 1) {
        if (
            items[0].value.equals(TARGET)
        ) {
            solutions.add(
                items[0].expression
            );
        }

        return;
    }

    for (
        let firstIndex = 0;
        firstIndex < items.length;
        firstIndex += 1
    ) {
        for (
            let secondIndex =
                firstIndex + 1;
            secondIndex < items.length;
            secondIndex += 1
        ) {
            const left =
                items[firstIndex];

            const right =
                items[secondIndex];

            const remainingItems =
                items.filter(
                    function (_, index) {
                        return (
                            index !== firstIndex &&
                            index !== secondIndex
                        );
                    }
                );

            const combinedResults =
                combineTwoSolverResults(
                    left,
                    right
                );

            combinedResults.forEach(
                function (combined) {
                    findSolutionsRecursively(
                        remainingItems.concat(
                            combined
                        ),
                        solutions
                    );
                }
            );
        }
    }
}


function combineTwoSolverResults(
    left,
    right
) {
    const results = [];
    const seen = new Set();

    const orderedExpressions = [
        left.expression,
        right.expression
    ].sort();

    addSolverResult(
        results,
        seen,
        left.value.add(right.value),
        "(" +
            orderedExpressions[0] +
            " + " +
            orderedExpressions[1] +
            ")"
    );

    addSolverResult(
        results,
        seen,
        left.value.multiply(right.value),
        "(" +
            orderedExpressions[0] +
            " * " +
            orderedExpressions[1] +
            ")"
    );

    addSolverResult(
        results,
        seen,
        left.value.subtract(right.value),
        "(" +
            left.expression +
            " - " +
            right.expression +
            ")"
    );

    addSolverResult(
        results,
        seen,
        right.value.subtract(left.value),
        "(" +
            right.expression +
            " - " +
            left.expression +
            ")"
    );

    if (!right.value.isZero()) {
        addSolverResult(
            results,
            seen,
            left.value.divide(right.value),
            "(" +
                left.expression +
                " / " +
                right.expression +
                ")"
        );
    }

    if (!left.value.isZero()) {
        addSolverResult(
            results,
            seen,
            right.value.divide(left.value),
            "(" +
                right.expression +
                " / " +
                left.expression +
                ")"
        );
    }

    return results;
}


function addSolverResult(
    results,
    seen,
    value,
    expression
) {
    const key =
        value.key() +
        "|" +
        expression;

    if (seen.has(key)) {
        return;
    }

    seen.add(key);

    results.push({
        value:
            value,
        expression:
            expression
    });
}


function formatExpression(expression) {
    return expression
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−");
}


function formatOperator(operator) {
    switch (operator) {
        case "*":
            return "×";

        case "/":
            return "÷";

        case "-":
            return "−";

        default:
            return operator;
    }
}


function buildTileAriaLabel(term) {
    const expressionDescription =
        term.isComposite
            ? (
                ". Expression: " +
                formatExpression(
                    term.expression
                )
            )
            : "";

    return (
        "Value " +
        term.value.toDisplayString() +
        expressionDescription
    );
}


function greatestCommonDivisor(a, b) {
    let left = a;
    let right = b;

    while (right !== 0) {
        const remainder =
            left % right;

        left = right;
        right = remainder;
    }

    return left || 1;
}


function randomInteger(minimum, maximum) {
    return (
        Math.floor(
            Math.random() *
            (
                maximum -
                minimum +
                1
            )
        ) +
        minimum
    );
}


function compareNumbers(a, b) {
    return a - b;
}


function arraysMatch(first, second) {
    if (
        first.length !== second.length
    ) {
        return false;
    }

    return first.every(
        function (value, index) {
            return value === second[index];
        }
    );
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
