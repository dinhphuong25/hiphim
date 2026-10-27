import fs from "fs";
import path from "path";
import { ensureVercelDatabase, vercelSql } from "@/lib/vercel-db";

export interface MovieRatingSummary {
  slug: string;
  averageScore: number;
  totalVotes: number;
  distribution?: Record<number, number>;
}

interface StoredRatingData {
  [slug: string]: {
    totalScore: number;
    totalVotes: number;
    userVotes?: Record<string, number>;
  };
}

const RATINGS_FILE_PATH = path.join(process.cwd(), "data", "ratings.json");

function ensureFileExists() {
  const dir = path.dirname(RATINGS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(RATINGS_FILE_PATH)) {
    fs.writeFileSync(RATINGS_FILE_PATH, JSON.stringify({}, null, 2), "utf-8");
  }
}

function readRatingsFromFile(): StoredRatingData {
  try {
    ensureFileExists();
    const data = fs.readFileSync(RATINGS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading ratings file:", error);
    return {};
  }
}

function writeRatingsToFile(data: StoredRatingData): void {
  try {
    ensureFileExists();
    fs.writeFileSync(RATINGS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing ratings file:", error);
  }
}

async function ensureRatingsTable() {
  if (!(await ensureVercelDatabase()) || !vercelSql) return false;
  try {
    await vercelSql`
      CREATE TABLE IF NOT EXISTS hiphim_ratings (
        slug TEXT PRIMARY KEY,
        total_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_votes INT NOT NULL DEFAULT 0,
        updated_at BIGINT NOT NULL,
        data JSONB
      )
    `;
    return true;
  } catch (err) {
    console.error("Error ensuring ratings table:", err);
    return false;
  }
}

// Generate realistic deterministic seed rating for new movies based on slug hash
function getInitialSeedRating(slug: string): { score: number; votes: number } {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const score = 8.0 + (positiveHash % 19) / 10; // 8.0 to 9.8
  const votes = 40 + (positiveHash % 160); // 40 to 200 votes
  return { score: parseFloat(score.toFixed(1)), votes };
}

export async function getMovieRating(slug: string): Promise<MovieRatingSummary> {
  const seed = getInitialSeedRating(slug);

  const hasDb = await ensureRatingsTable();
  if (hasDb && vercelSql) {
    try {
      const rows = await vercelSql`
        SELECT total_score, total_votes FROM hiphim_ratings WHERE slug = ${slug}
      `;
      if (rows && rows.length > 0) {
        const row = rows[0] as any;
        const totalScore = (seed.score * seed.votes) + Number(row.total_score);
        const totalVotes = seed.votes + Number(row.total_votes);
        const average = totalVotes > 0 ? parseFloat((totalScore / totalVotes).toFixed(1)) : seed.score;
        return {
          slug,
          averageScore: average,
          totalVotes,
        };
      }
    } catch (err) {
      console.error("Failed to query rating from DB:", err);
    }
  }

  const fileData = readRatingsFromFile();
  const entry = fileData[slug];
  if (entry) {
    const totalScore = (seed.score * seed.votes) + entry.totalScore;
    const totalVotes = seed.votes + entry.totalVotes;
    const average = totalVotes > 0 ? parseFloat((totalScore / totalVotes).toFixed(1)) : seed.score;
    return {
      slug,
      averageScore: average,
      totalVotes,
    };
  }

  return {
    slug,
    averageScore: seed.score,
    totalVotes: seed.votes,
  };
}

export async function submitMovieRating(
  slug: string,
  score: number,
  userIdOrIp: string
): Promise<MovieRatingSummary> {
  const clampedScore = Math.max(1, Math.min(10, Math.round(score)));
  const fileData = readRatingsFromFile();
  if (!fileData[slug]) {
    fileData[slug] = { totalScore: 0, totalVotes: 0, userVotes: {} };
  }

  const movieEntry = fileData[slug];
  if (!movieEntry.userVotes) movieEntry.userVotes = {};

  const previousUserScore = movieEntry.userVotes[userIdOrIp];
  if (previousUserScore !== undefined) {
    movieEntry.totalScore = movieEntry.totalScore - previousUserScore + clampedScore;
  } else {
    movieEntry.totalScore += clampedScore;
    movieEntry.totalVotes += 1;
  }
  movieEntry.userVotes[userIdOrIp] = clampedScore;

  writeRatingsToFile(fileData);

  const hasDb = await ensureRatingsTable();
  if (hasDb && vercelSql) {
    try {
      await vercelSql`
        INSERT INTO hiphim_ratings (slug, total_score, total_votes, updated_at)
        VALUES (${slug}, ${movieEntry.totalScore}, ${movieEntry.totalVotes}, ${Date.now()})
        ON CONFLICT (slug) DO UPDATE
        SET total_score = ${movieEntry.totalScore},
            total_votes = ${movieEntry.totalVotes},
            updated_at = ${Date.now()}
      `;
    } catch (err) {
      console.error("Failed to save rating to DB:", err);
    }
  }

  const seed = getInitialSeedRating(slug);
  const totalScore = (seed.score * seed.votes) + movieEntry.totalScore;
  const totalVotes = seed.votes + movieEntry.totalVotes;
  const average = parseFloat((totalScore / totalVotes).toFixed(1));

  return {
    slug,
    averageScore: average,
    totalVotes,
  };
}
