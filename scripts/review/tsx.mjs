/**
 * Reads one TSX file with the TypeScript compiler API and returns the few facts the rules need.
 * Nothing here judges anything; the rules do that.
 */
import ts from "typescript";

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;

const dash = (prop) => prop.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/** The literal behind an attribute value, or null when it is an expression we cannot read. */
function literalOf(node) {
  if (!node) return true; // <Button disabled /> is disabled={true}
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node)) return node.expression ? literalOf(node.expression) : null;
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

const tagName = (node) => {
  const name = node.tagName;
  if (ts.isIdentifier(name)) return name.text;
  return name.getText ? name.getText() : String(name.escapedText ?? "");
};

/**
 * Facts about one TSX source.
 * @returns {{ imports: object[], localComponents: object[], elements: object[], tags: Set<string>, varUses: object[], text: string }}
 */
export function readTsx(code, filename = "file.tsx") {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lineOf = (pos) => source.getLineAndCharacterOfPosition(pos).line + 1;

  const imports = [];
  const localComponents = [];
  const elements = [];
  const tags = new Set();

  const readStyleObject = (expr) => {
    const decls = [];
    if (!expr || !ts.isObjectLiteralExpression(expr)) return decls;
    for (const prop of expr.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : null;
      if (!name) continue;
      const value = literalOf(prop.initializer);
      const text = prop.initializer.getText(source);
      decls.push({
        property: name.startsWith("--") ? name : dash(name),
        value: typeof value === "string" || typeof value === "number" ? String(value) : text,
        literal: typeof value === "string" || typeof value === "number",
        line: lineOf(prop.getStart(source)),
      });
    }
    return decls;
  };

  const readElement = (node) => {
    const tag = tagName(node);
    tags.add(tag);
    const attrs = [];
    const styles = [];
    for (const attr of node.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attr)) {
        attrs.push({ name: null, spread: true, line: lineOf(attr.getStart(source)) });
        continue;
      }
      const name = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText(source);
      const line = lineOf(attr.getStart(source));
      const value = literalOf(attr.initializer);
      const entry = {
        name,
        line,
        value,
        literal: value !== null,
        node: attr,
        text: attr.initializer ? attr.initializer.getText(source) : "",
      };
      attrs.push(entry);
      if (name === "style" && attr.initializer && ts.isJsxExpression(attr.initializer)) {
        styles.push(...readStyleObject(attr.initializer.expression));
      }
    }
    elements.push({ tag, line: lineOf(node.getStart(source)), attrs, styles, node, source });
  };

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const names = [];
      const clause = node.importClause;
      if (clause?.name) names.push({ local: clause.name.text, type: Boolean(clause.isTypeOnly) });
      if (clause?.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            names.push({ local: el.name.text, type: Boolean(clause.isTypeOnly || el.isTypeOnly) });
          }
        } else {
          names.push({ local: clause.namedBindings.name.text, type: Boolean(clause.isTypeOnly) });
        }
      }
      imports.push({
        module: node.moduleSpecifier.text,
        names,
        typeOnly: Boolean(clause?.isTypeOnly),
        line: lineOf(node.getStart(source)),
      });
    }

    if (ts.isFunctionDeclaration(node) && node.name && PASCAL.test(node.name.text)) {
      localComponents.push({ name: node.name.text, line: lineOf(node.name.getStart(source)) });
    }
    if (ts.isClassDeclaration(node) && node.name && PASCAL.test(node.name.text)) {
      localComponents.push({ name: node.name.text, line: lineOf(node.name.getStart(source)) });
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && PASCAL.test(node.name.text)) {
      const init = node.initializer;
      const isFn = init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init) || ts.isCallExpression(init));
      if (isFn) localComponents.push({ name: node.name.text, line: lineOf(node.name.getStart(source)) });
    }

    if (ts.isJsxSelfClosingElement(node)) readElement(node);
    if (ts.isJsxOpeningElement(node)) readElement(node);

    ts.forEachChild(node, visit);
  };

  visit(source);

  const varUses = [];
  for (const m of code.matchAll(/var\((--[a-z0-9-]+)/g)) {
    varUses.push({ name: m[1], line: code.slice(0, m.index).split("\n").length });
  }

  return { imports, localComponents, elements, tags, varUses, text: code, source };
}

/** The elements in a file whose tag is a kit piece, with the piece attached. */
export function kitElements(facts, lookup) {
  const out = [];
  for (const el of facts.elements) {
    const found = lookup(el.tag);
    if (found) out.push({ ...el, piece: found });
  }
  return out;
}

export { ts };
