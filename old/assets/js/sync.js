import { initFirebase } from "./firebase.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const SETTINGS_KEY = "aurora-sync-settings-v1";
const UID_KEY = "aurora-sync-uid";
const STATUS = {
  offline: "Offline",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync error (tap to retry)",
};

let firebaseServices = null;
let authUser = null;
let auroraState = null;
let unsubscribeSnapshot = null;
let unsubscribeState = null;
let pendingTimer = null;
let pendingSections = new Set();
let isSyncEnabled = false;
let tripCode = "";
let joinToken = "";
let lastError = null;

const elements = {
  toggle: document.getElementById("sync-toggle"),
  tripCode: document.getElementById("sync-trip-code"),
  joinToken: document.getElementById("sync-join-token"),
  status: document.getElementById("sync-status"),
  create: document.getElementById("sync-create"),
  join: document.getElementById("sync-join"),
  copy: document.getElementById("sync-copy"),
  disconnect: document.getElementById("sync-disconnect"),
  joinTokenValue: document.getElementById("sync-join-token-value"),
  joinTokenReveal: document.getElementById("sync-join-token-reveal"),
};

function readSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { enabled: false, tripCode: "", joinToken: "" };
    const parsed = JSON.parse(stored);
    return {
      enabled: Boolean(parsed?.enabled),
      tripCode: parsed?.tripCode ?? "",
      joinToken: parsed?.joinToken ?? "",
    };
  } catch (error) {
    return { enabled: false, tripCode: "", joinToken: "" };
  }
}

function writeSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      enabled: isSyncEnabled,
      tripCode,
      joinToken,
    })
  );
}

function setStatus(label) {
  if (!elements.status) return;
  elements.status.textContent = label;
  elements.status.dataset.state = label;
}

function normalizeTripCode(value) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function generateCode(length) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }
  return output;
}

function flattenUserItems(remote) {
  const notes = Array.isArray(remote?.notes) ? remote.notes : [];
  const days = remote?.days && typeof remote.days === "object" ? remote.days : {};
  const flattened = [];
  notes.forEach((item) => {
    if (!item?.id) return;
    flattened.push({
      ...item,
      day: null,
      deleted: Boolean(item.deleted),
    });
  });
  Object.entries(days).forEach(([day, items]) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item?.id) return;
      flattened.push({
        ...item,
        day,
        deleted: Boolean(item.deleted),
      });
    });
  });
  return flattened;
}

function splitUserItems(items) {
  const notes = [];
  const days = {};
  items.forEach((item) => {
    const payload = { ...item };
    delete payload.day;
    if (item.day) {
      if (!days[item.day]) days[item.day] = [];
      days[item.day].push(payload);
    } else {
      notes.push(payload);
    }
  });
  return { notes, days };
}

function mergeItems(primary, secondary) {
  const map = new Map();
  primary.forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, item);
  });
  secondary.forEach((item) => {
    if (!item?.id) return;
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function mergeCopyPhraseItems(primary, secondary) {
  const map = new Map();
  const addItem = (item, isSecondary) => {
    if (!item?.id) return;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }
    const existingUpdated = Number(existing.updatedAt ?? 0);
    const nextUpdated = Number(item.updatedAt ?? 0);
    if (nextUpdated > existingUpdated) {
      map.set(item.id, item);
    } else if (nextUpdated === existingUpdated && isSecondary) {
      map.set(item.id, item);
    }
  };
  primary.forEach((item) => addItem(item, false));
  secondary.forEach((item) => addItem(item, true));
  return Array.from(map.values());
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function ensureAuth() {
  if (!firebaseServices) return null;
  if (firebaseServices.auth.currentUser) {
    authUser = firebaseServices.auth.currentUser;
    return authUser;
  }
  await signInAnonymously(firebaseServices.auth);
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      if (!user) return;
      authUser = user;
      localStorage.setItem(UID_KEY, user.uid);
      unsubscribe();
      resolve(user);
    });
  });
}

function getState() {
  return auroraState?.getState?.() ?? null;
}

function buildRemotePayload(sections) {
  const state = getState();
  if (!state) return null;
  const payload = {};

  if (sections.includes("gear")) {
    payload.gear = {
      items: state.outingGear.items,
      updatedAt: serverTimestamp(),
    };
  }

  if (sections.includes("pills")) {
    payload.pills = {
      entries: state.pills,
      updatedAt: serverTimestamp(),
    };
  }

  if (sections.includes("userItems")) {
    payload.userItems = {
      ...splitUserItems(state.userItems),
      updatedAt: serverTimestamp(),
    };
  }

  if (sections.includes("checklist")) {
    payload.checklist = {
      state: state.checklist,
      updatedAt: serverTimestamp(),
    };
  }

  if (sections.includes("copyPhrases")) {
    payload.copyPhrases = {
      items: state.copyPhrases?.items ?? [],
      updatedAt: serverTimestamp(),
    };
  }

  if (sections.includes("ui")) {
    payload.ui = {
      bigText: Boolean(state.ui?.bigText),
      updatedAt: serverTimestamp(),
    };
  }

  payload.updatedAt = serverTimestamp();
  return payload;
}

async function pushPendingChanges() {
  if (!firebaseServices || !authUser || !tripCode) return;
  if (!pendingSections.size) return;
  if (!navigator.onLine) {
    setStatus(STATUS.offline);
    return;
  }
  const sections = Array.from(pendingSections);
  const payload = buildRemotePayload(sections);
  if (!payload) return;

  setStatus(STATUS.syncing);
  try {
    const tripRef = doc(firebaseServices.db, "trips", tripCode);
    const stateRef = doc(firebaseServices.db, "trips", tripCode, "state", "global");
    await setDoc(stateRef, payload, { merge: true });
    await updateDoc(tripRef, { updatedAt: serverTimestamp(), version: 1 });
    pendingSections = new Set();
    setStatus(STATUS.synced);
  } catch (error) {
    lastError = error;
    setStatus(STATUS.error);
  }
}

function schedulePush(updatedSections) {
  if (!isSyncEnabled || !tripCode) return;
  updatedSections.forEach((section) => pendingSections.add(section));
  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    pushPendingChanges();
  }, 800);
}

function applyRemoteState(remote) {
  const state = getState();
  if (!state) return;

  const updates = {};
  const updatedAt = {};
  const updatedSections = [];
  const pendingLocalSections = [];

  const remoteGearUpdated = timestampToMillis(remote?.gear?.updatedAt ?? remote?.updatedAt);
  const remotePillsUpdated = timestampToMillis(remote?.pills?.updatedAt ?? remote?.updatedAt);
  const remoteUserItemsUpdated = timestampToMillis(remote?.userItems?.updatedAt ?? remote?.updatedAt);
  const remoteChecklistUpdated = timestampToMillis(remote?.checklist?.updatedAt ?? remote?.updatedAt);
  const remoteCopyPhrasesUpdated = timestampToMillis(remote?.copyPhrases?.updatedAt ?? remote?.updatedAt);
  const remoteUiUpdated = timestampToMillis(remote?.ui?.updatedAt ?? remote?.updatedAt);

  if (remoteGearUpdated > (state.updatedAt?.gear ?? 0)) {
    const remoteItems = Array.isArray(remote?.gear?.items) ? remote.gear.items : [];
    updates.outingGear = {
      items: mergeItems(remoteItems, state.outingGear.items),
    };
    updatedAt.gear = remoteGearUpdated;
    updatedSections.push("gear");
  } else if (state.updatedAt?.gear && remoteGearUpdated && state.updatedAt.gear > remoteGearUpdated) {
    pendingLocalSections.push("gear");
  }

  if (remotePillsUpdated > (state.updatedAt?.pills ?? 0)) {
    updates.pills = remote?.pills?.entries ?? {};
    updatedAt.pills = remotePillsUpdated;
    updatedSections.push("pills");
  } else if (state.updatedAt?.pills && remotePillsUpdated && state.updatedAt.pills > remotePillsUpdated) {
    pendingLocalSections.push("pills");
  }

  if (remoteUserItemsUpdated > (state.updatedAt?.userItems ?? 0)) {
    const remoteItems = flattenUserItems(remote?.userItems ?? {});
    updates.userItems = mergeItems(remoteItems, state.userItems);
    updatedAt.userItems = remoteUserItemsUpdated;
    updatedSections.push("userItems");
  } else if (
    state.updatedAt?.userItems &&
    remoteUserItemsUpdated &&
    state.updatedAt.userItems > remoteUserItemsUpdated
  ) {
    pendingLocalSections.push("userItems");
  }

  if (remoteChecklistUpdated > (state.updatedAt?.checklist ?? 0)) {
    updates.checklist = remote?.checklist?.state ?? {};
    updatedAt.checklist = remoteChecklistUpdated;
    updatedSections.push("checklist");
  } else if (
    state.updatedAt?.checklist &&
    remoteChecklistUpdated &&
    state.updatedAt.checklist > remoteChecklistUpdated
  ) {
    pendingLocalSections.push("checklist");
  }

  if (remoteCopyPhrasesUpdated > (state.updatedAt?.copyPhrases ?? 0)) {
    const remoteItems = Array.isArray(remote?.copyPhrases?.items) ? remote.copyPhrases.items : [];
    const localItems = state.copyPhrases?.items ?? [];
    updates.copyPhrases = { items: mergeCopyPhraseItems(remoteItems, localItems) };
    updatedAt.copyPhrases = remoteCopyPhrasesUpdated;
    updatedSections.push("copyPhrases");
  } else if (
    state.updatedAt?.copyPhrases &&
    remoteCopyPhrasesUpdated &&
    state.updatedAt.copyPhrases > remoteCopyPhrasesUpdated
  ) {
    pendingLocalSections.push("copyPhrases");
  }

  if (remoteUiUpdated > (state.updatedAt?.ui ?? 0)) {
    updates.ui = { bigText: Boolean(remote?.ui?.bigText) };
    updatedAt.ui = remoteUiUpdated;
    updatedSections.push("ui");
  } else if (state.updatedAt?.ui && remoteUiUpdated && state.updatedAt.ui > remoteUiUpdated) {
    pendingLocalSections.push("ui");
  }

  if (updatedSections.length) {
    auroraState.setState(updates, { source: "remote", updatedAt });
  }

  if (pendingLocalSections.length) {
    schedulePush(pendingLocalSections);
  }
}

async function initialSync() {
  if (!firebaseServices || !authUser || !tripCode) return;
  const stateRef = doc(firebaseServices.db, "trips", tripCode, "state", "global");
  setStatus(STATUS.syncing);

  try {
    const snapshot = await getDoc(stateRef);
    const data = snapshot.exists() ? snapshot.data() : null;
    if (!data || !Object.keys(data).length) {
      pendingSections = new Set(["gear", "pills", "userItems", "checklist", "copyPhrases", "ui"]);
      await pushPendingChanges();
      return;
    }
    applyRemoteState(data);
  } catch (error) {
    lastError = error;
    setStatus(STATUS.error);
  }
}

function stopSyncListeners() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  if (unsubscribeState) {
    unsubscribeState();
    unsubscribeState = null;
  }
}

async function startSync() {
  if (!isSyncEnabled || !tripCode) return;
  if (!firebaseServices) {
    firebaseServices = initFirebase();
  }
  if (!firebaseServices) {
    setStatus("Firebase not configured");
    return;
  }

  await ensureAuth();
  if (!authUser) return;

  const memberRef = doc(firebaseServices.db, "trips", tripCode, "members", authUser.uid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    setStatus("Join trip to start syncing");
    return;
  }

  stopSyncListeners();
  await initialSync();

  const stateRef = doc(firebaseServices.db, "trips", tripCode, "state", "global");
  unsubscribeSnapshot = onSnapshot(
    stateRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      applyRemoteState(snapshot.data());
      setStatus(STATUS.synced);
    },
    (error) => {
      lastError = error;
      setStatus(STATUS.error);
    }
  );

  if (!unsubscribeState && auroraState?.onChange) {
    unsubscribeState = auroraState.onChange(({ source, updatedSections }) => {
      if (source !== "local") return;
      schedulePush(updatedSections);
    });
  }
}

async function createTrip() {
  if (!firebaseServices) {
    firebaseServices = initFirebase();
  }
  if (!firebaseServices) {
    setStatus("Firebase not configured");
    return;
  }

  await ensureAuth();
  if (!authUser) return;

  let attempts = 0;
  let newCode = "";
  while (attempts < 5) {
    attempts += 1;
    const candidate = generateCode(8);
    const tripRef = doc(firebaseServices.db, "trips", candidate);
    const existing = await getDoc(tripRef);
    if (!existing.exists()) {
      newCode = candidate;
      break;
    }
  }

  if (!newCode) {
    setStatus("Unable to create trip code");
    return;
  }

  const newJoinToken = generateCode(6);
  const tripRef = doc(firebaseServices.db, "trips", newCode);
  const memberRef = doc(firebaseServices.db, "trips", newCode, "members", authUser.uid);

  try {
    await setDoc(tripRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
      joinToken: newJoinToken,
    });
    await setDoc(memberRef, {
      uid: authUser.uid,
      joinedAt: serverTimestamp(),
      joinToken: newJoinToken,
    });
    tripCode = newCode;
    joinToken = newJoinToken;
    isSyncEnabled = true;
    writeSettings();
    updateUi();
    await startSync();
  } catch (error) {
    lastError = error;
    setStatus(STATUS.error);
  }
}

async function joinTrip() {
  const codeValue = normalizeTripCode(elements.tripCode?.value ?? "");
  const tokenValue = (elements.joinToken?.value ?? "").trim();
  if (!codeValue || !tokenValue) {
    setStatus("Enter trip code + join token");
    return;
  }

  if (!firebaseServices) {
    firebaseServices = initFirebase();
  }
  if (!firebaseServices) {
    setStatus("Firebase not configured");
    return;
  }

  await ensureAuth();
  if (!authUser) return;

  const memberRef = doc(firebaseServices.db, "trips", codeValue, "members", authUser.uid);
  try {
    await setDoc(memberRef, {
      uid: authUser.uid,
      joinedAt: serverTimestamp(),
      joinToken: tokenValue,
    });
    tripCode = codeValue;
    joinToken = tokenValue;
    isSyncEnabled = true;
    writeSettings();
    updateUi();
    await startSync();
  } catch (error) {
    lastError = error;
    setStatus("Unable to join trip");
  }
}

function updateUi() {
  if (elements.toggle) elements.toggle.checked = isSyncEnabled;
  if (elements.tripCode) elements.tripCode.value = tripCode;
  if (elements.joinToken) elements.joinToken.value = joinToken;
  if (elements.joinTokenValue) {
    elements.joinTokenValue.textContent = joinToken ? "••••••" : "—";
  }
  if (!navigator.onLine) {
    setStatus(STATUS.offline);
  } else if (isSyncEnabled && tripCode) {
    setStatus(STATUS.synced);
  } else {
    setStatus(STATUS.offline);
  }
}

function revealJoinToken() {
  if (!elements.joinTokenValue) return;
  if (!joinToken) {
    elements.joinTokenValue.textContent = "—";
    return;
  }
  const isHidden = elements.joinTokenValue.dataset.revealed !== "true";
  elements.joinTokenValue.dataset.revealed = String(isHidden);
  elements.joinTokenValue.textContent = isHidden ? joinToken : "••••••";
  if (elements.joinTokenReveal) {
    elements.joinTokenReveal.textContent = isHidden ? "Hide join token" : "Show join token";
  }
}

async function copyTripCode() {
  if (!tripCode) return;
  try {
    await navigator.clipboard.writeText(tripCode);
    setStatus("Trip code copied");
    setTimeout(() => setStatus(STATUS.synced), 1500);
  } catch (error) {
    setStatus("Unable to copy");
  }
}

function disconnectSync() {
  isSyncEnabled = false;
  writeSettings();
  stopSyncListeners();
  setStatus(STATUS.offline);
  updateUi();
}

function retryIfError() {
  if (lastError) {
    lastError = null;
    startSync();
  }
}

function handleToggle() {
  isSyncEnabled = elements.toggle?.checked ?? false;
  writeSettings();
  if (isSyncEnabled) {
    if (elements.tripCode) {
      tripCode = normalizeTripCode(elements.tripCode.value);
    }
    writeSettings();
    startSync();
  } else {
    disconnectSync();
  }
}

function handleTripCodeInput() {
  tripCode = normalizeTripCode(elements.tripCode?.value ?? "");
  if (elements.tripCode) {
    elements.tripCode.value = tripCode;
  }
  writeSettings();
}

function handleJoinTokenInput() {
  joinToken = (elements.joinToken?.value ?? "").trim();
  writeSettings();
}

function attachListeners() {
  elements.toggle?.addEventListener("change", handleToggle);
  elements.tripCode?.addEventListener("input", handleTripCodeInput);
  elements.joinToken?.addEventListener("input", handleJoinTokenInput);
  elements.create?.addEventListener("click", createTrip);
  elements.join?.addEventListener("click", joinTrip);
  elements.copy?.addEventListener("click", copyTripCode);
  elements.disconnect?.addEventListener("click", disconnectSync);
  elements.status?.addEventListener("click", retryIfError);
  elements.joinTokenReveal?.addEventListener("click", revealJoinToken);

  window.addEventListener("online", () => {
    if (isSyncEnabled && tripCode) {
      startSync();
      return;
    }
    setStatus(STATUS.offline);
  });
  window.addEventListener("offline", () => setStatus(STATUS.offline));
}

function bootstrap() {
  auroraState = window.AuroraState;
  if (!auroraState) return;
  const settings = readSettings();
  isSyncEnabled = settings.enabled;
  tripCode = settings.tripCode;
  joinToken = settings.joinToken;
  updateUi();
  attachListeners();
  if (isSyncEnabled && tripCode) {
    startSync();
  }
}

if (window.AuroraState?.ready) {
  bootstrap();
} else {
  window.addEventListener("aurora-state-ready", bootstrap, { once: true });
}
