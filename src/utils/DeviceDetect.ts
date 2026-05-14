/** True when the game is running on a mobile / touch device. */
export const IS_MOBILE: boolean = (() => {
  try {
    return (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      navigator.maxTouchPoints > 1
    );
  } catch {
    return false;
  }
})();
