"use strict";

const TARGET = new Fraction(24, 1);
const MIN_NUMBER = 1;
const MAX_NUMBER = 9;
const MAX_GENERATION_ATTEMPTS = 250;

const numberCards =
    document.getElementById("numberCards");

const newPuzzleButton =
    document.getElementById("newPuzzleButton");

const solutionButton =
    document.getElementById("solutionButton");

const solutionPanel =
    document.getElementById("solutionPanel");

const solutionExpression =
    document.getElementById("solutionExpression");

const gameAnnouncement =
    document.getElementById("gameAnnouncement");

const menuButton =
    document.getElementById("menuButton");

const mainNavigation =
    document.getElementById("mainNavigation");

let currentNumbers = [];
let currentSolution = "";

initializeGame();

function initializeGame() {
    newPuzzleButton.addEventListener(
        "click",
        generateNewPuzzle
    );

    solutionButton.addEventListener(
        "click",
        toggleSolution
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


/*
    Exact rational-number representation.

    JavaScript normally uses floating-point arithmetic. Fractions prevent
    expressions such as 8 / 3 from accumulating rounding error while the
    solver recursively combines values.
*/
function Fraction(numerator, denominator) {
    if (denominator === 0) {
        throw new Error(
            "A fraction cannot have a denominator of zero."
        );
    }

    if (
        !Number.isInteger(numerator) ||
        !Number.isInteger(denominator)
    ) {
        throw new TypeError(
            "Fraction values must be integers."
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


Fraction.prototype.add =
    function (other) {
        return new Fraction(
            this.numerator * other.denominator +
                other.numerator * this.denominator,
            this.denominator * other.denominator
        );
    };


Fraction.prototype.subtract =
    function (other) {
        return new Fraction(
            this.numerator * other.denominator -
                other.numerator * this.denominator,
            this.denominator * other.denominator
        );
    };


Fraction.prototype.multiply =
    function (other) {
        return new Fraction(
            this.numerator * other.numerator,
            this.denominator * other.denominator
        );
    };


Fraction.prototype.divide =
    function (other) {
        if (other.numerator === 0) {
            throw new Error(
                "Division by zero is not allowed."
            );
        }

        return new Fraction(
            this.numerator * other.denominator,
            this.denominator * other.numerator
        );
    };


Fraction.prototype.equals =
    function (other) {
        return (
            this.numerator === other.numerator &&
            this.denominator === other.denominator
        );
    };


Fraction.prototype.isZero =
    function () {
        return this.numerator === 0;
    };


Fraction.prototype.key =
    function () {
        return (
            String(this.numerator) +
            "/" +
            String(this.denominator)
        );
    };


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


/*
    Generates random numbers until a puzzle with at least one exact
    solution is found.
*/
function generateNewPuzzle() {
    let puzzle = null;

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

        const solution =
            findOneSolution(
                numbers.map(function (number) {
                    return {
                        value:
                            new Fraction(number, 1),
                        expression:
                            String(number)
                    };
                })
            );

        if (solution) {
            puzzle = {
                numbers: numbers,
                solution: solution
            };

            break;
        }
    }

    /*
        This fallback should almost never be needed, but it guarantees that
        the page always displays a valid puzzle.
    */
    if (!puzzle) {
        puzzle = {
            numbers: [3, 3, 8, 8],
            solution:
                "8 / (3 - 8 / 3)"
        };
    }

    currentNumbers =
        puzzle.numbers.slice();

    currentSolution =
        puzzle.solution;

    renderPuzzle();
    hideSolution();

    gameAnnouncement.textContent =
        "New puzzle: " +
        currentNumbers.join(", ") +
        ".";
}


/*
    Recursively tries every valid way to combine two current expressions.
    It returns the first expression that equals 24.
*/
function findOneSolution(items) {
    if (items.length === 1) {
        if (
            items[0].value.equals(TARGET)
        ) {
            return items[0].expression;
        }

        return null;
    }

    const visitedPairs =
        new Set();

    for (
        let firstIndex = 0;
        firstIndex < items.length;
        firstIndex += 1
    ) {
        for (
            let secondIndex = firstIndex + 1;
            secondIndex < items.length;
            secondIndex += 1
        ) {
            const left =
                items[firstIndex];

            const right =
                items[secondIndex];

            const pairKey = [
                left.value.key(),
                right.value.key(),
                left.expression,
                right.expression
            ]
                .sort()
                .join("|");

            if (visitedPairs.has(pairKey)) {
                continue;
            }

            visitedPairs.add(pairKey);

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
                combineTwoResults(
                    left,
                    right
                );

            for (
                const combined of combinedResults
            ) {
                const solution =
                    findOneSolution(
                        remainingItems.concat(
                            combined
                        )
                    );

                if (solution) {
                    return solution;
                }
            }
        }
    }

    return null;
}


/*
    Mirrors the operations supported by make_24.py:
    addition, multiplication, subtraction in both directions, and division
    in both directions.
*/
function combineTwoResults(left, right) {
    const results = [];
    const seen = new Set();

    const orderedExpressions = [
        left.expression,
        right.expression
    ].sort();

    addCombinedResult(
        results,
        seen,
        left.value.add(right.value),
        "(" +
            orderedExpressions[0] +
            " + " +
            orderedExpressions[1] +
            ")"
    );

    addCombinedResult(
        results,
        seen,
        left.value.multiply(right.value),
        "(" +
            orderedExpressions[0] +
            " * " +
            orderedExpressions[1] +
            ")"
    );

    addCombinedResult(
        results,
        seen,
        left.value.subtract(right.value),
        "(" +
            left.expression +
            " - " +
            right.expression +
            ")"
    );

    addCombinedResult(
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
        addCombinedResult(
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
        addCombinedResult(
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


function addCombinedResult(
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
        value: value,
        expression: expression
    });
}


function renderPuzzle() {
    numberCards.innerHTML = "";

    currentNumbers.forEach(
        function (number) {
            const card =
                document.createElement("div");

            card.className =
                "number-card";

            card.textContent =
                String(number);

            numberCards.appendChild(card);
        }
    );

    solutionExpression.textContent =
        formatExpression(currentSolution) +
        " = 24";
}


function toggleSolution() {
    if (solutionPanel.hidden) {
        showSolution();
    } else {
        hideSolution();
    }
}


function showSolution() {
    solutionPanel.hidden = false;

    solutionButton.textContent =
        "Hide Solution";

    solutionButton.setAttribute(
        "aria-expanded",
        "true"
    );

    gameAnnouncement.textContent =
        "The solution is now visible.";
}


function hideSolution() {
    solutionPanel.hidden = true;

    solutionButton.textContent =
        "View Solution";

    solutionButton.setAttribute(
        "aria-expanded",
        "false"
    );
}


function formatExpression(expression) {
    return expression
        .replaceAll("*", "×")
        .replaceAll("/", "÷")
        .replaceAll("-", "−");
}


function randomInteger(minimum, maximum) {
    return (
        Math.floor(
            Math.random() *
            (maximum - minimum + 1)
        ) +
        minimum
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
