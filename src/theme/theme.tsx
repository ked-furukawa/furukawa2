// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        background: {
        default: '#f0f0f0',  // ← 背景色をここで定義
        },
        primary: {
        main: '#1976d2',     // プライマリ色
        },
        secondary: {
        main: '#008080',     // セカンダリ色
        }
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
    },
});

export default theme;
