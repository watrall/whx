import { readFile, rename, writeFile } from 'node:fs/promises';

export const USER_AGENT = 'WHX/1.0 (data update; https://github.com/watrall/whx)';

const WIKIDATA = 'https://query.wikidata.org/sparql';
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(path, data) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data)}\n`);
  await rename(temporary, path);
}

export async function fetchWithRetry(url, options = {}, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response = null;
    try {
      response = await fetch(url, { ...options, headers: { 'User-Agent': USER_AGENT, ...options.headers } });
    } catch {
      response = null;
    }
    if (response && !RETRYABLE.has(response.status)) return response;
    await sleep(1500 * 2 ** attempt);
  }
  return null;
}

export async function queryWikidata(query, timeoutMs = 60000) {
  const response = await fetch(WIKIDATA, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ query, format: 'json' }).toString(),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Wikidata returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  return response.json();
}
