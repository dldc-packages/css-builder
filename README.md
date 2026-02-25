# @dldc/css-builder

> A utility for building CSS expressions like `calc`, `clamp`, etc.

## Installation

```bash
deno add @dldc/css-builder
```

## Usage

This library provides builder functions to construct CSS math expressions and a
`serialize` function to convert them to CSS strings.

```typescript
import { add, clamp, multiply, serialize } from "@dldc/css-builder";

// Build a calc expression
const result = add("10px", multiply(2, "5px"));
serialize(result); // "calc(10px + 2*5px)"

// Build a clamp expression
const responsive = clamp("10px", "5vw", "100px");
serialize(responsive); // "clamp(10px,5vw,100px)"
```

## API

### Builder Functions

All builder functions accept numbers, strings (like `"10px"`, `"50%"`,
`"var(--size)"`), or other expressions.

#### `add(...values)`

Creates a `calc()` addition expression.

```typescript
serialize(add(10, 20, 30)); // "calc(10 + 20 + 30)"
serialize(add("10px", "2rem")); // "calc(10px + 2rem)"
```

#### `substract(...values)`

Creates a `calc()` subtraction expression.

```typescript
serialize(substract(100, 20, 10)); // "calc(100 - 20 - 10)"
serialize(substract("100%", "20px")); // "calc(100% - 20px)"
```

#### `multiply(...values)`

Creates a `calc()` multiplication expression.

```typescript
serialize(multiply(2, 3, 4)); // "calc(2*3*4)"
serialize(multiply("10px", 2)); // "calc(10px*2)"
```

#### `divide(...values)`

Creates a `calc()` division expression.

```typescript
serialize(divide(100, 2, 5)); // "calc(100/2/5)"
serialize(divide("100%", 3)); // "calc(100%/3)"
```

#### `min(...values)`

Creates a `min()` expression.

```typescript
serialize(min(10, "20px", "50%")); // "min(10,20px,50%)"
```

#### `max(...values)`

Creates a `max()` expression.

```typescript
serialize(max(10, "20px", "50%")); // "max(10,20px,50%)"
```

#### `clamp(min, preferred, max)`

Creates a `clamp()` expression. Use `"none"` for unbounded min or max.

```typescript
serialize(clamp(10, "50%", "100px")); // "clamp(10,50%,100px)"
serialize(clamp("none", "50%", "none")); // "clamp(none,50%,none)"
```

#### `exp(value)`

Creates an `exp()` expression.

```typescript
serialize(exp(2)); // "exp(2)"
serialize(exp("2.5")); // "exp(2.5)"
```

#### `round(...)`

Creates a `round()` expression. You can pass a rounding strategy as the first
argument or omit it to use the default `nearest` strategy.

```typescript
serialize(round(null, "var(--width)", "50px")); // "round(var(--width),50px)"
serialize(round("up", "101px", "var(--interval)")); // "round(up,101px,var(--interval))"
serialize(round("down", "10.5px")); // "round(down,10.5px)"
```

Convenience helpers are also available:

```typescript
serialize(roundNearest("2.4px", "1px")); // "round(nearest,2.4px,1px)"
serialize(roundUp("101px", "5px")); // "round(up,101px,5px)"
serialize(roundDown("var(--height)", "8px")); // "round(down,var(--height),8px)"
serialize(roundToZero("-105px", 10)); // "round(to-zero,-105px,10)"
```

### Composing Expressions

Builder functions can be composed together:

```typescript
const result = add("10px", multiply(2, "5vw"), clamp(0, "20%", "50px"));
serialize(result);
// "calc(10px + 2*5vw + clamp(0,20%,50px))"
```

### `serialize(expression)`

Converts an expression to a CSS string.

```typescript
const expr = multiply(add(10, 20), 2);
const css = serialize(expr); // "calc((10 + 20)*2)"
```
