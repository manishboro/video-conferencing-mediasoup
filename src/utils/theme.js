import { createTheme } from "@mui/material/styles";

// Create a theme instance.
let theme = createTheme({
  typography: {
    fontFamily: "Montserrat, Open Sans, Fjalla One",
    htmlFontSize: 10,
    h1: { fontSize: "4rem" },
    h2: { fontSize: "3rem" },
    h3: { fontSize: "2rem" },
    h6: { fontSize: "6.5rem" },
    body1: { fontSize: "1.8rem" },
    body2: { fontSize: "1.7rem" },
    subtitle1: { fontSize: "1.6rem" },
    subtitle2: { fontSize: "1.4rem" },
    subtitle3: { fontSize: "1.2rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        html {
          font-size: 62.5%;
        }
        
        @media only screen and (min-width: 1536px) {
          html {
            font-size: 65%;
          }
        }
        
        @media only screen and (max-width: 1030px) {
          html {
            font-size: 57%;
          }
        }
        
        @media only screen and (max-width: 600px) {
          html {
            font-size: 54%;
          }
        }
     `,
    },
    MuiContainer: {
      styleOverrides: {
        maxWidthMd: { maxWidth: "130rem !important" },
        maxWidthLg: { maxWidth: "100% !important" },
      },
    },
  },
  palette: {
    custom: {
      main: "#fff",
      secondary: "#EFEFEF",
      light: "#00a3c8",
      dark: "#050A30",
      medium: "#10327a",
      text: "#000C66",

      light_blue: "#00a3c8",
      medium_red: "#ff005a",

      dark_grey: "#575757",
    },
  },
});

// theme = responsiveFontSizes(theme);

export default theme;
