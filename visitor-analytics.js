// Device fingerprinting library (clientjs) kullanarak fingerprint oluştur
(async function() {
  // Dynamically load clientjs if not present
  if (!window.ClientJS) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/clientjs/0.1.11/client.min.js";
    document.head.appendChild(script);
    await new Promise(resolve => { script.onload = resolve; });
  }
  const client = new window.ClientJS();
  const fingerprint = client.getFingerprint().toString();

  // GDPR Banner
  if (!localStorage.getItem("consent")) {
    const gdprBanner = document.createElement("div");
    gdprBanner.innerHTML = `
      <div style="position:fixed;bottom:0;left:0;width:100%;background:#222;color:#fff;padding:14px 8px;z-index:9999;text-align:center;">
        Ce site utilise des cookies pour analyser le trafic. <button id="consentBtn" style="margin-left:12px;padding:7px 21px;border:none;background:#02d9d9;color:#fff;border-radius:6px;cursor:pointer;">Accepter</button>
      </div>`;
    document.body.appendChild(gdprBanner);
    document.getElementById("consentBtn").onclick = function() {
      localStorage.setItem("consent", "true");
      document.body.removeChild(gdprBanner);
      window.location.reload();
    };
  }

  // Track main visit
  if (localStorage.getItem("consent")) {
    fetch('/api/track', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userAgent: navigator.userAgent,
        page: window.location.pathname,
        referrer: document.referrer,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        fingerprint,
        consent: true
      })
    })
    .then(r => r.json())
    .then(data => {
      // Event tracking örnekleri
      const visitorId = data.visitorId;
      // Scroll event
      window.addEventListener("scroll", throttle(function() {
        fetch('/api/event', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            visitorId,
            eventType: "scroll",
            eventData: { scrollY: window.scrollY }
          })
        });
      }, 2000));
      // Button click events
      document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
          fetch('/api/event', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              visitorId,
              eventType: "button_click",
              eventData: { text: btn.innerText || "", id: btn.id || "" }
            })
          });
        });
      });
      // Time on page
      let enterTime = Date.now();
      window.addEventListener("beforeunload", function() {
        fetch('/api/event', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            visitorId,
            eventType: "time_on_page",
            eventData: { duration: Math.round((Date.now()-enterTime)/1000) }
          })
        });
      });
    });
  }

  // Utility: throttle
  function throttle(fn, wait) {
    let time = Date.now();
    return function(...args) {
      if ((time + wait - Date.now()) < 0) {
        fn(...args);
        time = Date.now();
      }
    };
  }
})();
