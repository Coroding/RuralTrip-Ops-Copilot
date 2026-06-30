export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "Microsoft YaHei", "system-ui", "sans-serif"]
      },
      boxShadow: {
        phone: "0 28px 80px rgba(15, 23, 42, .22)",
        soft: "0 10px 24px rgba(20, 54, 47, .14)"
      }
    }
  },
  plugins: []
};
