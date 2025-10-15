const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "admin_db",
  password: process.env.DB_PASS || "6710210455",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err.message, err.stack);
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

module.exports = { pool } ;
