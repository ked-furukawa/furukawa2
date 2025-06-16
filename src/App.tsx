// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DepartmentPage from './pages/DepartmentPage';
import HomePage from './pages/HomePage';



const App: React.FC = () => {

  return (

        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:departmentId" element={<DepartmentPage />} />
          </Routes>
          
        </Router>
  );
};


export default App;
