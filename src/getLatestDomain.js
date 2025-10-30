const mysql = require("mysql2/promise");
require("dotenv").config();

let cachedDomain = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

const database = process.env.MYSQL_DATABASE;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const host = process.env.MYSQL_HOST;

if (!database || !host || !user || !password) {
  console.error("Database connection variables not fully defined in .env");
}

const pool = mysql.createPool({
  host: host,
  user: user,
  password: password,
  database: database,
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function getLatestDomain() {
  const now = Date.now();
  if (cachedDomain && now < cacheExpiry) {
    console.log("Serving latest entry from cache: " + cachedDomain.domain);
    return cachedDomain;
  }

  console.log("Cache expired or miss. Fetching from database...");
  const sql = `
        SELECT *
        FROM domains
        WHERE type = ?
        ORDER BY created_at DESC
        LIMIT 1;
    `;
  const type = "offer_list";

  try {
    const [rows] = await pool.execute(sql, [type]);
    const latestEntry = rows.length > 0 ? rows[0] : null;

    if (latestEntry) {
      cachedDomain = latestEntry;
      cacheExpiry = now + CACHE_TTL;
      console.log(
        "Cache updated:",
        latestEntry.domain,
        " Next expiry:",
        new Date(cacheExpiry).toLocaleTimeString()
      );
    } else {
      cachedDomain = null;
      cacheExpiry = now + 60 * 1000;
      console.log("No entry found, caching null temporarily.");
    }

    return latestEntry;
  } catch (error) {
    console.error("Error fetching latest entry from DB:", error);
    if (cachedDomain) {
      console.log("DB fetch failed. Serving stale cache.");
      return cachedDomain;
    }

    return null;
  }
}

module.exports = getLatestDomain;
