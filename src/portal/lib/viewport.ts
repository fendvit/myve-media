import { useEffect } from "react";

/** A focused element that brings up the on-screen keyboard. */
function isTextEntry(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "range", "file", "submit", "reset", "color"].includes(
      element.type,
    );
  }
  return (element as HTMLElement).isContentEditable === true;
}

/**
 * Keeps the shell exactly as tall as the part of the screen the keyboard leaves
 * free, and tells the CSS when the keyboard is up.
 *
 * `100dvh` alone is not enough. Android's native build resizes the WebView
 * itself (MainActivity), and Chrome does with `interactive-widget` in the
 * viewport meta — but iOS never resizes the layout viewport for the keyboard.
 * It shrinks only the *visual* viewport and scrolls the page underneath, which
 * pushes the header off the top and leaves the composer behind the keys. So
 * the shell takes its height from visualViewport and the page is pinned back
 * to the top whenever iOS pans it.
 *
 * `data-portal-keyboard="open"` on <html> is what hides the tab bar while
 * typing: a phone keyboard plus a tab bar plus a composer left a sliver of
 * thread. Focus alone is not the signal — Android's back button closes the
 * keyboard without blurring the field — so it takes focus *and* a visibly
 * shrunken viewport.
 */
export function useViewportFit() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Pinch-zoom also shrinks the visual viewport. Following it there would
        // squash the whole app into the zoomed rectangle, and scrolling back to
        // the top would fight the user's own panning.
        if (Math.abs(viewport.scale - 1) > 0.01) return;

        root.style.setProperty("--portal-vvh", `${Math.round(viewport.height)}px`);
        if (window.scrollY !== 0) window.scrollTo(0, 0);

        const shrunk = viewport.height < window.screen.height * 0.75;
        const open = shrunk && isTextEntry(document.activeElement);
        if (open) root.dataset.portalKeyboard = "open";
        else delete root.dataset.portalKeyboard;
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
      root.style.removeProperty("--portal-vvh");
      delete root.dataset.portalKeyboard;
    };
  }, []);
}
