// HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [department, setDepartment] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (department) {
      navigate(`/${department}`);
    }
  };

  return (
    <div>
      <h1>部門選択ページ</h1>
      <form onSubmit={handleSubmit}>
        <label>
          部門を選択:
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="">-- 選択してください --</option>
            <option value="furukawa">古川（テスト用）</option>
            <option value="kurosawa">黒澤（テスト用）</option>
            <option value="sakurai">櫻井（テスト用）</option>
          </select>
        </label>
        <button type="submit" disabled={!department}>決定</button>
      </form>
    </div>
  );
};

export default HomePage;
