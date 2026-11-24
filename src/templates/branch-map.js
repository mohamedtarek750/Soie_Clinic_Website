// Leave the directions link usable if scripts or third-party frames are blocked.
document.addEventListener('click', function (event) {
  const link = event.target.closest('a[data-embed-map]');
  if (!link || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const preview = link.querySelector('svg');
  if (!preview) return;
  event.preventDefault();
  const frame = document.createElement('iframe');
  frame.title = link.textContent.trim();
  frame.width = '560';
  frame.height = '320';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.src = link.dataset.embedMap;
  frame.className = 'editorial-map-frame';
  link.before(frame);
  preview.remove();
  frame.focus();
});
