module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // 👈 tells Tailwind where to look
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")], // ✅ optional plugin
};
