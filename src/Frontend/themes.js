// function to set a given theme/color-scheme
export function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
}
// function to toggle between light and dark theme
export function lightTheme() {
    setTheme('site-theme-light');
}
export function darkTheme() {
    setTheme('site-theme-dark');
}