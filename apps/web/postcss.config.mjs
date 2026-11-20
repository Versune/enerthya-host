/**
 * Tailwind v4 runs as a PostCSS plugin. It is a build-time dependency only:
 * the panel ships compiled CSS, so the host needs nothing but `server.js`, and
 * no stylesheet is fetched from anywhere at runtime.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
