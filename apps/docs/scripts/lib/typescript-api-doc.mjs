import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const MAX_TYPE_LENGTH = 180;

export function escapeMdxCell(value) {
  return String(value)
    .replace(/</g, "&lt;")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

export function escapeMdxText(value) {
  return String(value)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

export function createApiDocProgram(configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.formatDiagnostic(configFile.error, ts.createCompilerHost({})));
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  if (parsed.errors.length > 0) {
    const host = ts.createCompilerHost(parsed.options);
    throw new Error(ts.formatDiagnostics(parsed.errors, host));
  }

  return ts.createProgram(parsed.fileNames, parsed.options);
}

export function formatType(checker, type) {
  const text = checker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation |
      ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
      ts.TypeFormatFlags.InTypeAlias,
  );

  if (text.length <= MAX_TYPE_LENGTH) {
    return text;
  }

  return `${text.slice(0, MAX_TYPE_LENGTH - 1)}…`;
}

export function getJsDocComment(symbol, checker) {
  const comments = symbol.getDocumentationComment?.(checker) ?? [];
  if (comments.length === 0) {
    return "";
  }

  return comments
    .map((part) => part.text)
    .join("")
    .trim()
    .replace(/\s+/g, " ");
}

function getSymbolDisplayName(symbol) {
  return symbol.getName() === "default" ? "default" : symbol.getName();
}

function isExportableSymbol(symbol) {
  const name = getSymbolDisplayName(symbol);
  return name !== "__type" && !name.startsWith("__");
}

function getInterfaceMembers(checker, type) {
  return checker.getPropertiesOfType(type).map((prop) => {
    const declaration = prop.valueDeclaration ?? prop.declarations?.[0];
    const propType = declaration
      ? checker.getTypeOfSymbolAtLocation(prop, declaration)
      : checker.getTypeOfSymbolAtLocation(prop, prop.declarations[0]);
    const optional = Boolean(prop.flags & ts.SymbolFlags.Optional);
    return {
      name: prop.getName(),
      type: formatType(checker, propType),
      docs: getJsDocComment(prop, checker),
      optional,
    };
  });
}

function getCallSignatures(checker, type) {
  return type.getCallSignatures().map((signature) => {
    const params = signature.getParameters().map((param) => {
      const paramDecl = param.valueDeclaration;
      const paramType = paramDecl
        ? checker.getTypeOfSymbolAtLocation(param, paramDecl)
        : checker.getAnyType();
      const optional = Boolean(param.flags & ts.SymbolFlags.Optional);
      const rest = Boolean(param.flags & ts.SymbolFlags.MethodExcludes && paramDecl?.dotDotDotToken);
      return {
        name: param.getName(),
        type: formatType(checker, paramType),
        optional,
        rest,
      };
    });

    return {
      params,
      returnType: formatType(checker, checker.getReturnTypeOfSignature(signature)),
      docs: signature.getDocumentationComment
        ? signature.getDocumentationComment(checker).map((p) => p.text).join("").trim()
        : "",
    };
  });
}

function getComponentPropsType(checker, classType) {
  const symbol = classType.getSymbol();
  if (!symbol) {
    return null;
  }

  const declarations = symbol.getDeclarations() ?? [];
  const classDecl = declarations.find((decl) => ts.isClassDeclaration(decl));
  if (!classDecl?.heritageClauses) {
    return null;
  }

  for (const heritage of classDecl.heritageClauses) {
    for (const typeNode of heritage.types) {
      const heritageType = checker.getTypeAtLocation(typeNode);
      const typeArgs = heritageType.aliasTypeArguments ?? [];
      if (typeArgs.length > 0) {
        return typeArgs[0];
      }

      const baseSymbol = heritageType.getSymbol();
      if (baseSymbol?.getName() === "Component" && typeNode.typeArguments?.[0]) {
        return checker.getTypeAtLocation(typeNode.typeArguments[0]);
      }
    }
  }

  return null;
}

function renderMemberTable(members, { nameHeader = "Member", includeDocs = true } = {}) {
  if (members.length === 0) {
    return "_No members._\n";
  }

  const header = includeDocs
    ? `| ${nameHeader} | Type | Description |\n| --- | --- | --- |`
    : `| ${nameHeader} | Type |\n| --- | --- |`;

  const rows = members.map((member) => {
    const label = member.optional ? `${member.name}?` : member.name;
    if (includeDocs) {
      return `| \`${escapeMdxCell(label)}\` | \`${escapeMdxCell(member.type)}\` | ${escapeMdxText(member.docs || "—")} |`;
    }
    return `| \`${escapeMdxCell(label)}\` | \`${escapeMdxCell(member.type)}\` |`;
  });

  return `${header}\n${rows.join("\n")}\n`;
}

function renderFunctionSection(name, signatures) {
  if (signatures.length === 0) {
    return "";
  }

  const signature = signatures[0];
  const params = signature.params
    .map((param) => {
      const prefix = param.rest ? "..." : "";
      const optional = param.optional ? "?" : "";
      return `${prefix}${param.name}${optional}: ${param.type}`;
    })
    .join(", ");

  const docs = signature.docs ? `\n\n${escapeMdxText(signature.docs)}` : "";

  return `### \`${name}(${escapeMdxCell(params)})\`

Returns \`${escapeMdxCell(signature.returnType)}\`.${docs}

`;
}

function describeExport(checker, symbol) {
  const name = getSymbolDisplayName(symbol);
  const declarations = symbol.getDeclarations() ?? [];
  const declaration = declarations[0];
  if (!declaration) {
    return null;
  }

  let type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  if (symbol.flags & ts.SymbolFlags.Interface) {
    type = checker.getDeclaredTypeOfSymbol(symbol);
  }
  const docs = getJsDocComment(symbol, checker);

  if (ts.isClassDeclaration(declaration) || symbol.getName() === "ChartUI") {
    const propsType = getComponentPropsType(checker, type);
    if (propsType) {
      return {
        kind: "component",
        name: name === "default" ? "ChartUI" : name,
        docs,
        members: getInterfaceMembers(checker, propsType),
      };
    }
  }

  if (type.isClassOrInterface?.() || (symbol.flags & ts.SymbolFlags.Interface)) {
    const members = getInterfaceMembers(checker, type);
    if (members.length > 0) {
      return { kind: "interface", name, docs, members };
    }
  }

  const callSignatures = getCallSignatures(checker, type);
  if (callSignatures.length > 0) {
    return { kind: "function", name, docs, signatures: callSignatures };
  }

  if (symbol.flags & ts.SymbolFlags.TypeAlias) {
    const aliasType = checker.getDeclaredTypeOfSymbol(symbol);
    const isSimpleAlias =
      (aliasType.flags & ts.TypeFlags.Union) !== 0 ||
      (aliasType.flags & ts.TypeFlags.StringLiteral) !== 0 ||
      (aliasType.flags & ts.TypeFlags.NumberLiteral) !== 0;
    const members = isSimpleAlias ? [] : getInterfaceMembers(checker, aliasType);
    return {
      kind: "type",
      name,
      docs,
      type: formatType(checker, aliasType),
      members,
    };
  }

  if (symbol.flags & ts.SymbolFlags.Interface) {
    return {
      kind: "interface",
      name,
      docs,
      members: getInterfaceMembers(checker, checker.getDeclaredTypeOfSymbol(symbol)),
    };
  }

  return {
    kind: "value",
    name,
    docs,
    type: formatType(checker, checker.getTypeOfSymbolAtLocation(symbol, declaration)),
  };
}

export function getExportDocumentation(program, moduleFilePath) {
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(moduleFilePath);
  if (!sourceFile) {
    throw new Error(`Source file not found: ${moduleFilePath}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return [];
  }

  const exports = checker.getExportsOfModule(moduleSymbol);
  const docs = [];

  for (const symbol of exports) {
    if (!isExportableSymbol(symbol)) {
      continue;
    }

    const aliased =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;

    const described = describeExport(checker, aliased);
    if (described) {
      docs.push(described);
    }
  }

  return docs.sort((a, b) => a.name.localeCompare(b.name));
}

export function getInterfaceDocumentation(program, interfaceFilePath, interfaceName) {
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(interfaceFilePath);
  if (!sourceFile) {
    throw new Error(`Source file not found: ${interfaceFilePath}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error(`No module symbol for ${interfaceFilePath}`);
  }

  const symbol = checker.getExportsOfModule(moduleSymbol).find((item) => item.getName() === interfaceName);
  if (!symbol) {
    throw new Error(`${interfaceName} export not found in ${interfaceFilePath}`);
  }

  const type = checker.getDeclaredTypeOfSymbol(symbol);

  return {
    kind: "interface",
    name: interfaceName,
    docs: getJsDocComment(symbol, checker),
    members: getInterfaceMembers(checker, type),
  };
}

export function renderGeneratedApiMdx({
  packageLabel,
  sourceLabel,
  generatedAt,
  exports,
  intro,
}) {
  const sections = [
    `{/* Auto-generated by scripts/generate-api-reference.mjs — do not edit by hand. */}`,
    ``,
    `## Full API (generated from TypeScript)`,
    ``,
    intro ??
      `This reference is generated from \`${sourceLabel}\` on **${generatedAt}**. Curated sections above explain tasks; use this when you need the exact public contract.`,
    ``,
  ];

  for (const item of exports) {
    if (item.kind === "component") {
      sections.push(`### \`${item.name}\` props`, ``);
      if (item.docs) {
        sections.push(escapeMdxText(item.docs), ``);
      }
      sections.push(renderMemberTable(item.members, { nameHeader: "Prop" }), ``);
      continue;
    }

    if (item.kind === "interface" || (item.kind === "type" && item.members?.length > 0)) {
      sections.push(`### \`${item.name}\``, ``);
      if (item.docs) {
        sections.push(escapeMdxText(item.docs), ``);
      }
      if (item.type) {
        sections.push(`Type: \`${escapeMdxCell(item.type)}\``, ``);
      }
      sections.push(renderMemberTable(item.members), ``);
      continue;
    }

    if (item.kind === "function") {
      sections.push(renderFunctionSection(item.name, item.signatures));
      continue;
    }

    sections.push(`### \`${item.name}\``, ``);
    if (item.docs) {
      sections.push(escapeMdxText(item.docs), ``);
    }
    sections.push(`Type: \`${escapeMdxCell(item.type)}\``, ``);
  }

  return `${sections.join("\n")}\n`;
}

export function writeGeneratedMdx(outputPath, content) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
}
