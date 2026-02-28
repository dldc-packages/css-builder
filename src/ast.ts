/**
 * @module ast
 *
 * Abstract Syntax Tree (AST) type definitions for CSS expressions.
 *
 * This module defines the complete type system for representing CSS math functions and
 * expressions as immutable AST nodes. The types follow the CSS Spec and represent the
 * structure of calc(), min(), max(), clamp(), exp(), and round() functions.
 *
 * The AST uses a recursive structure where each node contains:
 * - `kind`: A string identifying the node type (e.g., "calc", "min", "calc-sum")
 * - `value`: The node's content (string token, child nodes, or arrays thereof)
 */

/**
 * Syntax helper for one or more items ('+' in CSS spec).
 * Represents a sequence of one required item followed by zero or more additional items.
 * @template T The type of items in the sequence
 */
export type Syntax_PlusSign<T> = readonly [T, ...T[]];
/**
 * Syntax helper for zero or more items ('*' in CSS spec).
 * Represents an optional sequence of items.
 * @template T The type of items in the sequence
 */
export type Syntax_Asterisk<T> = readonly T[];
/**
 * Syntax helper for one or more comma-separated items ('#' in CSS spec).
 * Represents a sequence of one required item followed by zero or more comma-separated items.
 * @template T The type of items being separated
 */
export type Syntax_HashMark<T> = readonly [
  T,
  ...(readonly (readonly [
    { readonly kind: "token"; readonly value: "," },
    T,
  ])[]),
];
/**
 * Syntax helper for optional items ('?' in CSS spec).
 * Represents an item that may or may not be present.
 * @template T The type of the optional item
 */
export type Syntax_QuestionMark<T> = T | null;

/**
 * AST node representing a CSS min() function.
 * Returns the minimum value from a comma-separated list of expressions.
 * @example min(100px, 50%)
 */
export type Min = {
  readonly kind: "min";
  readonly value: [
    { readonly kind: "function"; readonly value: "min" },
    { readonly kind: "token"; readonly value: "(" },
    Syntax_HashMark<CalcSum>,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing a CSS max() function.
 * Returns the maximum value from a comma-separated list of expressions.
 * @example max(100px, 50%)
 */
export type Max = {
  readonly kind: "max";
  readonly value: [
    { readonly kind: "function"; readonly value: "max" },
    { readonly kind: "token"; readonly value: "(" },
    Syntax_HashMark<CalcSum>,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing a CSS clamp() function.
 * Constrains a value between a minimum and maximum, with a preferred value in between.
 * Syntax: clamp(min, preferred, max)
 * Min and max can be 'none' to indicate no constraint on that side.
 * @example clamp(10px, 100%, 500px)
 */
export type Clamp = {
  readonly kind: "clamp";
  readonly value: [
    { readonly kind: "function"; readonly value: "clamp" },
    { readonly kind: "token"; readonly value: "(" },
    CalcSum | { readonly kind: "keyword"; readonly value: "none" },
    { readonly kind: "token"; readonly value: "," },
    CalcSum,
    { readonly kind: "token"; readonly value: "," },
    CalcSum | { readonly kind: "keyword"; readonly value: "none" },
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing a CSS var() function for custom properties.
 * Retrieves the value of a CSS custom property (CSS variable).
 * Can include a fallback value as the second argument.
 * @example var(--my-color, blue)
 */
export type Var = {
  readonly kind: "var";
  readonly value: readonly [
    { readonly kind: "function"; readonly value: "var" },
    { readonly kind: "token"; readonly value: "(" },
    { readonly kind: "custom-property"; readonly value: string },
    Syntax_QuestionMark<
      readonly [{ readonly kind: "token"; readonly value: "," }, CalcSum]
    >,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing a CSS calc() expression.
 * Performs mathematical operations (addition, subtraction, multiplication, division)
 * on dimensioned values.
 * @example calc(100px + 2 * 20px)
 */
export type Calc = {
  readonly kind: "calc";
  readonly value: [
    { readonly kind: "function"; readonly value: "calc" },
    { readonly kind: "token"; readonly value: "(" },
    CalcSum,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing a CSS exp() function.
 * Calculates e (Euler's number, ~2.718) raised to the power of the given value.
 * @example exp(1)
 */
export type Exp = {
  readonly kind: "exp";
  readonly value: [
    { readonly kind: "function"; readonly value: "exp" },
    { readonly kind: "token"; readonly value: "(" },
    CalcSum,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing a CSS pow() function.
 * Raises a base value to the power of an exponent.
 * @example pow(2, 3)
 */
export type Pow = {
  readonly kind: "pow";
  readonly value: [
    { readonly kind: "function"; readonly value: "pow" },
    { readonly kind: "token"; readonly value: "(" },
    CalcSum,
    { readonly kind: "token"; readonly value: "," },
    CalcSum,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * Rounding strategy for the round() function.
 * - 'nearest': Round to the nearest multiple of the interval
 * - 'up': Round away from zero
 * - 'down': Round towards zero
 * - 'to-zero': Round towards zero (same as 'down' for positive numbers)
 */
export type RoundStrategy = "nearest" | "up" | "down" | "to-zero";

/**
 * AST node representing a CSS round() function.
 * Rounds a value to the nearest multiple of an interval according to a rounding strategy.
 * The rounding strategy is optional; if omitted, defaults to 'nearest'.
 * @example round(nearest, 5.5, 1) // rounds 5.5 to nearest 1 = 6
 */
export type Round = {
  readonly kind: "round";
  readonly value: [
    { readonly kind: "function"; readonly value: "round" },
    { readonly kind: "token"; readonly value: "(" },
    Syntax_QuestionMark<
      readonly [
        { readonly kind: "rounding-strategy"; readonly value: RoundStrategy },
        { readonly kind: "token"; readonly value: "," },
      ]
    >,
    CalcSum,
    Syntax_QuestionMark<
      readonly [{ readonly kind: "token"; readonly value: "," }, CalcSum]
    >,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

/**
 * AST node representing an addition or subtraction expression within calc().
 * Can be a simple CalcProduct or a sum of multiple products with + or - operators.
 * @example 100px + 2 * 20px
 */
export type CalcSum =
  | CalcProduct
  | {
    readonly kind: "calc-sum";
    readonly value: readonly [
      CalcProduct,
      Syntax_Asterisk<
        [{ readonly kind: "token"; readonly value: " + " | " - " }, CalcProduct]
      >,
    ];
  };

/**
 * AST node representing a multiplication or division expression within calc().
 * Can be a simple CalcValue or a product of multiple values with * or / operators.
 * @example 2 * 20px
 */
export type CalcProduct =
  | CalcValue
  | {
    readonly kind: "calc-product";
    readonly value: readonly [
      CalcValue,
      Syntax_Asterisk<
        [{ readonly kind: "token"; readonly value: "*" | "/" }, CalcValue]
      >,
    ];
  };

/**
 * AST node representing a value within a calc() expression.
 * Can be a number, dimension (value with unit), percentage, keyword, raw string,
 * grouped expression, or another CSS function (min, max, clamp, calc, exp, round, var).
 * @example 100px | 50% | e | (10px + 20px)
 */
export type CalcValue =
  | {
    readonly kind: "number";
    readonly value: string;
  }
  | {
    readonly kind: "dimension";
    readonly value: readonly [
      { readonly kind: "dimension-number"; readonly value: string },
      { readonly kind: "dimension-unit"; readonly value: string },
    ];
  }
  | {
    readonly kind: "percentage";
    readonly value: [
      { readonly kind: "percentage-number"; readonly value: string },
      { readonly kind: "token"; readonly value: "%" },
    ];
  }
  | {
    readonly kind: "keyword";
    readonly value: CalcKeyword;
  }
  | {
    readonly kind: "raw";
    readonly value: string;
  }
  | {
    readonly kind: "group";
    readonly value: readonly [
      { readonly kind: "token"; readonly value: "(" },
      CalcSum,
      { readonly kind: "token"; readonly value: ")" },
    ];
  }
  | Min
  | Max
  | Clamp
  | Calc
  | Exp
  | Pow
  | Round
  | Var;

/**
 * CSS math constants that can be used in calc() expressions.
 * - 'e': Euler's number (~2.718)
 * - 'pi': The constant pi (~3.14159)
 * - 'infinity': Positive infinity
 * - '-infinity': Negative infinity
 * - 'NaN': Not a Number
 */
export type CalcKeyword = "e" | "pi" | "infinity" | "-infinity" | "NaN";
