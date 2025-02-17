import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/loginPage';

function App() {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<LoginPage />} />

        </Routes>
      </main>
    </Router>
  );
}

export default App;
