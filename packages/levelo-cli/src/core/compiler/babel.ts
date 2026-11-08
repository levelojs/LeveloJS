import * as babel from "@babel/core";
import type { NodePath } from "@babel/core";
import * as t from "@babel/types";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import transformTypescript from "@babel/plugin-transform-typescript";

function isEventProp(name: string): boolean {
  return /^on[A-Z]/.test(name) || /^on[a-z]/.test(name);
}

function leveloTransformer({ types }: { types: typeof t }) {
  return {
    name: "levelojs-jsx-transformer",
    visitor: {
      Program: {
        enter(path: NodePath<t.Program>) {
          const hasHImport = path.node.body.some(
            (node) =>
              types.isImportDeclaration(node) &&
              node.source.value === "levelojs" &&
              node.specifiers.some(
                (specifier) =>
                  types.isImportSpecifier(specifier) &&
                  types.isIdentifier(specifier.imported) &&
                  specifier.imported.name === "h"
              )
          );

          if (!hasHImport) {
            path.unshiftContainer(
              "body",
              types.importDeclaration(
                [types.importSpecifier(types.identifier("h"), types.identifier("h"))],
                types.stringLiteral("levelojs")
              )
            );
          }
        },
      },

      JSXElement: {
        exit(path: NodePath<t.JSXElement>) {
          const openingElement = path.node.openingElement;
          const tagName = (openingElement.name as t.JSXIdentifier).name;

          const isSvg = tagName === "svg";
          const isMath = tagName === "math";
          const isComponent = tagName[0] === tagName[0].toUpperCase();
          const factoryIdentifier = isComponent
            ? types.identifier(tagName)
            : types.stringLiteral(tagName);

          const properties: (t.ObjectProperty | t.ObjectMethod)[] = [];

          openingElement.attributes.forEach((attr) => {
            if (!types.isJSXAttribute(attr)) return;

            const propName = attr.name.name as string;
            const propKey = types.identifier(propName);

            if (!attr.value) {
              properties.push(types.objectProperty(propKey, types.booleanLiteral(true)));
              return;
            }

            if (!types.isJSXExpressionContainer(attr.value)) {
              properties.push(types.objectProperty(propKey, attr.value as t.Expression));
              return;
            }

            const expression = attr.value.expression;
            if (types.isJSXEmptyExpression(expression)) return;

            if (isEventProp(propName)) {
              properties.push(types.objectProperty(propKey, expression as t.Expression));
              return;
            }

            properties.push(
              types.objectMethod(
                "get",
                propKey,
                [],
                types.blockStatement([types.returnStatement(expression as t.Expression)])
              )
            );
          });

          if (isSvg || isMath) {
            properties.push(
              types.objectProperty(
                types.identifier("__namespace"),
                types.stringLiteral(
                  isSvg ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1998/Math/MathML"
                )
              )
            );
          }

          const propsObject = types.objectExpression(properties);
          const children: t.Expression[] = [];

          path.node.children.forEach((child) => {
            if (types.isJSXText(child)) {
              const cleanText = child.value.trim();
              if (cleanText) children.push(types.stringLiteral(cleanText));
              return;
            }

            if (types.isJSXExpressionContainer(child)) {
              const expression = child.expression;
              if (!types.isJSXEmptyExpression(expression)) {
                children.push(types.arrowFunctionExpression([], expression as t.Expression));
              }
              return;
            }

            if (types.isExpression(child)) {
              children.push(child);
            }
          });

          const callExpression = types.callExpression(types.identifier("h"), [
            factoryIdentifier,
            propsObject,
            ...children,
          ]);

          path.replaceWith(callExpression);
        },
      },
    },
  };
}

export async function transformLeveloCode(code: string, id: string): Promise<string> {
  const isTsx = id.endsWith(".tsx");
  const plugins: any[] = [syntaxJsx];

  if (isTsx) {
    plugins.push([transformTypescript, { isTSX: true }]);
  }

  plugins.push(leveloTransformer);

  const result = await babel.transformAsync(code, {
    filename: id,
    plugins,
    configFile: false,
    babelrc: false,
  });

  return result?.code || "";
}