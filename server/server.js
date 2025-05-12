const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./db');
const studentRoutes = require("./src/student/routes")
const classroomRoutes = require("./src/classroom/routes")
const questionsRoutes = require("./src/questions/routes")
const subjectRoutes = require("./src/subjects/routes")
const topicRoutes = require("./src/topics/routes")
const gameSessionRoutes = require("./src/game-sessions/routes")
const adminRoutes = require("./src/admin/routes")
const anketaRoutes = require("./src/anketa/routes")

//midleware
app.use(cors());
app.use(express.json());
app.use("/students", studentRoutes)
app.use("/classroom", classroomRoutes)
app.use("/questions", questionsRoutes)	
app.use("/subjects", subjectRoutes) 
app.use("/topics", topicRoutes)
app.use("/game-sessions", gameSessionRoutes)
app.use("/admin", adminRoutes)
app.use("/anketa", anketaRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});