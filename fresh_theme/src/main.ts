
import { themeChange } from 'theme-change';
themeChange();

const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const themeChangeControllerInput = document.querySelector('input.theme-change-controller');

if (themeChangeControllerInput instanceof HTMLInputElement) {
  if (theme == 'light' && !themeChangeControllerInput.checked) {
    themeChangeControllerInput.checked = true;
  }
  if (theme == 'dark' && themeChangeControllerInput.checked) {
    themeChangeControllerInput.checked = false;
  }
}
