from fractions import Fraction


OPERATORS = ['+', '-', '*', '/']
TARGET = Fraction(24)


def to_fraction(number):
    """Convert integers, floats, strings, and Fractions to exact fractions."""
    if isinstance(number, Fraction):
        return number

    if isinstance(number, float):
        # Recover ordinary fractions such as 0.428571... as 3/7.
        return Fraction(number).limit_denominator()

    return Fraction(number)


def format_number(number):
    """Format a Fraction cleanly for use inside an expression."""
    number = to_fraction(number)

    if number.denominator == 1:
        return str(number.numerator)

    return str(number)


def combine_two_results(left_value, left_expression,
                        right_value, right_expression):
    """Return every valid way to combine two existing expressions."""
    results = []

    # Addition and multiplication are commutative, so alphabetically order
    # their expressions to avoid printing simple mirror duplicates.
    first_expression, second_expression = sorted(
        [left_expression, right_expression]
    )

    results.append(
        (
            left_value + right_value,
            f"({first_expression} + {second_expression})"
        )
    )

    results.append(
        (
            left_value * right_value,
            f"({first_expression} * {second_expression})"
        )
    )

    # Subtraction must be checked in both directions.
    results.append(
        (
            left_value - right_value,
            f"({left_expression} - {right_expression})"
        )
    )

    results.append(
        (
            right_value - left_value,
            f"({right_expression} - {left_expression})"
        )
    )

    # Division must also be checked in both directions.
    if right_value != 0:
        results.append(
            (
                left_value / right_value,
                f"({left_expression} / {right_expression})"
            )
        )

    if left_value != 0:
        results.append(
            (
                right_value / left_value,
                f"({right_expression} / {left_expression})"
            )
        )

    # Remove any duplicate result-expression pairs generated when the two
    # expressions happen to be identical.
    return list(set(results))


def find_all_solutions(items, target, solutions):
    """
    Recursively combine every possible pair of expressions.

    This covers all expression arrangements, including:
        1. ((a op b) op c) op d
        2. (a op (b op c)) op d
        3. (a op b) op (c op d)
        4. a op ((b op c) op d)
        5. a op (b op (c op d))
    """
    if len(items) == 1:
        final_value, final_expression = items[0]

        if final_value == target:
            solutions.add(f"{final_expression} = {format_number(target)}")

        return

    for first_index in range(len(items)):
        for second_index in range(first_index + 1, len(items)):
            left_value, left_expression = items[first_index]
            right_value, right_expression = items[second_index]

            remaining_items = [
                items[index]
                for index in range(len(items))
                if index != first_index and index != second_index
            ]

            combined_results = combine_two_results(
                left_value,
                left_expression,
                right_value,
                right_expression
            )

            for combined_value, combined_expression in combined_results:
                find_all_solutions(
                    remaining_items
                    + [(combined_value, combined_expression)],
                    target,
                    solutions
                )


def make_24(number_1, number_2, number_3, number_4):
    """
    Print every unique expression that makes 24 using all four numbers.

    Each supplied number is used exactly once. Exact Fraction arithmetic is
    used so values such as 3/7 can be compared without floating-point error.

    Returns:
        A sorted list containing every solution string.
    """
    numbers = [
        to_fraction(number_1),
        to_fraction(number_2),
        to_fraction(number_3),
        to_fraction(number_4)
    ]

    starting_items = [
        (number, format_number(number))
        for number in numbers
    ]

    solutions = set()

    find_all_solutions(
        starting_items,
        TARGET,
        solutions
    )

    sorted_solutions = sorted(solutions)

    if sorted_solutions:
        print(
            f"Found {len(sorted_solutions)} possible "
            f"solution(s):"
        )

        for solution_number, solution in enumerate(
            sorted_solutions,
            start=1
        ):
            print(f"{solution_number}. {solution}")

    else:
        print(
            "No solution found for "
            f"{format_number(number_1)}, "
            f"{format_number(number_2)}, "
            f"{format_number(number_3)}, and "
            f"{format_number(number_4)}."
        )

    return sorted_solutions


# Example:
make_24(3, 3, 8, 8)




# [3,3,8,8] = 8 / (3 - 8/3) = 24
# [ (3, "3"), (3, "3"), (8, "8"), (8, "8") ] => (number, expression)


# [ (3, "3"), (3, "3"), (8, "8"), (8, "8") ] => (number, expression)

# [ (8/3, "8/3"), (3, "3"), (8, "8")] => (number, expression)

# [ (1/3, "3 - 8/3"), (8, "8")] => (number, expression)
# [ (24, "8 / (3 - 8/3)")] => (number, expression)
