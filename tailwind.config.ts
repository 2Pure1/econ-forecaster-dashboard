import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
                display: ["var(--font-syne)", "sans-serif"],
                mono: ["var(--font-mono)", "monospace"],
            },
            colors: {
                background: "#0a0d12",
                accent: {
                    green: "#00e5a0",
                    cyan: "#00d4ff",
                    amber: "#ffb547",
                    red: "#ff4757",
                },
                border: "rgba(255, 255, 255, 0.1)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
        },
    },
    plugins: [],
    darkMode: "class",
};
export default config;
