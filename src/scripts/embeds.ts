// YouTube embed behavior — the enhancement layer over two server-rendered
// patterns:
//
// 1. [data-facade] buttons (signature moments): thumbnail + play button in
//    the page; clicking swaps the button for an autoplay iframe in place.
// 2. [data-dialog-video] race-card buttons: open the shared <dialog>
//    lightbox and inject the iframe there; closing removes it (stops
//    playback).
//
// In both cases the iframe uses youtube-nocookie.com and exists only after
// an explicit user click. Both triggers are server-rendered as plain <a>
// links to youtube.com, so with JS disabled they still work — this script
// intercepts the click and upgrades the experience to an inline embed.

// Both triggers are real anchors to youtube.com, so a ctrl/cmd/shift-click
// (or a middle click) must keep its native "open in a new tab" meaning
// instead of being hijacked into an in-page embed.
function isPlainClick(event: MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function iframeFor(videoId: string, title: string): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  frame.title = title;
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  frame.allowFullscreen = true;
  frame.style.cssText = 'width:100%;aspect-ratio:16/9;border:0;display:block;';
  return frame;
}

/* In-place facades (signature moments) */
document.addEventListener('click', (event) => {
  const facade = (event.target as HTMLElement).closest<HTMLElement>('[data-facade]');
  if (!facade || !isPlainClick(event)) return;
  event.preventDefault();
  const { videoId, videoTitle } = facade.dataset;
  if (!videoId) return;
  const frame = iframeFor(videoId, videoTitle ?? 'YouTube video');
  facade.replaceWith(frame);
  frame.focus();
});

/* Dialog lightbox (race cards) */
const dialog = document.getElementById('video-dialog') as HTMLDialogElement | null;

if (dialog) {
  const slot = dialog.querySelector<HTMLElement>('.dialog-video')!;
  const heading = dialog.querySelector<HTMLElement>('.dialog-title')!;

  // Announce the real behavior: server-rendered these are plain links (so
  // they still work with JS off), but here they open a modal. Set from JS
  // so the promise is only made when the lightbox actually exists.
  document
    .querySelectorAll('[data-dialog-video]')
    .forEach((el) => el.setAttribute('aria-haspopup', 'dialog'));

  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-dialog-video]');
    if (!button || !isPlainClick(event)) return;
    event.preventDefault();
    const { dialogVideo, dialogTitle } = button.dataset;
    if (!dialogVideo) return;
    heading.textContent = dialogTitle ?? '';
    slot.replaceChildren(iframeFor(dialogVideo, dialogTitle ?? 'Race highlights'));
    dialog.showModal();
  });

  // Closing by any route (Esc, ✕, backdrop click) must remove the iframe,
  // otherwise audio keeps playing into the void.
  dialog.addEventListener('close', () => slot.replaceChildren());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close(); // backdrop
  });
}
