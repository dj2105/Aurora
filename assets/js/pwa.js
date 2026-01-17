(() => {
  const toast = document.getElementById("install-toast");
  const offlineToast = document.getElementById("offline-toast");
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

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  }

  function setupInstallPrompt() {
    if (!toast) return;
    if (readDismissed() || isStandalone()) return;

    if (isIos()) {
      showToast("Install: Share â†’ Add to Home Screen", [
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
      showOfflineToast("Offline â€” showing cached content");
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
