require('dotenv').config();
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env file');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function resetAdmin() {
  try {
    console.log('Fetching existing admins...');
    const adminsSnapshot = await db.collection('admins').get();

    // Delete all existing admins
    if (!adminsSnapshot.empty) {
      console.log(`Found ${adminsSnapshot.size} admin(s). Deleting...`);
      const batch = db.batch();
      adminsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('All existing admins deleted.');
    }

    // Create new admin with default credentials
    const username = 'admin';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    await db.collection('admins').doc().set({
      username: username,
      name: 'Administrator',
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    });

    console.log('\n✅ Admin credentials reset successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change this password after logging in!');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
}

resetAdmin();
