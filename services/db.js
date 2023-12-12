const mysql = require('mysql2/promise');

// Create a connection pool with a limit of 10 connections
const pool = mysql.createPool({
  host: process.env.MYSQL_DB_HOST,
  user: process.env.MYSQL_DB_USER,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB,
  connectionLimit: 10,
});

// Function to execute a query
async function query(sql, params) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
}

module.exports = {
  query,
};