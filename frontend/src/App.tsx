import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="main-wrapper">
          <Sidebar />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/video/:id" element={<div style={{color: 'white'}}>Video Player Page Comming Soon!</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
