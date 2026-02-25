import type * as Ast from "./ast.ts";
import * as create from "./create.ts";

export type AnyExpression = Ast.CalcSum | Ast.CalcProduct | number | string;
export type AnyMaybeExpression = AnyExpression | null;

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

export function add(...items: AnyMaybeExpression[]): Ast.Calc {
  return addOrSubstract("+", ...items);
}

export function substract(...items: AnyMaybeExpression[]): Ast.Calc {
  return addOrSubstract("-", ...items);
}

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

export function multiply(...items: AnyMaybeExpression[]): Ast.Calc {
  return multiplyOrDivide("*", ...items);
}

export function divide(...items: AnyMaybeExpression[]): Ast.Calc {
  return multiplyOrDivide("/", ...items);
}

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

export function min(...items: AnyMaybeExpression[]): Ast.Min {
  const resolvedItems = resolveCalcSums(...items);
  const first = resolvedItems.shift();
  if (!first) {
    throw new Error("Expected at least one item.");
  }
  return create.min(first, ...resolvedItems);
}

export function max(...items: AnyMaybeExpression[]): Ast.Max {
  const resolvedItems = resolveCalcSums(...items);
  const first = resolvedItems.shift();
  if (!first) {
    throw new Error("Expected at least one item.");
  }
  return create.max(first, ...resolvedItems);
}

function anyExprToCalcSum(item: AnyExpression): Ast.CalcSum {
  if (typeof item === "string" || typeof item === "number") {
    return value(item);
  }
  if (item.kind === "calc") {
    return item.value[2];
  }
  return item;
}

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

export function exp(item: AnyMaybeExpression): Ast.Exp {
  if (!item) {
    throw new Error("Expected at least one item.");
  }
  if (typeof item === "string" || typeof item === "number") {
    return create.exp(value(item));
  }
  return create.exp(anyExprToCalcSum(item as AnyExpression));
}

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
