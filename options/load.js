const $ = (sel) => document.querySelector(sel);

const iconPreview = $("#iconPreview");
const iconInput = $("#iconInput");
const signatureInput = $("#signatureInput");
const charCount = $("#charCount");
const profileMsg = $("#profileMsg");
const dataMsg = $("#dataMsg");

let currentIconBase64 = "";  // data-URL or "" (reset)
let iconChanged = false;      // track whether user changed the icon this session

/* ---- Helpers ---- */

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = "msg " + type;
  setTimeout(() => { el.textContent = ""; el.className = "msg"; }, 3000);
}

function sendMsg(type, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...data }, (res) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(res);
      }
    });
  });
}

/**
 * Read a File as a data-URL (base64).
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/* ---- Settings load ---- */

function loadSettings() {
  // extension_icon is stored in local (no cross-device sync needed, avoids 8 KB sync limit)
  // profile_signature stays in sync so it follows the user across devices
  chrome.storage.local.get(["extension_icon"], (localData) => {
    currentIconBase64 = localData.extension_icon || "";
    if (currentIconBase64) {
      iconPreview.style.backgroundImage = `url(${currentIconBase64})`;
    }
  });
  chrome.storage.sync.get(["profile_signature"], (syncData) => {
    signatureInput.value = syncData.profile_signature || "";
    charCount.textContent = signatureInput.value.length;
  });
}

/* ---- Icon selection ---- */

$("#btnChooseIcon").addEventListener("click", () => iconInput.click());

iconInput.addEventListener("change", async () => {
  const file = iconInput.files[0];
  if (!file) return;
  try {
    currentIconBase64 = await readFileAsDataURL(file);
    iconPreview.style.backgroundImage = `url(${currentIconBase64})`;
    iconChanged = true;
  } catch (e) {
    showMsg(profileMsg, e.message, "error");
  }
  iconInput.value = "";
});

$("#btnRemoveIcon").addEventListener("click", () => {
  currentIconBase64 = "";
  iconChanged = true;
  iconPreview.style.backgroundImage = "";
});

signatureInput.addEventListener("input", () => {
  charCount.textContent = signatureInput.value.length;
});

/* ---- Save ---- */

$("#btnSaveSettings").addEventListener("click", async () => {
  const signature = signatureInput.value.trim().slice(0, 100);

  // 1. Save or remove icon in local storage (no 8 KB limit, no cross-device sync needed)
  try {
    await new Promise((resolve, reject) => {
      if (currentIconBase64) {
        chrome.storage.local.set({ extension_icon: currentIconBase64 }, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      } else {
        chrome.storage.local.remove("extension_icon", () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      }
    });
  } catch (e) {
    showMsg(profileMsg, "图标保存失败：" + e.message, "error");
    return;
  }

  // 2. Save signature to sync storage (cross-device)
  try {
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set({ profile_signature: signature }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  } catch (e) {
    showMsg(profileMsg, "签名保存失败：" + e.message, "error");
    return;
  }

  // 3. Notify tab pages that signature may have changed
  chrome.runtime.sendMessage({ type: "profileChanged" }).catch(() => {});

  // 4. Update toolbar icon if it changed this session
  if (iconChanged) {
    const res = await sendMsg(currentIconBase64 ? "iconChanged" : "iconReset",
      currentIconBase64 ? { base64: currentIconBase64 } : {});
    iconChanged = false;
    if (!res || !res.success) {
      showMsg(profileMsg, "图标更新失败，其余设置已保存", "error");
      return;
    }
  }

  showMsg(profileMsg, "已保存", "success");
});

/* ---- Data Export / Import ---- */

$("#btnExport").addEventListener("click", async () => {
  const res = await sendMsg("data:export");
  if (!res || !res.success) {
    showMsg(dataMsg, res?.error || "导出失败", "error");
    return;
  }
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ywr-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showMsg(dataMsg, "导出成功", "success");
});

$("#btnImport").addEventListener("click", () => $("#importInput").click());

$("#importInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!Array.isArray(json.collections) || !Array.isArray(json.links)) {
      showMsg(dataMsg, "数据结构不完整", "error");
      return;
    }
    if (!confirm("导入将覆盖现有数据，是否继续？")) return;
    const res = await sendMsg("data:import", { data: { collections: json.collections, links: json.links } });
    if (res?.success) {
      const msg = res.skipped ? `导入成功（跳过 ${res.skipped} 条无效数据）` : "导入成功";
      showMsg(dataMsg, msg, "success");
    } else {
      showMsg(dataMsg, res?.error || "导入失败", "error");
    }
  } catch {
    showMsg(dataMsg, "文件格式错误", "error");
  }
  e.target.value = "";
});

/* ---- Init ---- */

loadSettings();
