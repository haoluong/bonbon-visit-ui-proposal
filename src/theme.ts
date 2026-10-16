export const theme = {
  text: {
    primary: "#141414",
    secondary: "rgba(20, 20, 20, 0.74)",
    tertiary: "rgba(20, 20, 20, 0.58)",
    quaternary: "rgba(20, 20, 20, 0.36)",
    link: "#1f6feb",
    onAccent: "#ffffff",
  },
  bg: {
    page: "#ffffff",
    phone: "#ffffff",
  },
  fill: {
    primary: "rgba(20, 20, 20, 0.2)",
    secondary: "rgba(20, 20, 20, 0.12)",
    tertiary: "rgba(20, 20, 20, 0.07)",
    quaternary: "rgba(20, 20, 20, 0.04)",
  },
  stroke: {
    primary: "rgba(20, 20, 20, 0.2)",
    secondary: "rgba(20, 20, 20, 0.14)",
    tertiary: "rgba(20, 20, 20, 0.09)",
  },
  accent: {
    primary: "#12a150",
    button: "#0f1b33",
  },
  category: {
    yellow: "#a16207",
    blue: "#1d4ed8",
    orange: "#c2410c",
    green: "#15803d",
    red: "#b91c1c",
  },
  callout: {
    neutral: "rgba(20, 20, 20, 0.04)",
    info: "rgba(29, 78, 216, 0.06)",
  },
} as const;

export type Theme = typeof theme;
