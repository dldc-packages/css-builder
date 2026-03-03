import { expect } from "@std/expect";

import * as builder from "../src/builder.ts";
import * as create from "../src/create.ts";
import { serialize } from "../src/serialize.ts";

Deno.test("add", async (t) => {
  await t.step("throws with no items", () => {
    expect(() => builder.add()).toThrow("Expected at least one item.");
  });

  await t.step("adds numbers", () => {
    const result = builder.add(1, 2, 3);
    expect(serialize(result!)).toBe("calc(1 + 2 + 3)");
  });

  await t.step("adds dimensions with mixed sources", () => {
    const sum = create.calcSum(create.calcValue.dimension(10, "px"), [
      "+",
      create.calcValue.number(2),
    ]);
    const result = builder.add("5px", sum, create.calcValue.dimension(3, "px"));
    expect(serialize(result!)).toBe("calc(5px + 10px + 2 + 3px)");
  });

  await t.step("merges calc sum operands", () => {
    const sum = create.calcSum(
      create.calcValue.number(1),
      ["+", create.calcValue.number(2)],
      ["-", create.calcValue.number(3)],
    );
    const result = builder.add(sum, 4);
    expect(serialize(result!)).toBe("calc(1 + 2 - 3 + 4)");
  });

  await t.step("unwraps calc", () => {
    const inner = create.calc(
      create.calcSum(create.calcValue.number(1), [
        "+",
        create.calcValue.number(2),
      ]),
    );
    const result = builder.add(inner, 3);
    expect(serialize(result!)).toBe("calc(1 + 2 + 3)");
  });
});

Deno.test("subtract", async (t) => {
  await t.step("throws with no items", () => {
    expect(() => builder.subtract()).toThrow("Expected at least one item.");
  });

  await t.step("subtracts numbers", () => {
    const result = builder.subtract(10, 2, 3);
    expect(serialize(result!)).toBe("calc(10 - 2 - 3)");
  });

  await t.step("merges calc sum operands with subtraction", () => {
    const sum = create.calcSum(
      create.calcValue.number(5),
      ["+", create.calcValue.number(2)],
      ["-", create.calcValue.number(1)],
    );
    const result = builder.subtract(10, sum);
    expect(serialize(result!)).toBe("calc(10 - 5 - 2 + 1)");
  });

  await t.step("unwraps calc", () => {
    const inner = create.calc(
      create.calcSum(create.calcValue.number(7), [
        "-",
        create.calcValue.number(2),
      ]),
    );
    const result = builder.subtract(inner, 1);
    expect(serialize(result!)).toBe("calc(7 - 2 - 1)");
  });
});

Deno.test("multiply", async (t) => {
  await t.step("throws with no items", () => {
    expect(() => builder.multiply()).toThrow("Expected at least one item.");
  });

  await t.step("multiplies numbers", () => {
    const result = builder.multiply(2, 3, 4);
    expect(serialize(result!)).toBe("calc(2*3*4)");
  });

  await t.step("merges calc product operands", () => {
    const product = create.calcProduct(
      create.calcValue.number(2),
      ["*", create.calcValue.number(3)],
      ["/", create.calcValue.number(4)],
    );
    const result = builder.multiply(product, 5);
    expect(serialize(result!)).toBe("calc(2*3/4*5)");
  });

  await t.step("wraps calc sum in group", () => {
    const sum = create.calcSum(create.calcValue.number(10), [
      "+",
      create.calcValue.number(2),
    ]);
    const result = builder.multiply(sum, 2);
    expect(serialize(result!)).toBe("calc((10 + 2)*2)");
  });

  await t.step("unwraps calc", () => {
    const inner = create.calc(
      create.calcProduct(create.calcValue.number(6), [
        "*",
        create.calcValue.number(2),
      ]),
    );
    const result = builder.multiply(inner, 3);
    expect(serialize(result!)).toBe("calc(6*2*3)");
  });
});

Deno.test("divide", async (t) => {
  await t.step("throws with no items", () => {
    expect(() => builder.divide()).toThrow("Expected at least one item.");
  });

  await t.step("divides numbers", () => {
    const result = builder.divide(100, 2, 5);
    expect(serialize(result!)).toBe("calc(100/2/5)");
  });

  await t.step("merges calc product operands", () => {
    const product = create.calcProduct(create.calcValue.number(8), [
      "/",
      create.calcValue.number(2),
    ]);
    const result = builder.divide(product, 4);
    expect(serialize(result!)).toBe("calc(8/2/4)");
  });

  await t.step("wraps calc sum in group", () => {
    const sum = create.calcSum(create.calcValue.number(9), [
      "-",
      create.calcValue.number(3),
    ]);
    const result = builder.divide(sum, 3);
    expect(serialize(result!)).toBe("calc((9 - 3)/3)");
  });

  await t.step("preserves parentheses when dividing by division", () => {
    // 8 / (4 / 2) = 8 / 2 = 4
    // but 8 / 4 / 2 = 2 / 2 = 1
    const result = builder.divide(8, builder.divide(4, 2));
    expect(serialize(result!)).toBe("calc(8/(4/2))");
  });

  await t.step("preserves parentheses when dividing by multiplication", () => {
    // 8 / (2 * 2) = 8 / 4 = 2
    // but 8 / 2 * 2 = 4 * 2 = 8
    const result = builder.divide(8, builder.multiply(2, 2));
    expect(serialize(result!)).toBe("calc(8/(2*2))");
  });

  await t.step("preserves parentheses when multiplying by division", () => {
    // 8 * (4 / 2) = 8 * 2 = 16
    // but 8 * 4 / 2 = 32 / 2 = 16 (this actually works out the same)
    // However: 2 / (4 / 2) = 2 / 2 = 1
    // while 2 / 4 / 2 = 0.5 / 2 = 0.25
    const result = builder.multiply(8, builder.divide(4, 2));
    expect(serialize(result!)).toBe("calc(8*(4/2))");
  });

  await t.step("deeply nested divisions preserve all parentheses", () => {
    // 64 / (8 / (4 / 2)) = 64 / (8 / 2) = 64 / 4 = 16
    // but 64 / 8 / 4 / 2 = 8 / 4 / 2 = 2 / 2 = 1
    const result = builder.divide(64, builder.divide(8, builder.divide(4, 2)));
    expect(serialize(result!)).toBe("calc(64/(8/(4/2)))");
  });

  await t.step("mixed multiply and divide with deep nesting", () => {
    // 100 / (10 * (5 / 2)) = 100 / (10 * 2.5) = 100 / 25 = 4
    // but 100 / 10 * 5 / 2 = 10 * 5 / 2 = 50 / 2 = 25
    const result = builder.divide(
      100,
      builder.multiply(10, builder.divide(5, 2)),
    );
    expect(serialize(result!)).toBe("calc(100/(10*(5/2)))");
  });

  await t.step("complex nested operations with addition", () => {
    // (10 + 20) / ((4 + 2) / 2) = 30 / (6 / 2) = 30 / 3 = 10
    // but (10 + 20) / (4 + 2) / 2 = 30 / 6 / 2 = 5 / 2 = 2.5
    const result = builder.divide(
      builder.add(10, 20),
      builder.divide(builder.add(4, 2), 2),
    );
    expect(serialize(result!)).toBe("calc((10 + 20)/((4 + 2)/2))");
  });

  await t.step("multiple nested divisions as divisors", () => {
    // 1000 / (100 / 10) / (20 / 5) = 1000 / 10 / 4 = 100 / 4 = 25
    // This should preserve both groups
    const result = builder.divide(
      1000,
      builder.divide(100, 10),
      builder.divide(20, 5),
    );
    expect(serialize(result!)).toBe("calc(1000/(100/10)/(20/5))");
  });

  await t.step("multiply with multiple nested divisions", () => {
    // 2 * (12 / 3) * (8 / 4) = 2 * 4 * 2 = 16
    const result = builder.multiply(
      2,
      builder.divide(12, 3),
      builder.divide(8, 4),
    );
    expect(serialize(result!)).toBe("calc(2*(12/3)*(8/4))");
  });

  await t.step("nested operations with mixed add/multiply/divide", () => {
    // ((2 + 3) * 4) / ((10 - 2) / 2) = (5 * 4) / (8 / 2) = 20 / 4 = 5
    const result = builder.divide(
      builder.multiply(builder.add(2, 3), 4),
      builder.divide(builder.subtract(10, 2), 2),
    );
    expect(serialize(result!)).toBe("calc((2 + 3)*4/((10 - 2)/2))");
  });

  await t.step("quadruple nested division", () => {
    // 256 / (64 / (16 / (8 / 2))) = 256 / (64 / (16 / 4)) = 256 / (64 / 4) = 256 / 16 = 16
    const innermost = builder.divide(8, 2);
    const inner = builder.divide(16, innermost);
    const outer = builder.divide(64, inner);
    const result = builder.divide(256, outer);
    expect(serialize(result!)).toBe("calc(256/(64/(16/(8/2))))");
  });

  await t.step("division chain starting with division", () => {
    // (100 / 5) / (10 / 2) = 20 / 5 = 4
    // First division should flatten, second should preserve parens
    const result = builder.divide(
      builder.divide(100, 5),
      builder.divide(10, 2),
    );
    expect(serialize(result!)).toBe("calc(100/5/(10/2))");
  });
});

Deno.test("min", async (t) => {
  await t.step("throws with no items", () => {
    expect(() => builder.min()).toThrow("Expected at least one item.");
  });

  await t.step("accepts numbers and strings", () => {
    const result = builder.min(10, "20px", "50%");
    expect(serialize(result!)).toBe("min(10,20px,50%)");
  });

  await t.step("unwraps calc", () => {
    const calc = create.calc(
      create.calcSum(create.calcValue.number(5), [
        "+",
        create.calcValue.number(1),
      ]),
    );
    const result = builder.min(calc, 2);
    expect(serialize(result!)).toBe("min(5 + 1,2)");
  });
});

Deno.test("max", async (t) => {
  await t.step("throws with no items", () => {
    expect(() => builder.max()).toThrow("Expected at least one item.");
  });

  await t.step("accepts numbers and strings", () => {
    const result = builder.max(10, "20px", "50%");
    expect(serialize(result!)).toBe("max(10,20px,50%)");
  });

  await t.step("unwraps calc", () => {
    const calc = create.calc(
      create.calcSum(create.calcValue.number(5), [
        "-",
        create.calcValue.number(1),
      ]),
    );
    const result = builder.max(calc, 2);
    expect(serialize(result!)).toBe("max(5 - 1,2)");
  });
});

Deno.test("clamp", async (t) => {
  await t.step("supports numbers and strings", () => {
    const result = builder.clamp(10, "50%", "100px");
    expect(serialize(result!)).toBe("clamp(10,50%,100px)");
  });

  await t.step("supports none keywords", () => {
    const result = builder.clamp("none", "50%", "none");
    expect(serialize(result!)).toBe("clamp(none,50%,none)");
  });

  await t.step("unwraps calc", () => {
    const minCalc = create.calc(
      create.calcSum(create.calcValue.number(5), [
        "+",
        create.calcValue.number(1),
      ]),
    );
    const maxCalc = create.calc(
      create.calcSum(create.calcValue.number(10), [
        "-",
        create.calcValue.number(2),
      ]),
    );
    const result = builder.clamp(minCalc, 7, maxCalc);
    expect(serialize(result!)).toBe("clamp(5 + 1,7,10 - 2)");
  });
});

Deno.test("exp", async (t) => {
  await t.step("wraps numbers and strings", () => {
    const result = builder.exp("2.5");
    expect(serialize(result!)).toBe("exp(2.5)");
  });

  await t.step("unwraps calc", () => {
    const calc = create.calc(
      create.calcSum(create.calcValue.number(2), [
        "+",
        create.calcValue.number(1),
      ]),
    );
    const result = builder.exp(calc);
    expect(serialize(result!)).toBe("exp(2 + 1)");
  });
});

Deno.test("pow", async (t) => {
  await t.step("creates pow with numbers", () => {
    const result = builder.pow(2, 3);
    expect(serialize(result)).toBe("pow(2,3)");
  });

  await t.step("creates pow with strings", () => {
    const result = builder.pow("var(--base)", "2");
    expect(serialize(result)).toBe("pow(var(--base),2)");
  });

  await t.step("creates pow with dimensions", () => {
    const result = builder.pow("10px", "2");
    expect(serialize(result)).toBe("pow(10px,2)");
  });

  await t.step("unwraps calc values", () => {
    const calcBase = create.calc(
      create.calcSum(create.calcValue.number(2), [
        "+",
        create.calcValue.number(1),
      ]),
    );
    const calcExponent = create.calc(
      create.calcSum(create.calcValue.number(3), [
        "-",
        create.calcValue.number(1),
      ]),
    );
    const result = builder.pow(calcBase, calcExponent);
    expect(serialize(result)).toBe("pow(2 + 1,3 - 1)");
  });
});

Deno.test("round", async (t) => {
  await t.step("throws for missing value", () => {
    expect(() => builder.round(null, undefined as never)).toThrow(
      "Expected at least one item.",
    );
  });

  await t.step("rounds with default strategy", () => {
    const result = builder.round(null, "var(--width)", "50px");
    expect(serialize(result)).toBe("round(var(--width),50px)");
  });

  await t.step("rounds with explicit strategy", () => {
    const result = builder.round("up", "101px", "var(--interval)");
    expect(serialize(result)).toBe("round(up,101px,var(--interval))");
  });

  await t.step("rounds with to-zero strategy", () => {
    const result = builder.roundToZero("-105px", 10);
    expect(serialize(result)).toBe("round(to-zero,-105px,10)");
  });

  await t.step("unwraps calc values", () => {
    const calcValue = create.calc(
      create.calcSum(create.calcValue.number(2), [
        "+",
        create.calcValue.number(1),
      ]),
    );
    const calcInterval = create.calc(
      create.calcSum(create.calcValue.number(3), [
        "-",
        create.calcValue.number(1),
      ]),
    );
    const result = builder.round("nearest", calcValue, calcInterval);
    expect(serialize(result)).toBe("round(nearest,2 + 1,3 - 1)");
  });
});

Deno.test("value", async (t) => {
  await t.step("parses number strings", () => {
    expect(serialize(builder.value("12.5"))).toBe("12.5");
  });

  await t.step("parses percentages", () => {
    expect(serialize(builder.value("50%"))).toBe("50%");
  });

  await t.step("parses dimensions", () => {
    expect(serialize(builder.value("10px"))).toBe("10px");
  });

  await t.step("keeps raw values", () => {
    expect(serialize(builder.value("var(--size)"))).toBe("var(--size)");
  });
});
