import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import type { LoadedDocument } from "./loader.js";

const CACHE_DIR = "kg";
const CACHE_FILE = ".cache.json";

interface CacheEntry {
  [filePath: string]: string; // filePath -> content hash
}

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

async function readCacheFile(): Promise<CacheEntry> {
  const cachePath = join(process.cwd(), CACHE_DIR, CACHE_FILE);
  try {
    await access(cachePath);
    const raw = await readFile(cachePath, "utf-8");
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return {};
  }
}

export interface CacheResult {
  changed: LoadedDocument[];
  unchanged: LoadedDocument[];
}

export async function checkCache(
  documents: LoadedDocument[],
): Promise<CacheResult> {
  const cached = await readCacheFile();

  const changed: LoadedDocument[] = [];
  const unchanged: LoadedDocument[] = [];

  for (const doc of documents) {
    const hash = hashContent(doc.content);
    if (cached[doc.filePath] === hash) {
      unchanged.push(doc);
    } else {
      changed.push(doc);
    }
  }

  return { changed, unchanged };
}

export async function updateCache(
  documents: LoadedDocument[],
): Promise<void> {
  const dir = join(process.cwd(), CACHE_DIR);
  await mkdir(dir, { recursive: true });

  const entry: CacheEntry = {};
  for (const doc of documents) {
    entry[doc.filePath] = hashContent(doc.content);
  }

  const cachePath = join(dir, CACHE_FILE);
  await writeFile(cachePath, JSON.stringify(entry, null, 2) + "\n", "utf-8");
}
