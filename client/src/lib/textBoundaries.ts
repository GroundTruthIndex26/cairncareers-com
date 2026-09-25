/**
 * Prerender crawl only: keeps adjacent text nodes apart in the captured HTML.
 *
 * JSX such as `{label} <Icon />` or `Free until {date}` renders as two or more
 * sibling text nodes. Serialising the DOM merges them into one, and
 * hydrateRoot then finds one text node where it expects two, rejects the
 * prerendered HTML and paints the whole page again. react-dom/server avoids
 * this by writing an empty comment between them; this does the same inside the
 * crawling browser, so scripts/prerender.mjs captures markup React can adopt.
 * React skips these comments while hydrating.
 *
 * Runs only when navigator.webdriver is set (the headless prerender browser),
 * and watches #root so text React renders after the first pass is covered too.
 */
export function markTextBoundariesForPrerender(root: HTMLElement) {
  if (typeof navigator === "undefined" || !navigator.webdriver) return;

  const mark = () => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const splits: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nextSibling?.nodeType === Node.TEXT_NODE) splits.push(node as Text);
    }
    for (const node of splits) node.after(document.createComment(" "));
  };

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; mark(); });
  }).observe(root, { childList: true, subtree: true, characterData: true });
  mark();
}
