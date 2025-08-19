import { createTheme } from "@mui/material/styles";

const ujTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#FF6F00", // UJ orange
    },
    secondary: {
      main: "#2D2A26", // UJ black/dark
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2D2A26",
      secondary: "#444",
    },
  },
  typography: {
    fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default ujTheme;
