const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'marmoset-c2870'
});

const db = admin.firestore();

const bookmarkIds = [
  'NW3CorBjdWpFfgGdr2G9',
  'O8WQ00HEUpQPsO5uSzH5',
  'S1uGEt2in2XNWWyHqsWu',
  '9jEFMM6SEZViiwxgtWpq',
  'ErSjkhUlSMNsKeKCNFNl',
  'Ll6fNsoQahrEhjiygBth',
  'ZcTBpjpzvNqchSS8pDua',
  'fDViyVNqRByPxzL0nZJK',
  'g6GQMSdYBAPwShkF4Q6v',
  'kAbodycLvN8kiNlpvfFB',
  'rxfl3p5RIGIIE1aUnyPo',
  'zZH20dQTWH68l27Atd9J'
];

const userId = '9XD5TnaSmnNJgDHhts1AEDa8SPC3';

async function syncFlags() {
  const batch = db.batch();
  
  for (const bookmarkId of bookmarkIds) {
    const ref = db.collection('users').doc(userId).collection('bookmarks').doc(bookmarkId);
    batch.update(ref, {
      hasEmbedding: true,
      embeddingGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Marking:', bookmarkId);
  }
  
  await batch.commit();
  console.log('Done! Updated', bookmarkIds.length, 'bookmarks');
  process.exit(0);
}

syncFlags().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
