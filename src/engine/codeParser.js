import { getLanguageInfo } from './themeColors';

/**
 * Parses raw code files into structured AST/city nodes with metrics and dependencies.
 */
export function analyzeCodebase(rawFiles) {
  const fileNodes = [];
  const pathToIdMap = new Map();
  const languagesCount = {};

  let totalLinesOfCode = 0;
  let totalComments = 0;
  let monolithCount = 0;

  // 1. First Pass: Compute File Metrics
  rawFiles.forEach((file, index) => {
    // Clean and normalize file path
    const normalizedPath = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const pathParts = normalizedPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const directory = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'root';
    const ext = fileName.split('.').pop().toLowerCase();

    // Skip ignored files/dirs
    if (
      normalizedPath.includes('node_modules/') ||
      normalizedPath.includes('.git/') ||
      normalizedPath.includes('dist/') ||
      normalizedPath.includes('build/') ||
      fileName.startsWith('.')
    ) {
      return;
    }

    const content = file.content || '';
    const lines = content.split('\n');
    const loc = lines.length;
    let commentLines = 0;
    let blankLines = 0;

    // Fast heuristic line counting
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) blankLines++;
      else if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*')
      ) {
        commentLines++;
      }
    });

    const codeLines = Math.max(1, loc - blankLines - commentLines);
    totalLinesOfCode += codeLines;
    totalComments += commentLines;

    // Cyclomatic complexity & function count approximations
    const functionMatches = content.match(/(function\s+[a-zA-Z0-9_]+|def\s+[a-zA-Z0-9_]+|class\s+[a-zA-Z0-9_]+|const\s+[a-zA-Z0-9_]+\s*=\s*(\(.*?\)|[a-zA-Z0-9_]+)\s*=>)/g);
    const functionsCount = functionMatches ? functionMatches.length : 0;

    const branchMatches = content.match(/\b(if|else if|for|while|switch|case|catch|&&|\|\||\?)\b/g);
    const complexityScore = 1 + (branchMatches ? Math.min(branchMatches.length, 50) : 0);

    const isMonolith = loc > 300 || complexityScore > 25;
    if (isMonolith) monolithCount++;

    const langInfo = getLanguageInfo(fileName);
    languagesCount[langInfo.name] = (languagesCount[langInfo.name] || 0) + 1;

    const id = `node-${index}`;
    pathToIdMap.set(normalizedPath, id);
    // Also map basename without extension for flexible import resolution
    const baseWithoutExt = normalizedPath.replace(/\.[^/.]+$/, '');
    pathToIdMap.set(baseWithoutExt, id);

    fileNodes.push({
      id,
      name: fileName,
      path: normalizedPath,
      directory,
      content,
      loc,
      codeLines,
      commentLines,
      blankLines,
      functionsCount,
      complexityScore,
      isMonolith,
      language: langInfo,
      rawImports: extractImports(content, ext),
      dependencies: [], // Resolved node IDs
      dependents: []    // Resolved node IDs
    });
  });

  // 2. Second Pass: Resolve Cross-File Dependencies
  const dependencyLinks = [];

  fileNodes.forEach(node => {
    node.rawImports.forEach(imp => {
      const resolvedId = resolveImportTarget(node.path, imp, pathToIdMap);
      if (resolvedId && resolvedId !== node.id) {
        if (!node.dependencies.includes(resolvedId)) {
          node.dependencies.push(resolvedId);
          dependencyLinks.push({ from: node.id, to: resolvedId });
        }
        const targetNode = fileNodes.find(n => n.id === resolvedId);
        if (targetNode && !targetNode.dependents.includes(node.id)) {
          targetNode.dependents.push(node.id);
        }
      }
    });
  });

  // 3. Hierarchical District Grouping
  const districtsMap = new Map();

  fileNodes.forEach(node => {
    const dirKey = node.directory;
    if (!districtsMap.has(dirKey)) {
      districtsMap.set(dirKey, {
        id: `dist-${districtsMap.size}`,
        path: dirKey,
        name: dirKey === 'root' ? 'Metropolis Central (root)' : `District: /${dirKey}`,
        files: []
      });
    }
    districtsMap.get(dirKey).files.push(node);
  });

  const districts = Array.from(districtsMap.values());

  // Tallest skyscraper (largest file)
  const tallestFile = [...fileNodes].sort((a, b) => b.loc - a.loc)[0] || null;
  const mostComplexFile = [...fileNodes].sort((a, b) => b.complexityScore - a.complexityScore)[0] || null;

  // Codebase Health Score (0 - 100)
  const monolithRatio = fileNodes.length > 0 ? monolithCount / fileNodes.length : 0;
  const healthScore = Math.max(20, Math.round(100 - (monolithRatio * 60)));

  return {
    files: fileNodes,
    districts,
    links: dependencyLinks,
    stats: {
      totalFiles: fileNodes.length,
      totalDistricts: districts.length,
      totalLOC: totalLinesOfCode,
      totalComments,
      monolithCount,
      healthScore,
      languages: languagesCount,
      tallestFile,
      mostComplexFile
    }
  };
}

/**
 * Extracts raw import strings from source code
 */
function extractImports(content, ext) {
  const imports = [];
  if (!content) return imports;

  // JS/TS: import ... from '...' or require('...')
  if (['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte'].includes(ext)) {
    const es6Matches = content.matchAll(/(?:import\s+[\s\S]*?from\s+['"]([^'"]+)['"])|(?:import\s*['"]([^'"]+)['"])/g);
    for (const match of es6Matches) {
      const imp = match[1] || match[2];
      if (imp) imports.push(imp);
    }
    const cjsMatches = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    for (const match of cjsMatches) {
      if (match[1]) imports.push(match[1]);
    }
  }

  // Python: from x import y OR import x
  if (ext === 'py') {
    const pyMatches = content.matchAll(/(?:from\s+([a-zA-Z0-9_.]+)\s+import)|(?:import\s+([a-zA-Z0-9_.]+))/g);
    for (const match of pyMatches) {
      const imp = match[1] || match[2];
      if (imp) imports.push(imp.replace(/\./g, '/'));
    }
  }

  return imports;
}

/**
 * Resolves relative or path-based import to a known file node id
 */
function resolveImportTarget(currentPath, importSpecifier, pathToIdMap) {
  // If it's a 3rd party package (e.g. 'react', 'three'), return null
  if (!importSpecifier.startsWith('.') && !importSpecifier.startsWith('/')) {
    // Check if directly matched in root
    if (pathToIdMap.has(importSpecifier)) {
      return pathToIdMap.get(importSpecifier);
    }
    return null;
  }

  const currentDirParts = currentPath.split('/');
  currentDirParts.pop(); // Remove current file name

  const specifierParts = importSpecifier.replace(/^\//, '').split('/');
  const resolvedParts = [...currentDirParts];

  for (const part of specifierParts) {
    if (part === '.') continue;
    if (part === '..') {
      resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  const candidatePath = resolvedParts.join('/');

  // Check exact candidate
  if (pathToIdMap.has(candidatePath)) return pathToIdMap.get(candidatePath);

  // Check with common extensions
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.css', '/index.js', '/index.ts'];
  for (const ext of extensions) {
    if (pathToIdMap.has(candidatePath + ext)) {
      return pathToIdMap.get(candidatePath + ext);
    }
  }

  return null;
}
