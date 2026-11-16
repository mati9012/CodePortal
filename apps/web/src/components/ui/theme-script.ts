// Zwykły moduł (nie "use client"), bo importuje go layout serwerowy.
export const THEME_STORAGE_KEY = "cp-theme";

/** Wstrzykiwany w <head> — ustawia data-theme, zanim strona się namaluje. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
