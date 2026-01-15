// Html data theme attribute must be set to 'light' or 'dark' as soon as possible to avoid theme change flash.
// @see src/main.ts; Using theme change library to manage theme change event.
// @see src/main.css; Using default or light theme or dark theme by data-theme attribute on :root (html) & :host[data-theme="ligth|dark"] (:host[data-theme="ligth|dark"]).
const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', theme);
