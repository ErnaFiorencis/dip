const Pool = require("pg").Pool;

/*
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "diplomski",
    password: "bazepodataka",
    port: 5432,
})
*/
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
module.exports = pool