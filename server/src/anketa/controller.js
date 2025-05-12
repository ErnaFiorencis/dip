const pool = require('../../db');

const submitAnketa = async (req, res) => {
  const {game_mode, zabava, motivacija, ponovio_bi, najvise_svidjelo } = req.body;
  const student_id = req.decoded.user_id;

  try {
    const result = await pool.query(
      `INSERT INTO anketa (student_id, game_mode, zabava, motivacija, ponovio_bi, najvise_svidjelo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [student_id, game_mode, zabava, motivacija, ponovio_bi, najvise_svidjelo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Greška pri spremanju ankete:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

const getStudentAnkete = async (req, res) => {
  const { student_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM anketa WHERE student_id = $1 ORDER BY created_at DESC`,
      [student_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Greška pri dohvaćanju anketa:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

module.exports = {
    submitAnketa,
    getStudentAnkete,
};  
