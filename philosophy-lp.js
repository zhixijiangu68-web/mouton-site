// Interest events only. External checkout clicks are never recorded as purchases.
(() => {
  const events = { sample: 'philosophy_sample_click', preview: 'philosophy_preview_click', checkout: 'philosophy_checkout_click' };
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-ph-action]');
    const name = link && events[link.dataset.phAction];
    if (!name || typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      product_id: link.dataset.phProduct,
      placement: link.dataset.phPlacement,
      transport_type: 'beacon'
    });
  });
})();
