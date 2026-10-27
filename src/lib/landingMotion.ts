/** Native document scroll — skip GSAP smoother/pin on phones & tablets. */
export function preferNativeLandingScroll() {
  if (typeof window === "undefined") return true;
  return window.matchMedia(
    "(max-width: 1023px), (hover: none) and (pointer: coarse)"
  ).matches;
}
