import type * as Ast from "./ast.ts";

export type OneOrMore<T> = readonly [T, ...(readonly T[])];

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

export type CalcValueCreators = {
  number(value: number | string): Ast.CalcValue;
  dimension(value: number | string, unit: string): Ast.CalcValue;
  percentage(value: number | string): Ast.CalcValue;
  keyword(value: Ast.CalcKeyword): Ast.CalcValue;
  group(value: Ast.CalcSum): Ast.CalcValue;
  raw(value: string): Ast.CalcValue;
  var(name: string, fallback?: Ast.CalcSum): Ast.CalcValue;
};

export const calcValue: CalcValueCreators = {
  number(value: number | string): Ast.CalcValue {
    return { kind: "number", value: value.toString() };
  },
  dimension(value: number | string, unit: string): Ast.CalcValue {
    return {
      kind: "dimension",
      value: [
        { kind: "dimension-number", value: value.toString() },
        { kind: "dimension-unit", value: unit },
      ],
    };
  },
  percentage(value: number | string): Ast.CalcValue {
    return {
      kind: "percentage",
      value: [
        { kind: "percentage-number", value: value.toString() },
        { kind: "token", value: "%" },
      ],
    };
  },
  keyword(value: Ast.CalcKeyword): Ast.CalcValue {
    return {
      kind: "keyword",
      value,
    };
  },
  group(value: Ast.CalcSum): Ast.CalcValue {
    return {
      kind: "group",
      value: [{ kind: "token", value: "(" }, value, {
        kind: "token",
        value: ")",
      }],
    };
  },
  raw(value: string): Ast.CalcValue {
    return {
      kind: "raw",
      value,
    };
  },
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
