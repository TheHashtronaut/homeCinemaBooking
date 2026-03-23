import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const DATA_PATH = path.join(process.cwd(), "data", "db.json");

const EMPTY_DB = {
  movies: [],
  showtimes: [],
  bookingRequests: [],
  users: [],
  sessions: [],
};

async function ensureDbFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

export async function readDb() {
  await ensureDbFile();
  const txt = await fs.readFile(DATA_PATH, "utf8");
  const parsed = JSON.parse(txt);
  return {
    movies: parsed.movies ?? [],
    showtimes: parsed.showtimes ?? [],
    bookingRequests: parsed.bookingRequests ?? [],
    users: parsed.users ?? [],
    sessions: parsed.sessions ?? [],
  };
}

export async function writeDb(db) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  const tmp = `${DATA_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DATA_PATH);
}

export async function updateDb(mutator) {
  const current = await readDb();
  const next = await mutator(current);
  await writeDb(next);
  return next;
}

export function newId() {
  return crypto.randomUUID();
}

export function parseLocalDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

