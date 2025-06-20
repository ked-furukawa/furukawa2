// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        background: {
        default: '#f0f0f0',  // ← 背景色をここで定義
        },
        primary: {
            main: '#1976d2',     // プライマリ色(青系)
            light: '#00bfff'
        },
        secondary: {
        main: '#008080',     // セカンダリ色(自由枠、暫定深緑)
        },
        success:{ //緑系
            main: '#00cc00',
            light: '#66cc66'
        },
        error:{ //赤系
            main: '#dc143c',
            light: '#ff6666'
        },
        warning:{ //黄系
            main: '#F28C28',
            light: '#F28C28'

        }
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
    },
});

export default theme;
