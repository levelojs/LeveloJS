import type { NodePath } from '@babel/core';
import * as babel from '@babel/core';
import syntaxJsx from '@babel/plugin-syntax-jsx';
import transformTypescript from '@babel/plugin-transform-typescript';
import type * as t from '@babel/types';

export type TargetPlatform = 'web' | 'native' | 'windows' | 'android';

// Always import from "levelojs".
// The bundler decides web vs native via package.json export conditions.
const JSX_IMPORT_PATH = 'levelojs';

function isEventProp(name: string): boolean {
  return /^on[A-Z]/.test(name) || /^on[a-z]/.test(name);
}

/**
 * Cleans JSX text the same way React does: whitespace is only removed around
 * line breaks, so text on the same line as an expression keeps its spaces.
 */
function cleanJSXText(text: string): string {
  const lines = text.split(/\r\n|\n|\r/);
  let lastNonEmptyLine = 0;

  for (let i = 0; i < lines.length; i++) {
    if (/[^ \t]/.test(lines[i])) lastNonEmptyLine = i;
  }

  let result = '';

  for (let i = 0; i < lines.length; i++) {
    const isFirstLine = i === 0;
    const isLastLine = i === lines.length - 1;
    const isLastNonEmptyLine = i === lastNonEmptyLine;

    let line = lines[i].replace(/\t/g, ' ');

    if (!isFirstLine) line = line.replace(/^ +/, '');
    if (!isLastLine) line = line.replace(/ +$/, '');

    if (line) {
      if (!isLastNonEmptyLine) line += ' ';
      result += line;
    }
  }

  return result;
}

// `platform` is kept for future platform-specific transforms
function leveloTransformer(_platform: TargetPlatform = 'web') {
  return ({ types }: { types: typeof t }) => {
    let hasJsx = false;

    function getTagName(node: t.JSXElement): string | null {
      const name = node.openingElement.name;
      return types.isJSXIdentifier(name) ? name.name : null;
    }

    /**
     * Finds the namespace of a JSX element by walking up its ancestors.
     * This runs on `exit`, so ancestors are still JSX elements. That makes it work
     * for static children and for elements created inside callbacks (.map, For).
     */
    function getNamespace(path: NodePath<t.JSXElement>): 'svg' | 'math' | null {
      let current: NodePath | null = path;

      while (current) {
        if (current.isJSXElement()) {
          const name = getTagName(current.node);

          if (name === 'svg') return 'svg';
          if (name === 'math') return 'math';

          // Children of <foreignObject> are HTML again (the element itself stays SVG).
          if (name === 'foreignObject' && current !== path) return null;
        }

        current = current.parentPath;
      }

      return null;
    }

    return {
      name: 'levelojs-jsx-transformer',
      visitor: {
        Program: {
          enter() {
            hasJsx = false;
          },
          exit(path: NodePath<t.Program>) {
            // Only inject 'h' if the file actually contains JSX elements
            if (!hasJsx) return;

            const hasHImport = path.node.body.some(
              (node) =>
                types.isImportDeclaration(node) &&
                node.source.value === JSX_IMPORT_PATH &&
                node.specifiers.some(
                  (specifier) =>
                    types.isImportSpecifier(specifier) &&
                    types.isIdentifier(specifier.imported) &&
                    specifier.imported.name === 'h',
                ),
            );

            if (!hasHImport) {
              path.unshiftContainer(
                'body',
                types.importDeclaration(
                  [types.importSpecifier(types.identifier('h'), types.identifier('h'))],
                  types.stringLiteral(JSX_IMPORT_PATH),
                ),
              );
            }
          },
        },

        JSXElement: {
          enter() {
            hasJsx = true;
          },
          exit(path: NodePath<t.JSXElement>) {
            const openingElement = path.node.openingElement;
            const tagName = (openingElement.name as t.JSXIdentifier).name;

            const namespace = getNamespace(path);
            const isComponent = tagName[0] === tagName[0].toUpperCase();
            const factoryIdentifier = isComponent
              ? types.identifier(tagName)
              : types.stringLiteral(tagName);

            const properties: (t.ObjectProperty | t.ObjectMethod)[] = [];

            openingElement.attributes.forEach((attr) => {
              if (!types.isJSXAttribute(attr)) return;

              const propName = types.isJSXNamespacedName(attr.name)
                ? `${attr.name.namespace.name}:${attr.name.name.name}`
                : attr.name.name;
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
                  'get',
                  propKey,
                  [],
                  types.blockStatement([types.returnStatement(expression as t.Expression)]),
                ),
              );
            });

            // Every DOM element inside <svg> or <math> needs the namespace,
            // including elements created inside callbacks such as .map() or For.
            if (namespace && !isComponent) {
              properties.push(
                types.objectProperty(
                  types.identifier('__namespace'),
                  types.stringLiteral(
                    namespace === 'svg'
                      ? 'http://www.w3.org/2000/svg'
                      : 'http://www.w3.org/1998/Math/MathML',
                  ),
                ),
              );
            }

            const propsObject = types.objectExpression(properties);
            const children: t.Expression[] = [];

            path.node.children.forEach((child) => {
              if (types.isJSXText(child)) {
                const cleanText = cleanJSXText(child.value);
                if (cleanText) children.push(types.stringLiteral(cleanText));
                return;
              }

              if (types.isJSXExpressionContainer(child)) {
                const expression = child.expression;

                if (!types.isJSXEmptyExpression(expression)) {
                  // Render callbacks like {(item, index) => <li />} are not reactive values.
                  // Pass them through untouched so components such as For get the real function.
                  if (
                    types.isArrowFunctionExpression(expression) ||
                    types.isFunctionExpression(expression)
                  ) {
                    children.push(expression);
                  } else {
                    children.push(types.arrowFunctionExpression([], expression as t.Expression));
                  }
                }

                return;
              }

              if (types.isExpression(child)) {
                children.push(child);
              }
            });

            const callExpression = types.callExpression(types.identifier('h'), [
              factoryIdentifier,
              propsObject,
              ...children,
            ]);

            path.replaceWith(callExpression);
          },
        },
      },
    };
  };
}

export async function transformLeveloCode(
  code: string,
  id: string,
  platform: TargetPlatform = 'web',
): Promise<string> {
  const isTsx = id.endsWith('.tsx');
  const isTs = id.endsWith('.ts');
  const plugins: any[] = [syntaxJsx];

  // Enable TypeScript transformation for both .ts and .tsx files
  if (isTs || isTsx) {
    plugins.push([transformTypescript, { isTSX: isTsx, allExtensions: true }]);
  }

  plugins.push(leveloTransformer(platform));

  const result = await babel.transformAsync(code, {
    filename: id,
    plugins,
    configFile: false,
    babelrc: false,
  });

  return result?.code || '';
}