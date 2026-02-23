import { readdir, readFile, stat, access } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

export interface LoadedDocument {
  filePath: string;
  content: string;
}

const SUPPORTED_EXTENSIONS = [".md", ".txt"];

/**
 * Parse a .kgignore file into an array of glob-style patterns.
 * Supports simple prefix/suffix matching (e.g., "private/", "*.secret.md").
 */
async function loadKgIgnore(folderPath: string): Promise<string[]> {
  const ignorePath = join(folderPath, ".kgignore");
  try {
    await access(ignorePath);
    const raw = await readFile(ignorePath, "utf-8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch {
    return [];
  }
}

function isIgnored(relPath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Directory prefix: "private/" matches anything under private/
    if (pattern.endsWith("/")) {
      if (relPath.startsWith(pattern) || relPath.startsWith(pattern.slice(0, -1))) {
        return true;
      }
    }
    // Wildcard suffix: "*.secret.md"
    else if (pattern.startsWith("*")) {
      if (relPath.endsWith(pattern.slice(1))) {
        return true;
      }
    }
    // Exact filename match anywhere in path
    else if (relPath === pattern || relPath.endsWith("/" + pattern)) {
      return true;
    }
  }
  return false;
}

export async function loadDocuments(
  folderPath: string,
): Promise<LoadedDocument[]> {
  const absoluteFolder = resolve(folderPath);

  // Validate folder exists and is a directory
  let folderStat;
  try {
    folderStat = await stat(absoluteFolder);
  } catch {
    throw new Error(`Directory '${folderPath}' does not exist.`);
  }
  if (!folderStat.isDirectory()) {
    throw new Error(`'${folderPath}' is not a directory.`);
  }

  // Load .kgignore patterns
  const ignorePatterns = await loadKgIgnore(absoluteFolder);

  const entries = await readdir(absoluteFolder, {
    withFileTypes: true,
    recursive: true,
  });

  const documents: LoadedDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = entry.name
      .substring(entry.name.lastIndexOf("."))
      .toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

    const fullPath = join(entry.parentPath ?? entry.path, entry.name);
    const relPath = relative(absoluteFolder, fullPath);

    // Check .kgignore
    if (ignorePatterns.length > 0 && isIgnored(relPath, ignorePatterns)) {
      console.error(`Skipping ignored: ${relPath}`);
      continue;
    }

    try {
      const content = await readFile(fullPath, "utf-8");
      if (content.trim().length === 0) {
        console.error(`Warning: Skipping empty file: ${relPath}`);
        continue;
      }
      documents.push({ filePath: relPath, content });
    } catch (err) {
      console.error(
        `Warning: Could not read file ${relPath}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Sort for deterministic ordering
  documents.sort((a, b) => a.filePath.localeCompare(b.filePath));
  return documents;
}
