/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                rubik: ['Rubik', 'sans-serif'],
            },
            animation: {
                shine: 'shine 2s infinite linear',
            },
            keyframes: {
                shine: {
                    '0%': { left: '-100%' },
                    '100%': { left: '200%' },
                }
            }
        },
    },
    plugins: [],
}
