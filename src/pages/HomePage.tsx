// HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Box, Button, Container, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

const HomePage: React.FC = () => {
  const [department, setDepartment] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (department) {
      navigate(`/${department}`);
    }
  };
  
    // アカウント作成時にdepartmentIdを決める
  const formFields = {
    signUp: {
      "custom:departmentId": {
        label: "部門ID",
        order: 1,
      },
    },
  };

  return (
        <Authenticator hideSignUp={false} formFields={formFields}>
          {({ signOut }) => (
  <Container maxWidth="sm">
      <Box mt={5} p={4} boxShadow={3} borderRadius={2}>
        <Typography variant="h4" gutterBottom>
          部門選択ページ
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="department-label">部門を選択</InputLabel>
            <Select
              labelId="department-label"
              value={department}
              label="部門を選択"
              onChange={(e) => setDepartment(e.target.value)}
            >
              <MenuItem value="">-- 選択してください --</MenuItem>
              <MenuItem value="furukawa">古川（テスト用）</MenuItem>
              <MenuItem value="kurosawa">黒澤（テスト用）</MenuItem>
              <MenuItem value="sakurai">櫻井（テスト用）</MenuItem>
              <MenuItem value="office">事務所</MenuItem>
            </Select>
          </FormControl>
          <Box mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={!department}
            >
              決定
            </Button>
          </Box>
        </form>
        <Box mt={2}>
          <Button variant="outlined" color="secondary" fullWidth onClick={signOut}>
            Sign out
          </Button>
        </Box>
      </Box>
    </Container>
          )}
    </Authenticator>
  );
};

export default HomePage;
