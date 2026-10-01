/**
 * Backfill bookmark embeddings into the pgvector database.
 *
 * Does exactly what functions/index.js generateEmbeddingForBookmark does, for
 * every bookmark of every user: same text (title + description + tags), same
 * gateway endpoint (/api/ai/embed), same upsert into `bookmarks`, and the same
 * Firestore flags (hasEmbedding, embeddingGeneratedAt, embeddingDimensions).
 * Idempotent: re-running just re-upserts.
 *
 * Usage (from functions/, which has firebase-admin, pg and axios installed):
 *   GOOGLE_APPLICATION_CREDENTIALS=../<service-account>.json \
 *   NEON_DATABASE_URL=postgresql://... AI_GATEWAY_URL=https://... \
 *   node ../scripts/backfill-embeddings.cjs [--dry-run]
 */

const admin = require('firebase-admin');
const axios = require('axios');
const { Pool } = require('pg');

const DRY_RUN = process.argv.includes('--dry-run');
const { NEON_DATABASE_URL, AI_GATEWAY_URL } = process.env;

if (!NEON_DATABASE_URL || !AI_GATEWAY_URL) {
  console.error('NEON_DATABASE_URL and AI_GATEWAY_URL must be set');
  process.exit(1);
}

admin.initializeApp({ projectId: 'marmoset-c2870' });
const db = admin.firestore();

const textFor = (b) =>
  [b.title || '', b.desc || b.description || '', (b.tags || []).join(' ')]
    .filter(Boolean)
    .join(' ')
    .trim();

async function main() {
  // The edge endpoint has a valid Let's Encrypt certificate: verify it.
  const pool = new Pool({ connectionString: NEON_DATABASE_URL, ssl: true });
  const snap = await db.collectionGroup('bookmarks').get();
  const stats = { total: snap.size, embedded: 0, skipped: 0, failed: 0 };

  for (const doc of snap.docs) {
    const userId = doc.ref.parent.parent && doc.ref.parent.parent.id;
    const b = doc.data();
    const text = textFor(b);

    if (!userId || text.length < 10) {
      stats.skipped++;
      continue;
    }
    if (DRY_RUN) {
      stats.embedded++;
      continue;
    }

    try {
      const res = await axios.post(
        `${AI_GATEWAY_URL}/api/ai/embed`,
        { text },
        { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
      );
      const embedding = res.data && res.data.embedding;
      if (!Array.isArray(embedding)) throw new Error('invalid embedding response');

      await pool.query(
        `INSERT INTO bookmarks (firebase_uid, firebase_bookmark_id, title, url, description, embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)
         ON CONFLICT (firebase_uid, firebase_bookmark_id)
         DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url,
           description = EXCLUDED.description, embedding = EXCLUDED.embedding, updated_at = NOW()`,
        [userId, doc.id, b.title || '', b.url || '', b.desc || b.description || '', `[${embedding.join(',')}]`]
      );

      await doc.ref.update({
        hasEmbedding: true,
        embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        embeddingDimensions: embedding.length,
        embeddingError: admin.firestore.FieldValue.delete(),
      });
      stats.embedded++;
    } catch (err) {
      stats.failed++;
      console.error(`failed ${userId}/${doc.id}: ${err.message}`);
    }
  }

  await pool.end();
  console.log(DRY_RUN ? 'DRY RUN' : 'DONE', stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
