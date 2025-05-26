import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import { ThemeProvider} from '@mui/material/styles';
import { CssBaseline } from "@mui/material";
import theme from './theme/theme.tsx';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* MUIのデフォルトスタイルをリセット＆背景色反映 */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
