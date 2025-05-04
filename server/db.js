const Pool = require("pg").Pool;

let pool; // Define pool outside the blocks

if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set, using local database configuration.");
    pool = new Pool({
        user: "postgres",
        host: "localhost",
        database: "diplomski",
        password: "bazepodataka",
        port: 5432,
    });
} else {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

module.exports = pool;