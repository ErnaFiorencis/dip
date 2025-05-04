const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "diplomski",
    password: "bazepodataka",
    port: 5432,
})

module.exports = pool