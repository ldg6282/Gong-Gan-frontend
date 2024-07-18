/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard"],
      },
      colors: {
        blue: "#82B4FF",
        cream: "#FDFFE2",
      },
    },
  },
  plugins: [],
};
