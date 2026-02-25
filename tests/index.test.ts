import { expect } from "@std/expect";

import * as create from "../src/create.ts";
import { serialize } from "../src/serialize.ts";

Deno.test("calcValue", async (t) => {
  await t.step("number", async (t) => {
    await t.step("creates number from numeric value", () => {
      const result = create.calcValue.number(42);
      expect(result).toEqual({ kind: "number", value: "42" });
      expect(serialize(result)).toBe("42");
    });

    await t.step("creates number from string value", () => {
      const result = create.calcValue.number("3.14");
      expect(result).toEqual({ kind: "number", value: "3.14" });
      expect(serialize(result)).toBe("3.14");
    });
  });

  await t.step("dimension", async (t) => {
    await t.step("creates dimension with px unit", () => {
      const result = create.calcValue.dimension(100, "px");
      expect(result).toEqual({
        kind: "dimension",
        value: [
          { kind: "dimension-number", value: "100" },
          { kind: "dimension-unit", value: "px" },
        ],
      });
      expect(serialize(result)).toBe("100px");
    });

    await t.step("creates dimension with rem unit", () => {
      const result = create.calcValue.dimension(1.5, "rem");
      expect(serialize(result)).toBe("1.5rem");
    });

    await t.step("creates dimension from string value", () => {
      const result = create.calcValue.dimension("2.5", "em");
      expect(serialize(result)).toBe("2.5em");
    });
  });

  await t.step("percentage", async (t) => {
    await t.step("creates percentage from numeric value", () => {
      const result = create.calcValue.percentage(50);
      expect(result).toEqual({
        kind: "percentage",
        value: [
          { kind: "percentage-number", value: "50" },
          { kind: "token", value: "%" },
        ],
      });
      expect(serialize(result)).toBe("50%");
    });

    await t.step("creates percentage from string value", () => {
      const result = create.calcValue.percentage("75.5");
      expect(serialize(result)).toBe("75.5%");
    });
  });

  await t.step("keyword", async (t) => {
    await t.step("creates keyword with e", () => {
      const result = create.calcValue.keyword("e");
      expect(result).toEqual({ kind: "keyword", value: "e" });
      expect(serialize(result)).toBe("e");
    });

    await t.step("creates keyword with pi", () => {
      const result = create.calcValue.keyword("pi");
      expect(serialize(result)).toBe("pi");
    });

    await t.step("creates keyword with infinity", () => {
      const result = create.calcValue.keyword("infinity");
      expect(serialize(result)).toBe("infinity");
    });

    await t.step("creates keyword with -infinity", () => {
      const result = create.calcValue.keyword("-infinity");
      expect(serialize(result)).toBe("-infinity");
    });

    await t.step("creates keyword with NaN", () => {
      const result = create.calcValue.keyword("NaN");
      expect(serialize(result)).toBe("NaN");
    });
  });

  await t.step("group", async (t) => {
    await t.step("creates grouped value", () => {
      const inner = create.calcValue.number(42);
      const result = create.calcValue.group(inner);
      expect(result.kind).toBe("group");
      expect(serialize(result)).toBe("(42)");
    });

    await t.step("creates grouped sum", () => {
      const sum = create.clacSum(create.calcValue.dimension(10, "px"), [
        "+",
        create.calcValue.dimension(5, "px"),
      ]);
      const result = create.calcValue.group(sum);
      expect(serialize(result)).toBe("(10px + 5px)");
    });
  });

  await t.step("var", async (t) => {
    await t.step("creates var without fallback", () => {
      const result = create.calcValue.var("--size");
      expect(result).toEqual({
        kind: "var",
        value: [
          { kind: "function", value: "var" },
          { kind: "token", value: "(" },
          { kind: "custom-property", value: "--size" },
          null,
          { kind: "token", value: ")" },
        ],
      });
      expect(serialize(result)).toBe("var(--size)");
    });

    await t.step("creates var with fallback", () => {
      const fallback = create.clacSum(create.calcValue.dimension(10, "px"), [
        "+",
        create.calcValue.number(2),
      ]);
      const result = create.calcValue.var("--gutter", fallback);
      expect(serialize(result)).toBe("var(--gutter,10px + 2)");
    });
  });
});

Deno.test("calcProduct", async (t) => {
  await t.step("returns single value when no operations", () => {
    const value = create.calcValue.number(10);
    const result = create.calcProduct(value);
    expect(result).toBe(value);
    expect(serialize(result)).toBe("10");
  });

  await t.step("creates multiplication", () => {
    const result = create.calcProduct(create.calcValue.number(10), [
      "*",
      create.calcValue.number(2),
    ]);
    expect(result.kind).toBe("calc-product");
    expect(serialize(result)).toBe("10*2");
  });

  await t.step("creates division", () => {
    const result = create.calcProduct(create.calcValue.number(100), [
      "/",
      create.calcValue.number(4),
    ]);
    expect(serialize(result)).toBe("100/4");
  });

  await t.step("creates multiple operations", () => {
    const result = create.calcProduct(
      create.calcValue.number(10),
      ["*", create.calcValue.number(2)],
      ["/", create.calcValue.number(5)],
    );
    expect(serialize(result)).toBe("10*2/5");
  });

  await t.step("works with dimensions", () => {
    const result = create.calcProduct(create.calcValue.dimension(100, "px"), [
      "*",
      create.calcValue.number(2),
    ]);
    expect(serialize(result)).toBe("100px*2");
  });
});

Deno.test("clacSum", async (t) => {
  await t.step("returns single value when no operations", () => {
    const value = create.calcValue.number(10);
    const result = create.clacSum(value);
    expect(result).toBe(value);
    expect(serialize(result)).toBe("10");
  });

  await t.step("creates addition", () => {
    const result = create.clacSum(create.calcValue.number(10), [
      "+",
      create.calcValue.number(5),
    ]);
    expect(result.kind).toBe("calc-sum");
    expect(serialize(result)).toBe("10 + 5");
  });

  await t.step("creates subtraction", () => {
    const result = create.clacSum(create.calcValue.number(100), [
      "-",
      create.calcValue.number(25),
    ]);
    expect(serialize(result)).toBe("100 - 25");
  });

  await t.step("creates multiple operations", () => {
    const result = create.clacSum(
      create.calcValue.dimension(100, "px"),
      ["+", create.calcValue.dimension(50, "px")],
      ["-", create.calcValue.dimension(20, "px")],
    );
    expect(serialize(result)).toBe("100px + 50px - 20px");
  });

  await t.step("works with calc products", () => {
    const product = create.calcProduct(create.calcValue.number(10), [
      "*",
      create.calcValue.number(2),
    ]);
    const result = create.clacSum(product, ["+", create.calcValue.number(5)]);
    expect(serialize(result)).toBe("10*2 + 5");
  });
});

Deno.test("calc", async (t) => {
  await t.step("wraps simple value in calc function", () => {
    const sum = create.calcValue.number(42);
    const result = create.calc(sum);
    expect(result).toEqual({
      kind: "calc",
      value: [
        { kind: "function", value: "calc" },
        { kind: "token", value: "(" },
        sum,
        { kind: "token", value: ")" },
      ],
    });
    expect(serialize(result)).toBe("calc(42)");
  });

  await t.step("wraps sum in calc function", () => {
    const sum = create.clacSum(create.calcValue.dimension(100, "px"), [
      "+",
      create.calcValue.dimension(50, "px"),
    ]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(100px + 50px)");
  });

  await t.step("wraps complex expression in calc function", () => {
    const product = create.calcProduct(create.calcValue.dimension(100, "vw"), [
      "/",
      create.calcValue.number(2),
    ]);
    const sum = create.clacSum(product, [
      "-",
      create.calcValue.dimension(20, "px"),
    ]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(100vw/2 - 20px)");
  });
});

Deno.test("exp", async (t) => {
  await t.step("wraps simple value in exp function", () => {
    const sum = create.calcValue.number(2);
    const result = create.exp(sum);
    expect(result).toEqual({
      kind: "exp",
      value: [
        { kind: "function", value: "exp" },
        { kind: "token", value: "(" },
        sum,
        { kind: "token", value: ")" },
      ],
    });
    expect(serialize(result)).toBe("exp(2)");
  });

  await t.step("wraps sum in exp function", () => {
    const sum = create.clacSum(create.calcValue.dimension(10, "px"), [
      "+",
      create.calcValue.number(2),
    ]);
    const result = create.exp(sum);
    expect(serialize(result)).toBe("exp(10px + 2)");
  });
});

Deno.test("min", async (t) => {
  await t.step("creates min with two values", () => {
    const result = create.min(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(50),
    );
    expect(result.kind).toBe("min");
    expect(serialize(result)).toBe("min(100px,50%)");
  });

  await t.step("creates min with three values", () => {
    const result = create.min(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(50),
      create.calcValue.dimension(80, "vw"),
    );
    expect(serialize(result)).toBe("min(100px,50%,80vw)");
  });

  await t.step("creates min with calc sums", () => {
    const sum1 = create.clacSum(create.calcValue.dimension(100, "px"), [
      "+",
      create.calcValue.dimension(20, "px"),
    ]);
    const sum2 = create.calcValue.percentage(50);
    const result = create.min(sum1, sum2);
    expect(serialize(result)).toBe("min(100px + 20px,50%)");
  });
});

Deno.test("max", async (t) => {
  await t.step("creates max with two values", () => {
    const result = create.max(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(50),
    );
    expect(result.kind).toBe("max");
    expect(serialize(result)).toBe("max(100px,50%)");
  });

  await t.step("creates max with three values", () => {
    const result = create.max(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(50),
      create.calcValue.dimension(200, "px"),
    );
    expect(serialize(result)).toBe("max(100px,50%,200px)");
  });

  await t.step("creates max with complex expressions", () => {
    const product = create.calcProduct(create.calcValue.dimension(100, "vw"), [
      "*",
      create.calcValue.number(0.8),
    ]);
    const result = create.max(create.calcValue.dimension(320, "px"), product);
    expect(serialize(result)).toBe("max(320px,100vw*0.8)");
  });
});

Deno.test("clamp", async (t) => {
  await t.step("creates clamp with three calc sums", () => {
    const min = create.calcValue.dimension(300, "px");
    const preferred = create.calcValue.percentage(50);
    const max = create.calcValue.dimension(800, "px");
    const result = create.clamp(min, preferred, max);
    expect(result).toEqual({
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
    });
    expect(serialize(result)).toBe("clamp(300px,50%,800px)");
  });

  await t.step("creates clamp with none as min", () => {
    const min = { kind: "keyword" as const, value: "none" as const };
    const preferred = create.calcValue.percentage(50);
    const max = create.calcValue.dimension(800, "px");
    const result = create.clamp(min, preferred, max);
    expect(serialize(result)).toBe("clamp(none,50%,800px)");
  });

  await t.step("creates clamp with none as max", () => {
    const min = create.calcValue.dimension(300, "px");
    const preferred = create.calcValue.percentage(50);
    const max = { kind: "keyword" as const, value: "none" as const };
    const result = create.clamp(min, preferred, max);
    expect(serialize(result)).toBe("clamp(300px,50%,none)");
  });

  await t.step("creates clamp with complex expressions", () => {
    const min = create.calcValue.dimension(320, "px");
    const preferred = create.clacSum(create.calcValue.dimension(100, "vw"), [
      "-",
      create.calcValue.dimension(40, "px"),
    ]);
    const max = create.calcValue.dimension(1200, "px");
    const result = create.clamp(min, preferred, max);
    expect(serialize(result)).toBe("clamp(320px,100vw - 40px,1200px)");
  });
});

Deno.test("integration tests", async (t) => {
  await t.step("complex nested expression", () => {
    const innerCalc = create.clacSum(create.calcValue.percentage(100), [
      "-",
      create.calcValue.dimension(20, "px"),
    ]);
    const product = create.calcProduct(create.calcValue.group(innerCalc), [
      "/",
      create.calcValue.number(2),
    ]);
    const result = create.calc(product);
    expect(serialize(result)).toBe("calc((100% - 20px)/2)");
  });

  await t.step("clamp with nested calculations", () => {
    const minProduct = create.calcProduct(
      create.calcValue.dimension(16, "px"),
      ["*", create.calcValue.number(1.5)],
    );
    const preferredSum = create.clacSum(create.calcValue.dimension(1, "rem"), [
      "+",
      create.calcValue.percentage(2),
    ]);
    const maxValue = create.calcValue.dimension(32, "px");
    const result = create.clamp(minProduct, preferredSum, maxValue);
    expect(serialize(result)).toBe("clamp(16px*1.5,1rem + 2%,32px)");
  });

  await t.step("multiple nested operations", () => {
    const product1 = create.calcProduct(create.calcValue.dimension(100, "vw"), [
      "*",
      create.calcValue.number(0.5),
    ]);
    const product2 = create.calcProduct(create.calcValue.dimension(50, "px"), [
      "/",
      create.calcValue.number(2),
    ]);
    const sum = create.clacSum(product1, ["-", product2]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(100vw*0.5 - 50px/2)");
  });
});

Deno.test("math functions as CalcValue", async (t) => {
  await t.step("min inside calc sum", () => {
    const minValue = create.min(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(50),
    );
    const sum = create.clacSum(minValue, [
      "+",
      create.calcValue.dimension(10, "px"),
    ]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(min(100px,50%) + 10px)");
  });

  await t.step("max inside calc product", () => {
    const maxValue = create.max(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(80),
    );
    const product = create.calcProduct(maxValue, [
      "*",
      create.calcValue.number(0.9),
    ]);
    const result = create.calc(product);
    expect(serialize(result)).toBe("calc(max(100px,80%)*0.9)");
  });

  await t.step("clamp inside calc sum", () => {
    const clampValue = create.clamp(
      create.calcValue.dimension(320, "px"),
      create.calcValue.percentage(50),
      create.calcValue.dimension(800, "px"),
    );
    const sum = create.clacSum(clampValue, [
      "-",
      create.calcValue.dimension(20, "px"),
    ]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(clamp(320px,50%,800px) - 20px)");
  });

  await t.step("exp inside calc product", () => {
    const expValue = create.exp(
      create.clacSum(create.calcValue.number(2), [
        "+",
        create.calcValue.number(1),
      ]),
    );
    const product = create.calcProduct(expValue, [
      "*",
      create.calcValue.number(3),
    ]);
    const result = create.calc(product);
    expect(serialize(result)).toBe("calc(exp(2 + 1)*3)");
  });

  await t.step("min and max combined in sum", () => {
    const minValue = create.min(
      create.calcValue.dimension(200, "px"),
      create.calcValue.percentage(30),
    );
    const maxValue = create.max(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(15),
    );
    const sum = create.clacSum(minValue, ["+", maxValue]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(min(200px,30%) + max(100px,15%))");
  });

  await t.step("nested math functions", () => {
    const innerMin = create.min(
      create.calcValue.dimension(50, "px"),
      create.calcValue.percentage(10),
    );
    const outerMax = create.max(innerMin, create.calcValue.dimension(20, "px"));
    const result = create.calc(outerMax);
    expect(serialize(result)).toBe("calc(max(min(50px,10%),20px))");
  });

  await t.step("clamp with min and max inside", () => {
    const minValue = create.min(
      create.calcValue.dimension(100, "px"),
      create.calcValue.percentage(20),
    );
    const maxValue = create.max(
      create.calcValue.dimension(500, "px"),
      create.calcValue.percentage(80),
    );
    const preferred = create.calcValue.percentage(50);
    const result = create.clamp(minValue, preferred, maxValue);
    expect(serialize(result)).toBe("clamp(min(100px,20%),50%,max(500px,80%))");
  });

  await t.step("math function in calc product with division", () => {
    const clampValue = create.clamp(
      create.calcValue.dimension(16, "px"),
      create.calcValue.dimension(20, "px"),
      create.calcValue.dimension(24, "px"),
    );
    const product = create.calcProduct(clampValue, [
      "/",
      create.calcValue.number(2),
    ]);
    const result = create.calc(product);
    expect(serialize(result)).toBe("calc(clamp(16px,20px,24px)/2)");
  });

  await t.step("complex expression with multiple math functions", () => {
    const min1 = create.min(
      create.calcValue.dimension(100, "vw"),
      create.calcValue.dimension(1200, "px"),
    );
    const max1 = create.max(
      create.calcValue.dimension(320, "px"),
      create.calcValue.percentage(20),
    );
    const sum = create.clacSum(min1, ["-", max1]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(min(100vw,1200px) - max(320px,20%))");
  });
});

Deno.test("var as CalcValue", async (t) => {
  await t.step("var inside calc sum", () => {
    const varValue = create.calcValue.var("--gap");
    const sum = create.clacSum(varValue, [
      "+",
      create.calcValue.dimension(4, "px"),
    ]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(var(--gap) + 4px)");
  });

  await t.step("var with fallback inside calc sum", () => {
    const fallback = create.clacSum(create.calcValue.dimension(8, "px"), [
      "+",
      create.calcValue.number(2),
    ]);
    const varValue = create.calcValue.var("--padding", fallback);
    const sum = create.clacSum(varValue, [
      "-",
      create.calcValue.dimension(1, "px"),
    ]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe("calc(var(--padding,8px + 2) - 1px)");
  });

  await t.step("var inside calc product", () => {
    const varValue = create.calcValue.var("--scale");
    const product = create.calcProduct(varValue, [
      "*",
      create.calcValue.number(1.25),
    ]);
    const result = create.calc(product);
    expect(serialize(result)).toBe("calc(var(--scale)*1.25)");
  });

  await t.step("var inside min and max", () => {
    const minValue = create.min(
      create.calcValue.var("--min"),
      create.calcValue.dimension(12, "px"),
    );
    const maxValue = create.max(
      create.calcValue.var("--max"),
      create.calcValue.percentage(80),
    );
    const sum = create.clacSum(minValue, ["+", maxValue]);
    const result = create.calc(sum);
    expect(serialize(result)).toBe(
      "calc(min(var(--min),12px) + max(var(--max),80%))",
    );
  });

  await t.step("var inside clamp", () => {
    const minValue = create.calcValue.var("--min");
    const preferred = create.calcValue.var(
      "--preferred",
      create.calcValue.dimension(16, "px"),
    );
    const maxValue = create.calcValue.var("--max");
    const result = create.clamp(minValue, preferred, maxValue);
    expect(serialize(result)).toBe(
      "clamp(var(--min),var(--preferred,16px),var(--max))",
    );
  });
});

Deno.test("serialize", async (t) => {
  await t.step("handles very complex ast", () => {
    const innerCalc = create.clacSum(create.calcValue.percentage(100), [
      "-",
      create.calcValue.dimension(20, "px"),
    ]);
    const product = create.calcProduct(create.calcValue.group(innerCalc), [
      "/",
      create.calcValue.number(2),
    ]);
    const gapFallback = create.clacSum(create.calcValue.dimension(4, "px"), [
      "+",
      create.calcValue.number(6),
    ]);
    const minValue = create.min(
      create.calcValue.var("--gap", gapFallback),
      create.calcValue.dimension(8, "px"),
    );
    const maxValue = create.max(
      create.calcValue.dimension(2, "rem"),
      create.calcValue.var("--max", create.calcValue.percentage(25)),
    );
    const sum = create.clacSum(product, ["+", minValue], ["-", maxValue]);
    const calc = create.calc(sum);
    const scaled = create.calcProduct(calc, [
      "/",
      create.calcValue.var("--scale", create.calcValue.number(2)),
    ]);
    const full = create.clacSum(create.calcValue.number(1), ["+", scaled]);

    expect(serialize(full)).toBe(
      "1 + calc((100% - 20px)/2 + min(var(--gap,4px + 6),8px) - max(2rem,var(--max,25%)))/var(--scale,2)",
    );
  });
});
