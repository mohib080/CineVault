import https from 'https';
import zlib from 'zlib';
import readline from 'readline';
import { getDb } from '../config/db';

interface MovieRating {
  rating: number;
  votes: number;
}

interface IngestOptions {
  minVotes: number;
  limit: number;
  all: boolean;
  includeSeries: boolean;
}

function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  let minVotes = 100; // Lower threshold to capture massive breadth of movies & series
  let limit = 50000;
  let all = false;
  let includeSeries = true;

  for (const arg of args) {
    if (arg.startsWith('--min-votes=')) {
      minVotes = parseInt(arg.split('=')[1], 10) || 100;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10) || 50000;
    } else if (arg === '--all') {
      all = true;
      minVotes = 0;
      limit = 0; // unlimited
    }
  }

  return { minVotes, limit, all, includeSeries };
}

/**
 * Streams title.ratings.tsv.gz and extracts ratings & vote counts into memory.
 */
async function loadRatings(minVotes: number): Promise<Map<string, MovieRating>> {
  console.log('\n[Phase 1/2] 📥 Streaming & indexing IMDb ratings (title.ratings.tsv.gz)...');
  const ratingsMap = new Map<string, MovieRating>();

  return new Promise((resolve, reject) => {
    https.get('https://datasets.imdbws.com/title.ratings.tsv.gz', (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ratings, HTTP status: ${res.statusCode}`));
      }

      const gunzip = zlib.createGunzip();
      const rl = readline.createInterface({ input: res.pipe(gunzip) });

      let lineCount = 0;
      let indexedCount = 0;

      rl.on('line', (line) => {
        lineCount++;
        if (lineCount === 1) return; // Skip TSV header

        // TSV format: tconst \t averageRating \t numVotes
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const tconst = parts[0];
          const rating = parseFloat(parts[1]);
          const votes = parseInt(parts[2], 10);

          if (votes >= minVotes) {
            ratingsMap.set(tconst, { rating, votes });
            indexedCount++;
          }
        }

        if (lineCount % 300000 === 0) {
          process.stdout.write(`  Indexed ${indexedCount.toLocaleString()} rated titles (${lineCount.toLocaleString()} scanned)...\r`);
        }
      });

      rl.on('close', () => {
        console.log(`\n  ✅ Successfully indexed ${ratingsMap.size.toLocaleString()} title ratings (min votes: ${minVotes}).\n`);
        resolve(ratingsMap);
      });

      rl.on('error', reject);
      gunzip.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Streams title.basics.tsv.gz, filters for feature films and TV series, and batches them into CineVault DB.
 */
async function ingestBasics(ratingsMap: Map<string, MovieRating>, options: IngestOptions) {
  console.log('[Phase 2/2] 🎬 Streaming IMDb title basics (movies & TV series) & inserting into CineVault DB...');
  const db = await getDb();

  const ALLOWED_TYPES = new Set(['movie', 'tvSeries', 'tvMiniSeries', 'tvMovie']);

  return new Promise<void>((resolve, reject) => {
    https.get('https://datasets.imdbws.com/title.basics.tsv.gz', (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download title.basics, HTTP status: ${res.statusCode}`));
      }

      const gunzip = zlib.createGunzip();
      const rl = readline.createInterface({ input: res.pipe(gunzip) });

      let totalScanned = 0;
      let insertedCount = 0;
      let batch: any[] = [];
      const BATCH_SIZE = 1000;

      const flushBatch = async () => {
        if (batch.length === 0) return;
        const currentBatch = [...batch];
        batch = [];

        // Insert batch items
        for (const m of currentBatch) {
          try {
            await db.query(
              `INSERT INTO movies (tmdb_id, title, release_year, title_type, poster_path, backdrop_path, director, runtime, overview, imdb_id, rating)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (tmdb_id) DO UPDATE SET
                 title = EXCLUDED.title,
                 release_year = COALESCE(EXCLUDED.release_year, movies.release_year),
                 title_type = COALESCE(EXCLUDED.title_type, movies.title_type),
                 runtime = COALESCE(EXCLUDED.runtime, movies.runtime),
                 overview = COALESCE(EXCLUDED.overview, movies.overview),
                 imdb_id = EXCLUDED.imdb_id,
                 rating = EXCLUDED.rating`,
              [
                m.tmdb_id,
                m.title,
                m.release_year || null,
                m.title_type || 'movie',
                m.poster_path || null,
                m.backdrop_path || null,
                m.director || null,
                m.runtime || null,
                m.overview || null,
                m.imdb_id,
                m.rating || null
              ]
            );
          } catch (err) {
            // ignore duplicates / constraint collisions
          }
        }
      };

      rl.on('line', async (line) => {
        totalScanned++;
        if (totalScanned === 1) return; // Skip TSV header

        // Columns:
        // 0: tconst, 1: titleType, 2: primaryTitle, 3: originalTitle, 4: isAdult, 5: startYear, 6: endYear, 7: runtimeMinutes, 8: genres
        const cols = line.split('\t');
        if (cols.length < 8) return;

        const tconst = cols[0];
        const titleType = cols[1];
        const primaryTitle = cols[2];
        const isAdult = cols[4];
        const startYear = cols[5];
        const runtimeMinutes = cols[7];
        const genres = cols[8] ? cols[8].replace(/\\N/g, '') : '';

        // Filter: movies and TV series only, non-adult
        if (!ALLOWED_TYPES.has(titleType) || isAdult === '1') return;

        // Check if ratings exist for this title
        const ratingInfo = ratingsMap.get(tconst);
        if (!options.all && !ratingInfo) return;

        // Parse numerical ID from tt0111161 -> 111161
        const digits = tconst.replace(/\D/g, '');
        const tmdbId = parseInt(digits, 10);
        if (isNaN(tmdbId)) return;

        const releaseYear = startYear !== '\\N' ? parseInt(startYear, 10) : undefined;
        const runtime = runtimeMinutes !== '\\N' ? parseInt(runtimeMinutes, 10) : undefined;

        let displayType = 'movie';
        if (titleType === 'tvSeries' || titleType === 'tvMiniSeries') {
          displayType = 'series';
        }

        let overview = '';
        if (displayType === 'series') {
          overview += '[TV Series] ';
        }
        if (genres) overview += `Genres: ${genres.split(',').join(', ')}. `;
        if (ratingInfo) {
          overview += `IMDb Rating: ${ratingInfo.rating}/10 (${ratingInfo.votes.toLocaleString()} votes).`;
        }

        batch.push({
          tmdb_id: tmdbId,
          title: primaryTitle,
          release_year: releaseYear,
          title_type: displayType,
          poster_path: null,
          backdrop_path: null,
          director: displayType === 'series' ? 'TV Series' : 'IMDb Catalog',
          runtime,
          overview: overview.trim(),
          imdb_id: tconst,
          rating: ratingInfo ? ratingInfo.rating : null
        });

        insertedCount++;

        if (batch.length >= BATCH_SIZE) {
          rl.pause();
          await flushBatch();
          process.stdout.write(`  🚀 Ingested ${insertedCount.toLocaleString()} movies & series into CineVault database...\r`);
          rl.resume();
        }

        if (options.limit > 0 && insertedCount >= options.limit) {
          rl.close();
          res.destroy();
        }
      });

      rl.on('close', async () => {
        await flushBatch();
        console.log(`\n\n🎉 [IMDb Ingestion Complete] Successfully imported ${insertedCount.toLocaleString()} movies & TV series into CineVault!\n`);
        resolve();
      });

      rl.on('error', reject);
      gunzip.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('================================================================');
  console.log('🎬 CineVault Production IMDb Streaming Ingestion Pipeline');
  console.log('   (Movies, TV Series, Mini-Series & Ratings)');
  console.log('================================================================');

  const options = parseArgs();
  console.log(`Configuration: Min Votes = ${options.minVotes}, Limit = ${options.limit || 'All'}, All = ${options.all}`);

  try {
    const ratingsMap = await loadRatings(options.minVotes);
    await ingestBasics(ratingsMap, options);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Ingestion error:', err);
    process.exit(1);
  }
}

run();
