process.env.NODE_ENV = 'test';
import app from '../src/index';
import http from 'http';

async function runPrivacyVerificationTests() {
  console.log('\n======================================================');
  console.log('🔒 CineVault Granular Privacy Verification Test Suite');
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
    const aliceEmail = `alice_${timestamp}@cinevault.test`;
    const bobEmail = `bob_${timestamp}@cinevault.test`;

    // 1. Register Alice
    const aliceReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `alice_${timestamp}`,
        email: aliceEmail,
        password: 'password123',
        default_privacy: 'PRIVATE'
      })
    });
    const aliceData = await aliceReg.json();
    const aliceToken = aliceData.token;
    assert(aliceReg.status === 201 && Boolean(aliceToken), 'Alice registered successfully');

    // 2. Register Bob
    const bobReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `bob_${timestamp}`,
        email: bobEmail,
        password: 'password123',
        default_privacy: 'PUBLIC'
      })
    });
    const bobData = await bobReg.json();
    const bobToken = bobData.token;
    assert(bobReg.status === 201 && Boolean(bobToken), 'Bob registered successfully');

    // 3. Alice logs a PRIVATE movie review
    const privateLogRes = await fetch(`${baseUrl}/api/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        tmdb_id: 872585,
        title: 'Oppenheimer',
        release_year: 2023,
        rating: 4.5,
        review_text: 'Secret diary note: Masterpiece of sound and tension.',
        visibility: 'PRIVATE'
      })
    });
    const privateLog = await privateLogRes.json();
    const privateEntryId = privateLog.entry?.id;
    assert(privateLogRes.status === 201 && privateLog.entry?.visibility === 'PRIVATE', 'Alice logged PRIVATE entry');

    // 4. Alice logs an UNLISTED movie review
    const unlistedLogRes = await fetch(`${baseUrl}/api/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        tmdb_id: 693134,
        title: 'Dune: Part Two',
        release_year: 2024,
        rating: 5.0,
        review_text: 'Unlisted review for friends: Visually magnificent.',
        visibility: 'UNLISTED'
      })
    });
    const unlistedLog = await unlistedLogRes.json();
    const unlistedEntryId = unlistedLog.entry?.id;
    const shareToken = unlistedLog.entry?.share_token;
    assert(
      unlistedLogRes.status === 201 &&
      unlistedLog.entry?.visibility === 'UNLISTED' &&
      typeof shareToken === 'string' &&
      shareToken.length > 10,
      'Alice logged UNLISTED entry with auto-generated cryptographic share_token'
    );

    // 5. Alice logs a PUBLIC movie review
    const publicLogRes = await fetch(`${baseUrl}/api/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        tmdb_id: 157336,
        title: 'Interstellar',
        release_year: 2014,
        rating: 5.0,
        review_text: 'Public review: Love transcends dimensions.',
        visibility: 'PUBLIC'
      })
    });
    const publicLog = await publicLogRes.json();
    const publicEntryId = publicLog.entry?.id;
    assert(publicLogRes.status === 201 && publicLog.entry?.visibility === 'PUBLIC', 'Alice logged PUBLIC entry');

    // -------------------------------------------------------------
    // TEST ACCESS CONTROLS
    // -------------------------------------------------------------

    // 6. Owner (Alice) requests PRIVATE review -> 200 OK
    const aliceGetsPrivate = await fetch(`${baseUrl}/api/diary/${privateEntryId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    assert(aliceGetsPrivate.status === 200, 'Owner can access PRIVATE entry (200 OK)');

    // 7. Unauthenticated Guest requests PRIVATE review -> 403 Forbidden
    const guestGetsPrivate = await fetch(`${baseUrl}/api/diary/${privateEntryId}`);
    assert(guestGetsPrivate.status === 403, 'Unauthenticated guest is DENIED access to PRIVATE entry (403 Forbidden)');

    // 8. Other user (Bob) requests PRIVATE review -> 403 Forbidden
    const bobGetsPrivate = await fetch(`${baseUrl}/api/diary/${privateEntryId}`, {
      headers: { Authorization: `Bearer ${bobToken}` }
    });
    assert(bobGetsPrivate.status === 403, 'Non-owner user (Bob) is DENIED access to Alice’s PRIVATE entry (403 Forbidden)');

    // 9. Unauthenticated Guest requests UNLISTED review WITHOUT token -> 403 Forbidden
    const guestGetsUnlistedNoToken = await fetch(`${baseUrl}/api/diary/${unlistedEntryId}`);
    assert(
      guestGetsUnlistedNoToken.status === 403,
      'Request to UNLISTED review WITHOUT token is DENIED (403 Forbidden)'
    );

    // 10. Unauthenticated Guest requests UNLISTED review with WRONG token -> 403 Forbidden
    const guestGetsUnlistedBadToken = await fetch(`${baseUrl}/api/diary/${unlistedEntryId}?token=invalid_random_token_123`);
    assert(
      guestGetsUnlistedBadToken.status === 403,
      'Request to UNLISTED review with WRONG token is DENIED (403 Forbidden)'
    );

    // 11. Unauthenticated Guest requests UNLISTED review with EXACT share_token -> 200 OK
    const guestGetsUnlistedValidToken = await fetch(`${baseUrl}/api/diary/${unlistedEntryId}?token=${shareToken}`);
    const unlistedBody = await guestGetsUnlistedValidToken.json();
    assert(
      guestGetsUnlistedValidToken.status === 200 && unlistedBody.entry?.id === unlistedEntryId,
      'Request to UNLISTED review with EXACT share_token SUCCEEDS (200 OK)'
    );

    // 12. Non-owner (Bob) requests UNLISTED review with EXACT share_token -> 200 OK
    const bobGetsUnlistedValidToken = await fetch(`${baseUrl}/api/diary/${unlistedEntryId}?token=${shareToken}`, {
      headers: { Authorization: `Bearer ${bobToken}` }
    });
    assert(
      bobGetsUnlistedValidToken.status === 200,
      'Non-owner user with EXACT share_token can access UNLISTED review (200 OK)'
    );

    // 13. Anyone requests PUBLIC review -> 200 OK
    const guestGetsPublic = await fetch(`${baseUrl}/api/diary/${publicEntryId}`);
    assert(guestGetsPublic.status === 200, 'PUBLIC review is accessible to unauthenticated guest (200 OK)');

    // 14. 1-Click visibility toggle: Alice changes PRIVATE to UNLISTED
    const toggleRes = await fetch(`${baseUrl}/api/diary/${privateEntryId}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ visibility: 'UNLISTED' })
    });
    const toggledData = await toggleRes.json();
    const newShareToken = toggledData.entry?.share_token;
    assert(
      toggleRes.status === 200 &&
      toggledData.entry?.visibility === 'UNLISTED' &&
      Boolean(newShareToken),
      'Owner toggled entry visibility to UNLISTED and generated share_token'
    );

    // 15. Bob attempts to change Alice’s visibility -> 403 Forbidden
    const unauthorizedToggle = await fetch(`${baseUrl}/api/diary/${privateEntryId}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bobToken}`
      },
      body: JSON.stringify({ visibility: 'PUBLIC' })
    });
    assert(unauthorizedToggle.status === 403, 'Unauthorized user cannot toggle another user’s visibility (403 Forbidden)');

    // 16. Profile view privacy filtering:
    // When Bob views Alice's profile -> ONLY PUBLIC entries should be returned
    const bobViewsAliceProfile = await fetch(`${baseUrl}/api/users/alice_${timestamp}/profile`, {
      headers: { Authorization: `Bearer ${bobToken}` }
    });
    const profileViewBob = await bobViewsAliceProfile.json();
    const visibilitiesForBob = profileViewBob.entries.map((e: any) => e.visibility);
    const onlyPublicVisibleToBob = visibilitiesForBob.every((v: string) => v === 'PUBLIC');
    assert(
      onlyPublicVisibleToBob && profileViewBob.entries.length === 1,
      'Bob viewing Alice profile ONLY sees PUBLIC entries'
    );

    // 17. When Alice views her own profile -> ALL entries (PUBLIC, UNLISTED, PRIVATE) are returned
    const aliceViewsOwnProfile = await fetch(`${baseUrl}/api/users/alice_${timestamp}/profile`, {
      headers: { Authorization: `Bearer ${aliceToken}` }
    });
    const profileViewAlice = await aliceViewsOwnProfile.json();
    assert(
      profileViewAlice.entries.length === 3,
      'Alice viewing her own profile sees ALL entries (including UNLISTED & PRIVATE)'
    );

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    await new Promise<void>((res) => server.close(() => res()));
  }

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runPrivacyVerificationTests();
