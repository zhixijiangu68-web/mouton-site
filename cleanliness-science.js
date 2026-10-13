/* MOUTON RESEARCH 001 analytics.
   GA4 page_view is automatic from base.njk. Never send email addresses or user-entered text. */
(() => {
  const product_id = "cleanliness_001";

  function track(name, parameters = {}) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      product_id,
      ...parameters,
      transport_type: "beacon"
    });
  }

  document.addEventListener("click", (event) => {
    const element = event.target.closest("[data-lp-event]");
    if (!element) return;
    track(element.dataset.lpEvent, {
      placement: element.dataset.placement || "unknown",
      cta_target: element.dataset.ctaTarget || "unknown"
    });
  });

  const printButton = document.querySelector("[data-sample-print]");
  if (printButton) {
    printButton.addEventListener("click", () => {
      // This records use of the print dialog, not a confirmed saved PDF.
      track("sample_print_click", {
        placement: "sample_toolbar",
        cta_target: "pdf_print"
      });
      window.print();
    });
  }

  const form = document.querySelector("#cleanliness-waitlist");
  if (form) {
    form.addEventListener("submit", () => {
      // Attempt only. Registration success must be confirmed by the email provider.
      track("waitlist_submit", {
        placement: "waitlist_form",
        cta_target: "waitlist"
      });
    });
  }
})();
