// lib/store.js
// Thin wrapper around @upstash/redis. Requires a Redis database from
// upstash.com (or the Upstash integration in the Vercel Marketplace) —
// either way, connecting it sets UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN as env vars for you.

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const REPORTS_KEY = 'ez:reports';
const ADMINS_KEY = 'ez:admins';

async function getReports() {
  const data = await redis.get(REPORTS_KEY);
  return data || [];
}

async function saveReports(reports) {
  await redis.set(REPORTS_KEY, reports);
}

async function getAdmins() {
  const data = await redis.get(ADMINS_KEY);
  return data || [];
}

async function saveAdmins(admins) {
  await redis.set(ADMINS_KEY, admins);
}

module.exports = { getReports, saveReports, getAdmins, saveAdmins };
