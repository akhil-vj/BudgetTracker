#!/usr/bin/env node

/**
 * Generate VAPID Keys for Push Notifications
 * 
 * VAPID (Voluntary Application Server Identification) keys are needed for push notifications.
 * This script generates a public/private key pair for your app.
 * 
 * Run: node generate-vapid-keys.js
 */

import crypto from 'crypto';

function generateVAPIDKeys() {
  console.log('🔐 Generating VAPID Keys for Push Notifications...\n');

  // Generate an EC (Elliptic Curve) key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Convert PEM format to raw bytes
  const publicKeyDer = crypto
    .createPublicKey(publicKey)
    .export({ type: 'spki', format: 'der' });

  const privateKeyDer = crypto
    .createPrivateKey(privateKey)
    .export({ type: 'pkcs8', format: 'der' });

  // Extract raw key bytes (skip ASN.1 headers)
  // For prime256v1, the public key is always 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
  const publicKeyRaw = publicKeyDer.slice(-65);

  // For private key, extract the 32-byte private key value
  const privateKeyRaw = privateKeyDer.slice(-32);

  // Encode to base64url (Web-safe base64)
  const publicKeyBase64Url = publicKeyRaw
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const privateKeyBase64Url = privateKeyRaw
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    public: publicKeyBase64Url,
    private: privateKeyBase64Url
  };
}

try {
  const keys = generateVAPIDKeys();

  console.log('✅ VAPID Keys Generated Successfully!\n');
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('📋 Add to .env.local (Frontend):\n');
  console.log(`VITE_VAPID_PUBLIC_KEY="${keys.public}"\n`);

  console.log('════════════════════════════════════════════════════════════\n');

  console.log('🔒 Add to backend/.env (Backend):\n');
  console.log(`VAPID_PRIVATE_KEY="${keys.private}"\n`);

  console.log('════════════════════════════════════════════════════════════\n');

  console.log('📝 Full .env.local example (Frontend):\n');
  console.log(`VITE_VAPID_PUBLIC_KEY="${keys.public}"`);
  console.log(`VITE_APP_URL="http://localhost:3000"\n`);

  console.log('════════════════════════════════════════════════════════════\n');

  console.log('✨ Next Steps:\n');
  console.log('1. Copy VITE_VAPID_PUBLIC_KEY above to .env.local');
  console.log('2. Add VAPID_PRIVATE_KEY to backend/.env');
  console.log('3. Restart your backend server');
  console.log('4. Restart your frontend dev server (npm run dev)');
  console.log('5. Push notifications should now work!\n');

  console.log('💡 Note: Push notifications are optional.');
  console.log('   Email notifications work without VAPID keys!\n');

} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message);
  process.exit(1);
}
