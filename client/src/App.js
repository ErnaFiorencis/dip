import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from "./pages/Login/Login";
import { Welcome } from "./pages/Welcome/Welcome";
import { Register } from './pages/Login/Register';
import { Practice } from './pages/Game/Practice';
import { ComputerCompetition } from './pages/Game/Computer-competition';
import { StudentCompetition } from './pages/Game/Student-competition';
import { AdminPage } from './pages/Admin/AdminPage';
import { Profile } from './pages/Profile/Profile';
import { Leaderboard } from './pages/Leaderboard/Leaderboard';
import { Classroom } from './pages/Classroom/Classroom';
import { AnketaForm } from './pages/Anketa/AnketaForm';
import './App.css';
import './fonts/pixelFont-sproutLands.ttf';


function App(){
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/computer-competition" element={<ComputerCompetition />} />
                <Route path="/student-competition" element={<StudentCompetition />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/classroom/:classroom_id" element={<Classroom />} />
                <Route path="/anketa" element={<AnketaForm />} />
            </Routes>
        </Router>
    );
}

export default App;
