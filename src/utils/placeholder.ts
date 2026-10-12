export const PLACEHOLDER_IMAGE = `${process.env.PUBLIC_URL}/placeholder-home.png`;

// for images React doesn't re-render (map popups, gallery): swap in the house once, never loop if it fails too
export const showPlaceholder = (image: HTMLImageElement) => {
  if (image.dataset.placeholder) return;
  image.dataset.placeholder = 'true';
  image.onerror = null;
  image.src = PLACEHOLDER_IMAGE;
  image.classList.add('placeholder-img');
};
