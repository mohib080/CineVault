process.env.NODE_ENV = 'test';
import app from '../src/index';
import http from 'http';

async function runFeatureVerificationTests() {
  console.log('\n======================================================');
  console.log('🎬 CineVault Dynamic TMDB, Person & Letterboxd Features Test');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const userEmail = `cinephile_${timestamp}@cinevault.test`;

    // 1. Register test user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `cinephile_${timestamp}`,
        email: userEmail,
        password: 'password123',
        default_privacy: 'PRIVATE'
      })
    });
    const regData = await regRes.json();
    const userToken = regData.token;
    assert(regRes.status === 201 && Boolean(userToken), 'User registered for feature tests');

    // 2. Discover endpoint test
    const discoverRes = await fetch(`${baseUrl}/api/movies/discover?category=trending&page=1`);
    const discoverData = await discoverRes.json();
    assert(
      discoverRes.status === 200 && Array.isArray(discoverData.results) && discoverData.results.length > 0,
      'GET /api/movies/discover returns paginated results',
      `count: ${discoverData.results?.length}`
    );

    // 3. Movie details with relational hydration
    const movieRes = await fetch(`${baseUrl}/api/movies/278`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const movieData = await movieRes.json();
    assert(
      movieRes.status === 200 &&
      movieData.movie &&
      movieData.movie.title === 'The Shawshank Redemption',
      'GET /api/movies/:id returns full movie details'
    );
    assert(
      Array.isArray(movieData.movie.genres) && Array.isArray(movieData.movie.cast),
      'Movie details include relational genres and cast list'
    );

    // 4. Favorites test (Top 4)
    const favsPut = await fetch(`${baseUrl}/api/users/me/favorites`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        favorites: [
          { slot: 1, tmdb_id: 278 }, // Shawshank
          { slot: 2, tmdb_id: 238 }  // Godfather
        ]
      })
    });
    const favsPutData = await favsPut.json();
    assert(
      favsPut.status === 200 && favsPutData.favorites?.length === 2,
      'PUT /api/users/me/favorites saves top favorite films'
    );

    const favsGet = await fetch(`${baseUrl}/api/users/cinephile_${timestamp}/favorites`);
    const favsGetData = await favsGet.json();
    assert(
      favsGet.status === 200 && favsGetData.favorites?.length === 2 && favsGetData.favorites[0].slot === 1,
      'GET /api/users/:username/favorites returns user top 4'
    );

    // 5. Letterboxd CSV Importer test
    const sampleDiaryCsv = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2024-03-01,"The Shawshank Redemption",1994,https://boxd.it/2aIq,5.0,No,"classic, favorite",2024-03-01
2024-03-05,"The Godfather",1972,https://boxd.it/2aHI,4.5,Yes,"crime, masterclass",2024-03-05`;

    const importRes = await fetch(`${baseUrl}/api/diary/import-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        csvText: sampleDiaryCsv,
        type: 'diary',
        default_visibility: 'PUBLIC'
      })
    });
    const importData = await importRes.json();
    assert(
      importRes.status === 200 && importData.imported >= 2,
      `POST /api/diary/import-csv successfully imports Letterboxd entries (imported: ${importData.imported})`
    );

    // 6. Person details with watched cross-reference test
    const personRes = await fetch(`${baseUrl}/api/people/101`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const personData = await personRes.json();
    assert(
      personRes.status === 200 && personData.person && personData.stats,
      'GET /api/people/:id returns person filmography and statistics'
    );

    // 7. User profile stats verification
    const profileRes = await fetch(`${baseUrl}/api/users/cinephile_${timestamp}/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const profileData = await profileRes.json();
    assert(
      profileRes.status === 200 &&
      profileData.stats.totalFilms >= 2 &&
      profileData.favorites?.length === 2,
      'GET /api/users/:username/profile returns rich stats, favorites, and entries'
    );

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n------------------------------------------------------');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('------------------------------------------------------\n');
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

runFeatureVerificationTests();
