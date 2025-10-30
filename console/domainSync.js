const mysql = require("mysql2/promise");
require("dotenv").config();

(async () => {
  const database = process.env.MYSQL_DATABASE;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const host = process.env.MYSQL_HOST;

  if (!database) {
    console.log("Database not defined.");
  }
  if (!host) {
    console.log("Host not defined.");
  }

  const pool = mysql.createPool({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  const sql = `
        SELECT *
        FROM domains
        WHERE type = ?
        ORDER BY id DESC
        LIMIT 1;
    `;
  const type = "offer_list";

  try {
    const [rows] = await pool.execute(sql, [type]);

    if (rows.length > 0) {
      console.log("Latest entry found:", rows[0]);
      return rows[0];
    } else {
      console.log("No entry found for type 'offer_list'");
      return null;
    }
  } catch (error) {
    console.error("Error fetching latest entry:", error);
  }

  process.exit(0);
})();
