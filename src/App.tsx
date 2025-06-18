// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DepartmentPage from './pages/DepartmentPage';
import HomePage from './pages/HomePage';
import SubDepartmentSelector from './pages/SubDepartmentSelector';



const App: React.FC = () => {

  return (

        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/kakou" element={<SubDepartmentSelector />} />
            <Route path="/namashitsu" element={<SubDepartmentSelector />} />
            <Route path="/:departmentId" element={<DepartmentPage />} />
          </Routes>
          
        </Router>
  );
};


export default App;
