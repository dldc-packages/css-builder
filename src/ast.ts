export type Syntax_PlusSign<T> = readonly [T, ...T[]];
export type Syntax_Asterisk<T> = readonly T[];
export type Syntax_HashMark<T> = readonly [
  T,
  ...(readonly (readonly [
    { readonly kind: "token"; readonly value: "," },
    T,
  ])[]),
];
export type Syntax_QuestionMark<T> = T | null;

export type Min = {
  readonly kind: "min";
  readonly value: [
    { readonly kind: "function"; readonly value: "min" },
    { readonly kind: "token"; readonly value: "(" },
    Syntax_HashMark<CalcSum>,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

export type Max = {
  readonly kind: "max";
  readonly value: [
    { readonly kind: "function"; readonly value: "max" },
    { readonly kind: "token"; readonly value: "(" },
    Syntax_HashMark<CalcSum>,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

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

export type Calc = {
  readonly kind: "calc";
  readonly value: [
    { readonly kind: "function"; readonly value: "calc" },
    { readonly kind: "token"; readonly value: "(" },
    CalcSum,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

export type Exp = {
  readonly kind: "exp";
  readonly value: [
    { readonly kind: "function"; readonly value: "exp" },
    { readonly kind: "token"; readonly value: "(" },
    CalcSum,
    { readonly kind: "token"; readonly value: ")" },
  ];
};

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
  | Var;

export type CalcKeyword = "e" | "pi" | "infinity" | "-infinity" | "NaN";
