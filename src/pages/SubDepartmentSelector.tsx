import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from '@mui/material';

// 親部門に応じたサブ部門リスト定義
const subDepartmentMap: Record<string, { value: string; label: string }[]> = {
    kakou: [
        { value: 'kakou1', label: '加工部門 通常仕分け' },
        { value: 'kakou2', label: '加工部門 柔らかロースとんかつ' },
    ],
    namashitsu: [
        { value: 'namashitsu1', label: '原信水産部門　青Box' },
        { value: 'namashitsu2', label: '原信精肉部門　橙Box' },
    ],
};

const SubDepartmentSelector: React.FC = () => {
    const [selected, setSelected] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const basePath = location.pathname.replace('/', ''); // kakou, buturyu など

    const options = subDepartmentMap[basePath];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selected) {
        navigate(`/${selected}`);
        }
    };

    if (!options) {
        return (
        <Container maxWidth="sm">
            <Box mt={5} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h5" color="error">
                無効なアクセスです（部門情報が存在しません）
            </Typography>
            </Box>
        </Container>
        );
    }

    const goHome = () => {
        navigate('/');
    };

    return (
        <Container maxWidth="sm">
        <Box mt={5} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h4" gutterBottom>
            {basePath === 'kakou' ? '加工部門 選択ページ' : '生室部門 選択ページ'}
            </Typography>
            <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
                <InputLabel id="subdept-label">部門を選択</InputLabel>
                <Select
                labelId="subdept-label"
                value={selected}
                label="部門を選択"
                onChange={(e) => setSelected(e.target.value)}
                >
                <MenuItem value="">-- 選択してください --</MenuItem>
                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                    </MenuItem>
                ))}
                </Select>
            </FormControl>
            <Box mt={2}>
                <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!selected}
                >
                決定
                </Button>
            </Box>
            </form>
            <Box mt={2}>
                <Button variant="outlined" color="primary" fullWidth onClick={goHome}>
                トップページに戻る
                </Button>
            </Box>
        </Box>
        </Container>
    );
};

export default SubDepartmentSelector;