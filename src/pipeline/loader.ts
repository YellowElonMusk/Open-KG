import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

export interface LoadedDocument {
  filePath: string;
  content: string;
}

const SUPPORTED_EXTENSIONS = [".md", ".txt"];

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

  const entries = await readdir(absoluteFolder, {
    withFileTypes: true,
    recursive: true,
  });

  const documents: LoadedDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = entry.name.substring(entry.name.lastIndexOf(".")).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

    const fullPath = join(entry.parentPath ?? entry.path, entry.name);
    const relPath = relative(absoluteFolder, fullPath);

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
