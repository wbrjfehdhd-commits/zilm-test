#!/usr/bin/env node
// scripts/hash-password.mjs
//
// Run this ON YOUR OWN MACHINE (never paste a real password into a chat, ticket, or commit):
//
//   node scripts/hash-password.mjs "your-new-owner-password"
//
// It prints a salt + hash. Put the SALT in Vercel as OWNER_PASSWORD_SALT and the HASH as
// OWNER_PASSWORD_HASH (Project Settings -> Environment Variables). The plaintext you typed
// is never written to a file or sent anywhere by this script.

import crypto from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-new-password"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Use a password that is at least 8 characters.');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');

console.log('\nAdd these to your Vercel project env vars:\n');
console.log('OWNER_PASSWORD_SALT =', salt);
console.log('OWNER_PASSWORD_HASH =', hash);
console.log('\n(Also set OWNER_USERNAME to whatever username you want to log in with.)\n');
