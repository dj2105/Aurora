(() => {
  const toast = document.getElementById("install-toast");
  const offlineToast = document.getElementById("offline-toast");
  const updateToast = document.getElementById("update-toast");
  const DISMISS_KEY = "aurora-install-dismissed";

  function readDismissed() {
    try {
      return localStorage.getItem(DISMISS_KEY) === "true";
    } catch (error) {
      return false;
    }
  }

  function writeDismissed() {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  }

  function showToast(content, actions = []) {
    if (!toast) return;
    toast.innerHTML = "";
    const message = document.createElement("span");
    message.textContent = content;
    toast.appendChild(message);

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", action.onClick);
      toast.appendChild(button);
    });

    toast.hidden = false;
  }

  function hideToast() {
    if (!toast) return;
    toast.hidden = true;
  }

  function showOfflineToast(message) {
    if (!offlineToast) return;
    offlineToast.textContent = message;
    offlineToast.hidden = false;
    setTimeout(() => {
      offlineToast.hidden = true;
    }, 4000);
  }

  function showUpdateToast(registration) {
    if (!updateToast || !registration?.waiting) return;
    updateToast.innerHTML = "";
    const message = document.createElement("span");
    message.textContent = "Update available";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Refresh";
    button.addEventListener("click", () => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
    updateToast.appendChild(message);
    updateToast.appendChild(button);
    updateToast.hidden = false;
  }

  function setupUpdateHandling(registration) {
    if (!registration) return;
    if (registration.waiting) {
      showUpdateToast(registration);
    }
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateToast(registration);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    const baseHref = document.querySelector("base")?.getAttribute("href") ?? "/";
    const baseUrl = new URL(baseHref, window.location.origin);
    const swUrl = new URL("sw.js", baseUrl);
    try {
      const registration = await navigator.serviceWorker.register(swUrl.href);
      setupUpdateHandling(registration);
      return registration;
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
    return null;
  }

  function setupInstallPrompt() {
    if (!toast) return;
    if (readDismissed() || isStandalone()) return;

    if (isIos()) {
      showToast("Install: Share → Add to Home Screen", [
        {
          label: "Dismiss",
          onClick: () => {
            writeDismissed();
            hideToast();
          },
        },
      ]);
      return;
    }

    let deferredPrompt;
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      showToast("Install Aurora Trip for offline access", [
        {
          label: "Install",
          onClick: async () => {
            hideToast();
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
          },
        },
        {
          label: "Later",
          onClick: () => {
            writeDismissed();
            hideToast();
          },
        },
      ]);
    });
  }

  function setupOfflineHandling() {
    window.addEventListener("offline", () => {
      showOfflineToast("Offline \u2014 showing cached content");
    });
    window.addEventListener("online", () => {
      showOfflineToast("Back online");
    });
  }

  function initPwa() {
    registerServiceWorker();
    setupInstallPrompt();
    setupOfflineHandling();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPwa);
  } else {
    initPwa();
  }
})();
