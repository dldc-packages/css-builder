/**
 * @module builder
 *
 * High-level builder API for constructing CSS expressions.
 *
 * This module provides composable functions for building CSS calc() expressions and related
 * CSS math functions (min, max, clamp, exp, pow, round, etc.). All functions accept flexible input
 * types and automatically flatten nested expressions for optimal CSS output.
 *
 * ## Usage
 *
 * ```ts
 * import { add, multiply, min, serialize } from "@dldc/css-builder";
 *
 * const width = add("100px", multiply(2, "10px"));
 * const responsive = min(width, "90vw");
 * console.log(serialize(responsive)); // "min(calc(100px + 2 * 10px), 90vw)"
 * ```
 */

import type * as Ast from "./ast.ts";
import * as create from "./create.ts";

export type AnyExpression = Ast.CalcSum | Ast.CalcProduct | number | string;
export type AnyMaybeExpression = AnyExpression | null;

/**
 * Internal helper function to handle both addition and subtraction operations.
 * Merges and flattens nested calc expressions into a single calc-sum.
 * @param op - The operation: '+' for addition or '-' for subtraction
 * @param items - The items to add or subtract (can be numbers, strings, or calc expressions)
 * @returns A normalized Calc AST node
 */
function addOrSubstract(
  op: "+" | "-",
  ...items: AnyMaybeExpression[]
): Ast.Calc {
  const resolvedItems: ["+" | "-", Ast.CalcProduct][] = [];
  const outerOp = op;
  function handleItem(item: AnyMaybeExpression) {
    if (!item) {
      return;
    }
    if (typeof item === "string" || typeof item === "number") {
      resolvedItems.push([op, value(item)]);
      return;
    }
    if (item.kind === "calc-sum") {
      // Merge calc sum;
      const isFirst = resolvedItems.length === 0;
      const [first, rest] = item.value;
      resolvedItems.push([outerOp, first]);
      rest.forEach(([op, val]) => {
        const nextOp = op.value === " + " ? "+" : "-";
        const mergedOp = outerOp === "-" && !isFirst
          ? (nextOp === "+" ? "-" : "+")
          : nextOp;
        resolvedItems.push([mergedOp, val]);
      });
      return;
    }
    if (item.kind === "calc") {
      // Un wrap calc
      handleItem(item.value[2]);
      return;
    }
    resolvedItems.push([op, item]);
  }
  for (const item of items) {
    handleItem(item);
  }
  const first = resolvedItems.shift();
  if (!first) {
    throw new Error("Expected at least one item.");
  }
  return create.calc(create.clacSum(first[1], ...resolvedItems));
}

/**
 * Creates a CSS calc() expression that adds all provided items.
 * Automatically flattens nested additions.
 * @param items - The values to add (numbers, strings, or calc expressions)
 * @returns A Calc AST node representing the addition
 */
export function add(...items: AnyMaybeExpression[]): Ast.Calc {
  return addOrSubstract("+", ...items);
}

/**
 * Creates a CSS calc() expression that subtracts items from the first item.
 * The first item is the minuend, and subsequent items are subtracted from it.
 * @param items - The values to subtract (numbers, strings, or calc expressions)
 * @returns A Calc AST node representing the subtraction
 */
export function substract(...items: AnyMaybeExpression[]): Ast.Calc {
  return addOrSubstract("-", ...items);
}

/**
 * Internal helper function to handle both multiplication and division operations.
 * Merges and flattens nested calc-product expressions into a single calc-product.
 * @param op - The operation: '*' for multiplication or '/' for division
 * @param items - The items to multiply or divide (can be numbers, strings, or calc expressions)
 * @returns A normalized Calc AST node
 */
export function multiplyOrDivide(
  op: "*" | "/",
  ...items: AnyMaybeExpression[]
): Ast.Calc {
  const resolvedItems: ["*" | "/", Ast.CalcValue][] = [];
  function handleItem(item: AnyMaybeExpression) {
    if (!item) {
      return;
    }
    if (typeof item === "string" || typeof item === "number") {
      resolvedItems.push([op, value(item)]);
      return;
    }
    if (item.kind === "calc-product") {
      // Merge calc sum;
      const [first, rest] = item.value;
      resolvedItems.push([op, first]);
      rest.forEach(([op, val]) => {
        resolvedItems.push([op.value, val]);
      });
      return;
    }
    if (item.kind === "calc-sum") {
      resolvedItems.push([op, create.calcValue.group(item)]);
      return;
    }
    if (item.kind === "calc") {
      handleItem(item.value[2]);
      return;
    }
    resolvedItems.push([op, item]);
  }
  for (const item of items) {
    handleItem(item);
  }
  const first = resolvedItems.shift();
  if (!first) {
    throw new Error("Expected at least one item.");
  }
  return create.calc(create.calcProduct(first[1], ...resolvedItems));
}

/**
 * Creates a CSS calc() expression that multiplies all provided items.
 * Automatically flattens nested multiplications.
 * @param items - The values to multiply (numbers, strings, or calc expressions)
 * @returns A Calc AST node representing the multiplication
 */
export function multiply(...items: AnyMaybeExpression[]): Ast.Calc {
  return multiplyOrDivide("*", ...items);
}

/**
 * Creates a CSS calc() expression that divides the first item by subsequent items.
 * The first item is the dividend, and subsequent items are divisors.
 * @param items - The values to divide (numbers, strings, or calc expressions)
 * @returns A Calc AST node representing the division
 */
export function divide(...items: AnyMaybeExpression[]): Ast.Calc {
  return multiplyOrDivide("/", ...items);
}

/**
 * Internal helper function that resolves and normalizes calc expressions to CalcSum AST nodes.
 * Handles unwrapping of Calc nodes and converts primitive values to CalcSum.
 * @param items - The items to resolve
 * @returns An array of CalcSum AST nodes
 */
function resolveCalcSums(...items: AnyMaybeExpression[]): Ast.CalcSum[] {
  const resolvedItems: Ast.CalcSum[] = [];
  function handleItem(item: AnyMaybeExpression) {
    if (!item) {
      return;
    }
    if (typeof item === "string" || typeof item === "number") {
      resolvedItems.push(value(item));
      return;
    }
    if (item.kind === "calc") {
      resolvedItems.push(item.value[2]);
      return;
    }
    resolvedItems.push(item);
  }
  for (const item of items) {
    handleItem(item);
  }
  return resolvedItems;
}

/**
 * Creates a CSS min() function expression.
 * Returns the minimum value from the provided items.
 * @param items - The values to compare (numbers, strings, or calc expressions)
 * @returns A Min AST node representing the min() function
 */
export function min(...items: AnyMaybeExpression[]): Ast.Min {
  const resolvedItems = resolveCalcSums(...items);
  const first = resolvedItems.shift();
  if (!first) {
    throw new Error("Expected at least one item.");
  }
  return create.min(first, ...resolvedItems);
}

/**
 * Creates a CSS max() function expression.
 * Returns the maximum value from the provided items.
 * @param items - The values to compare (numbers, strings, or calc expressions)
 * @returns A Max AST node representing the max() function
 */
export function max(...items: AnyMaybeExpression[]): Ast.Max {
  const resolvedItems = resolveCalcSums(...items);
  const first = resolvedItems.shift();
  if (!first) {
    throw new Error("Expected at least one item.");
  }
  return create.max(first, ...resolvedItems);
}

/**
 * Internal helper function that converts an AnyExpression to a CalcSum AST node.
 * Handles unwrapping Calc nodes and direct CalcSum/CalcProduct conversion.
 * @param item - The expression to convert
 * @returns A CalcSum AST node
 */
function anyExprToCalcSum(item: AnyExpression): Ast.CalcSum {
  if (typeof item === "string" || typeof item === "number") {
    return value(item);
  }
  if (item.kind === "calc") {
    return item.value[2];
  }
  return item;
}

/**
 * Creates a CSS clamp() function expression.
 * Clamps a value between a minimum and maximum using a preferred value.
 * @param min - The minimum value (can be 'none', a number, string, or calc expression)
 * @param preferred - The preferred value (numbers, strings, or calc expressions)
 * @param max - The maximum value (can be 'none', a number, string, or calc expression)
 * @returns A Clamp AST node representing the clamp() function
 */
export function clamp(
  min: AnyExpression | "none",
  preferred: AnyExpression,
  max: AnyExpression | "none",
): Ast.Clamp {
  return create.clamp(
    min === "none" ? { kind: "keyword", value: "none" } : anyExprToCalcSum(min),
    anyExprToCalcSum(preferred),
    max === "none" ? { kind: "keyword", value: "none" } : anyExprToCalcSum(max),
  );
}

/**
 * Creates a CSS exp() function expression.
 * Calculates e (Euler's number) raised to the power of the provided value.
 * @param item - The exponent value (number, string, or calc expression)
 * @returns An Exp AST node representing the exp() function
 */
export function exp(item: AnyExpression): Ast.Exp {
  if (typeof item === "string" || typeof item === "number") {
    return create.exp(value(item));
  }
  return create.exp(anyExprToCalcSum(item));
}

/**
 * Creates a CSS pow() function expression.
 * Raises the base value to the power of the exponent.
 * @param base - The base value (number, string, or calc expression)
 * @param exponent - The exponent value (number, string, or calc expression)
 * @returns A Pow AST node representing the pow() function
 */
export function pow(
  base: AnyExpression,
  exponent: AnyExpression,
): Ast.Pow {
  return create.pow(
    anyExprToCalcSum(base),
    anyExprToCalcSum(exponent),
  );
}
/**
 * Creates a CSS round() function expression.
 * Rounds a value to the nearest multiple of an interval.
 * @param strategy - The rounding strategy: 'nearest', 'up', 'down', or 'to-zero' (null for no strategy)
 * @param value - The value to round (number, string, or calc expression)
 * @param interval - Optional interval for rounding (number, string, or calc expression)
 * @returns A Round AST node representing the round() function
 */
export function round(
  strategy: Ast.RoundStrategy | null,
  value: AnyExpression,
  interval?: AnyExpression,
): Ast.Round {
  if (value == null) {
    throw new Error("Expected at least one item.");
  }

  return create.round(
    strategy,
    anyExprToCalcSum(value),
    interval ? anyExprToCalcSum(interval) : undefined,
  );
}

/**
 * Creates a CSS round(nearest, ...) function expression.
 * Rounds a value to the nearest multiple of an interval.
 * @param value - The value to round (number, string, or calc expression)
 * @param interval - Optional interval for rounding (number, string, or calc expression)
 * @returns A Round AST node with 'nearest' strategy
 */
export function roundNearest(
  value: AnyExpression,
  interval?: AnyExpression,
): Ast.Round {
  return round("nearest", value, interval);
}

/**
 * Creates a CSS round(up, ...) function expression.
 * Rounds a value up to the nearest multiple of an interval.
 * @param value - The value to round (number, string, or calc expression)
 * @param interval - Optional interval for rounding (number, string, or calc expression)
 * @returns A Round AST node with 'up' strategy
 */
export function roundUp(
  value: AnyExpression,
  interval?: AnyExpression,
): Ast.Round {
  return round("up", value, interval);
}

/**
 * Creates a CSS round(down, ...) function expression.
 * Rounds a value down to the nearest multiple of an interval.
 * @param value - The value to round (number, string, or calc expression)
 * @param interval - Optional interval for rounding (number, string, or calc expression)
 * @returns A Round AST node with 'down' strategy
 */
export function roundDown(
  value: AnyExpression,
  interval?: AnyExpression,
): Ast.Round {
  return round("down", value, interval);
}

/**
 * Creates a CSS round(to-zero, ...) function expression.
 * Rounds a value towards zero to the nearest multiple of an interval.
 * @param value - The value to round (number, string, or calc expression)
 * @param interval - Optional interval for rounding (number, string, or calc expression)
 * @returns A Round AST node with 'to-zero' strategy
 */
export function roundToZero(
  value: AnyExpression,
  interval?: AnyExpression,
): Ast.Round {
  return round("to-zero", value, interval);
}

/**
 * Converts a string or number into a CalcValue AST node.
 * Automatically parses numeric values and units (percentages, dimensions, etc.).
 * @param value - A number or string representing a value (e.g., '100px', '50%', '1.5em')
 * @returns A CalcValue AST node (number, percentage, dimension, or raw)
 */
export function value(value: string | number): Ast.CalcValue {
  if (typeof value === "number") {
    return create.calcValue.number(value);
  }
  const match = value.match(/^[+-]?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?/);
  if (!match) {
    return create.calcValue.raw(value);
  }
  const numberPart = match[0];
  const unit = value.slice(numberPart.length);
  if (unit === "") {
    return create.calcValue.number(numberPart);
  }
  if (unit === "%") {
    return create.calcValue.percentage(numberPart);
  }
  return create.calcValue.dimension(numberPart, unit);
}
