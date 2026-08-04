export const THEME_TIMEZONE = "Europe/Madrid";

export function getHourInTimezone(
  date = new Date(),
  timeZone = THEME_TIMEZONE
): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(date),
    10
  );
}

export function isNightHour(hour: number): boolean {
  return hour >= 21 || hour < 7;
}

export function getThemePeriod(date = new Date()): "day" | "night" {
  return isNightHour(getHourInTimezone(date)) ? "night" : "day";
}

export function getAutoTheme(date = new Date()): "light" | "dark" {
  return getThemePeriod(date) === "night" ? "dark" : "light";
}

export function clearExpiredManualOverride(): void {
  try {
    if (localStorage.getItem("theme-manual") !== "1") return;

    const manualPeriod = localStorage.getItem("theme-manual-period");
    const currentPeriod = getThemePeriod();

    if (manualPeriod && manualPeriod !== currentPeriod) {
      localStorage.removeItem("theme-manual");
      localStorage.removeItem("theme-manual-period");
    }
  } catch {
    // ignore
  }
}

export function isThemeManualOverride(): boolean {
  try {
    clearExpiredManualOverride();
    return localStorage.getItem("theme-manual") === "1";
  } catch {
    return false;
  }
}

export function setThemeManualOverride(): void {
  try {
    localStorage.setItem("theme-manual", "1");
    localStorage.setItem("theme-manual-period", getThemePeriod());
  } catch {
    // ignore
  }
}

export function applyAutoThemeToStorage(): "light" | "dark" | null {
  if (isThemeManualOverride()) return null;

  const theme = getAutoTheme();
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore
  }
  return theme;
}

export const AUTO_THEME_INLINE_SCRIPT = `(function(){try{var tz='Europe/Madrid';var h=parseInt(new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'numeric',hour12:false}).format(new Date()),10);var period=(h>=21||h<7)?'night':'day';var manual=localStorage.getItem('theme-manual');if(manual==='1'){var mp=localStorage.getItem('theme-manual-period');if(mp&&mp!==period){localStorage.removeItem('theme-manual');localStorage.removeItem('theme-manual-period');manual=null;}}if(manual!=='1'){localStorage.setItem('theme',period==='night'?'dark':'light');}}catch(e){}})();`;