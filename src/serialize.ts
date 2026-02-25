/**
 * @module serialize
 *
 * Serialization of CSS AST nodes to strings.
 *
 * This module provides utility functions for converting Abstract Syntax Tree (AST) nodes
 * back into valid CSS strings. The serializer traverses the AST structure and concatenates
 * the string values of all nodes, preserving the correct CSS syntax.
 *
 * ## Usage
 *
 * ```ts
 * import { add, multiply, serialize } from "@dldc/css-builder";
 *
 * const expr = add("100px", multiply(2, "20px"));
 * const css = serialize(expr); // "calc(100px + 2 * 20px)"
 * ```
 */

export type AnyAstNodeValue = AnyAstNode | null | readonly AnyAstNodeValue[];
export interface AnyAstNode {
  readonly kind: string;
  readonly value: string | readonly AnyAstNodeValue[];
}

export function serialize(node: AnyAstNode): string {
  let output = "";
  const stack: AnyAstNodeValue[] = [node];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i -= 1) {
        stack.push(current[i]);
      }
      continue;
    }
    // Need to assert the type here since TypeScript can't infer it from the previous checks
    const currentNode = current as AnyAstNode;
    if (typeof currentNode.value === "string") {
      output += currentNode.value;
      continue;
    }
    const value = currentNode.value as readonly AnyAstNodeValue[];
    for (let i = value.length - 1; i >= 0; i -= 1) {
      stack.push(value[i]);
    }
  }

  return output;
}
