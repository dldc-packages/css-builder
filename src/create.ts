/**
 * @module create
 *
 * Low-level AST node constructors for CSS expressions.
 *
 * This module provides factory functions for creating individual AST nodes. These are
 * the building blocks used internally by the builder module. Most users should prefer
 * the high-level {@link builder} API instead.
 *
 * This module is most useful when:
 * - Building custom AST structures
 * - Implementing custom CSS expression builders
 * - Integrating with other CSS-related tools that use this AST format
 */

import type * as Ast from "./ast.ts";

/**
 * Type representing a tuple with at least one item.
 * @template T The type of items
 */
export type OneOrMore<T> = readonly [T, ...(readonly T[])];

/**
 * Creates a min() AST node.
 * @param items One or more calc sum expressions
 * @returns A Min AST node
 */
export function min(...items: OneOrMore<Ast.CalcSum>): Ast.Min {
  const [first, ...rest] = items;
  return {
    kind: "min",
    value: [
      { kind: "function", value: "min" },
      { kind: "token", value: "(" },
      [
        first,
        ...rest.map((item) => [{ kind: "token", value: "," }, item] as const),
      ] as const,
      { kind: "token", value: ")" },
    ],
  };
}

/**
 * Creates a max() AST node.
 * @param items One or more calc sum expressions
 * @returns A Max AST node
 */
export function max(...items: OneOrMore<Ast.CalcSum>): Ast.Max {
  const [first, ...rest] = items;
  return {
    kind: "max",
    value: [
      { kind: "function", value: "max" },
      { kind: "token", value: "(" },
      [
        first,
        ...rest.map((item) => [{ kind: "token", value: "," }, item] as const),
      ] as const,
      { kind: "token", value: ")" },
    ],
  };
}

/**
 * Creates a clamp() AST node.
 * @param min The minimum value (or 'none')
 * @param preferred The preferred value
 * @param max The maximum value (or 'none')
 * @returns A Clamp AST node
 */
export function clamp(
  min: Ast.CalcSum | { kind: "keyword"; value: "none" },
  preferred: Ast.CalcSum,
  max: Ast.CalcSum | { kind: "keyword"; value: "none" },
): Ast.Clamp {
  return {
    kind: "clamp",
    value: [
      { kind: "function", value: "clamp" },
      { kind: "token", value: "(" },
      min,
      { kind: "token", value: "," },
      preferred,
      { kind: "token", value: "," },
      max,
      { kind: "token", value: ")" },
    ],
  };
}

/**
 * Creates a calc() AST node.
 * @param sum The calc sum expression
 * @returns A Calc AST node
 */
export function calc(sum: Ast.CalcSum): Ast.Calc {
  return {
    kind: "calc",
    value: [
      { kind: "function", value: "calc" },
      { kind: "token", value: "(" },
      sum,
      { kind: "token", value: ")" },
    ],
  };
}

/**
 * Creates an exp() AST node.
 * @param sum The exponent expression
 * @returns An Exp AST node
 */
export function exp(sum: Ast.CalcSum): Ast.Exp {
  return {
    kind: "exp",
    value: [
      { kind: "function", value: "exp" },
      { kind: "token", value: "(" },
      sum,
      { kind: "token", value: ")" },
    ],
  };
}

/**
 * Creates a pow() AST node.
 * @param base The base value
 * @param exponent The exponent value
 * @returns A Pow AST node
 */
export function pow(base: Ast.CalcSum, exponent: Ast.CalcSum): Ast.Pow {
  return {
    kind: "pow",
    value: [
      { kind: "function", value: "pow" },
      { kind: "token", value: "(" },
      base,
      { kind: "token", value: "," },
      exponent,
      { kind: "token", value: ")" },
    ],
  };
}

/**
 * Creates a round() AST node.
 * @param strategy The rounding strategy ('nearest', 'up', 'down', 'to-zero', or null)
 * @param value The value to round
 * @param interval Optional interval for rounding
 * @returns A Round AST node
 */
export function round(
  strategy: Ast.RoundStrategy | null,
  value: Ast.CalcSum,
  interval?: Ast.CalcSum,
): Ast.Round {
  return {
    kind: "round",
    value: [
      { kind: "function", value: "round" },
      { kind: "token", value: "(" },
      strategy
        ? ([{ kind: "rounding-strategy", value: strategy }, {
          kind: "token",
          value: ",",
        }] as const)
        : null,
      value,
      interval ? ([{ kind: "token", value: "," }, interval] as const) : null,
      { kind: "token", value: ")" },
    ],
  };
}
/**
 * Creates a calc-sum AST node (addition/subtraction).
 * @param first The first product
 * @param products Subsequent products with operators ('+' or '-')
 * @returns A CalcSum AST node
 */
export function clacSum(
  first: Ast.CalcProduct,
  ...products: readonly ["+" | "-", Ast.CalcProduct][]
): Ast.CalcSum {
  if (products.length === 0) {
    return first;
  }
  return {
    kind: "calc-sum",
    value: [
      first,
      products.map(([operator, product]) =>
        [{ kind: "token", value: ` ${operator} ` }, product] as const
      ),
    ] as const,
  };
}

/**
 * Creates a calc-product AST node (multiplication/division).
 * @param first The first value
 * @param values Subsequent values with operators ('*' or '/')
 * @returns A CalcProduct AST node
 */
export function calcProduct(
  first: Ast.CalcValue,
  ...values: readonly ["*" | "/", Ast.CalcValue][]
): Ast.CalcProduct {
  if (values.length === 0) {
    return first;
  }
  return {
    kind: "calc-product",
    value: [
      first,
      values.map(([operator, value]) =>
        [{ kind: "token", value: operator }, value] as const
      ),
    ] as const,
  };
}

/**
 * Object containing factory functions for creating CalcValue AST nodes.
 */
export type CalcValueCreators = {
  /** Creates a number CalcValue */
  number(value: number | string): Ast.CalcValue;
  /** Creates a dimension (value with unit) CalcValue */
  dimension(value: number | string, unit: string): Ast.CalcValue;
  /** Creates a percentage CalcValue */
  percentage(value: number | string): Ast.CalcValue;
  /** Creates a keyword (e, pi, infinity, NaN) CalcValue */
  keyword(value: Ast.CalcKeyword): Ast.CalcValue;
  /** Creates a grouped (parenthesized) CalcValue */
  group(value: Ast.CalcSum): Ast.CalcValue;
  /** Creates a raw/unprocessed CalcValue */
  raw(value: string): Ast.CalcValue;
  /** Creates a var() custom property CalcValue */
  var(name: string, fallback?: Ast.CalcSum): Ast.CalcValue;
};

/**
 * Factory object for creating different types of CalcValue AST nodes.
 * Provides methods for creating numbers, dimensions, percentages, keywords, grouped expressions, raw strings, and var() references.
 */
export const calcValue: CalcValueCreators = {
  /** @param value The numeric value */
  number(value: number | string): Ast.CalcValue {
    return { kind: "number", value: value.toString() };
  },
  /** @param value The numeric value @param unit The unit (px, em, rem, etc.) */
  dimension(value: number | string, unit: string): Ast.CalcValue {
    return {
      kind: "dimension",
      value: [
        { kind: "dimension-number", value: value.toString() },
        { kind: "dimension-unit", value: unit },
      ],
    };
  },
  /** @param value The numeric value */
  percentage(value: number | string): Ast.CalcValue {
    return {
      kind: "percentage",
      value: [
        { kind: "percentage-number", value: value.toString() },
        { kind: "token", value: "%" },
      ],
    };
  },
  /** @param value A CSS keyword constant (e, pi, infinity, NaN) */
  keyword(value: Ast.CalcKeyword): Ast.CalcValue {
    return {
      kind: "keyword",
      value,
    };
  },
  /** @param value A calc sum expression to group */
  group(value: Ast.CalcSum): Ast.CalcValue {
    return {
      kind: "group",
      value: [{ kind: "token", value: "(" }, value, {
        kind: "token",
        value: ")",
      }],
    };
  },
  /** @param value A raw CSS string */
  raw(value: string): Ast.CalcValue {
    return {
      kind: "raw",
      value,
    };
  },
  /** @param name The custom property name (e.g., '--my-var') @param fallback Optional fallback value */
  var(name: string, fallback?: Ast.CalcSum): Ast.CalcValue {
    return {
      kind: "var",
      value: [
        { kind: "function", value: "var" },
        { kind: "token", value: "(" },
        { kind: "custom-property", value: name },
        fallback ? ([{ kind: "token", value: "," }, fallback] as const) : null,
        { kind: "token", value: ")" },
      ],
    };
  },
};
