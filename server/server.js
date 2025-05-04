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

//midleware
app.use(cors());
app.use(express.json());
app.use("/api/v1/students", studentRoutes)
app.use("/api/v1/classroom", classroomRoutes)
app.use("/api/v1/questions", questionsRoutes)	
app.use("/api/v1/subjects", subjectRoutes) 
app.use("/api/v1/topics", topicRoutes)
app.use("/api/v1/game-sessions", gameSessionRoutes)
app.use("/api/v1/admin", adminRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});