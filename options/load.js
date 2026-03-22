const $ = (sel) => document.querySelector(sel);

const avatarPreview = $("#avatarPreview");
const avatarInput = $("#avatarInput");
const signatureInput = $("#signatureInput");
const charCount = $("#charCount");
const profileMsg = $("#profileMsg");
const dataMsg = $("#dataMsg");

let currentAvatar = "";

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

function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 64, 64);

      const qualities = [0.6, 0.4, 0.2];
      for (const q of qualities) {
        const dataUrl = canvas.toDataURL("image/jpeg", q);
        if (dataUrl.length <= 10666) {
          resolve(dataUrl);
          return;
        }
      }
      reject(new Error("图片过大，请选择更小的图片"));
    };
    img.onerror = () => reject(new Error("图片读取失败"));
    img.src = URL.createObjectURL(file);
  });
}

/* ---- Profile ---- */

function loadProfile() {
  chrome.storage.sync.get(["profile_avatar", "profile_signature"], (data) => {
    currentAvatar = data.profile_avatar || "";
    if (currentAvatar) {
      avatarPreview.style.backgroundImage = `url(${currentAvatar})`;
    }
    signatureInput.value = data.profile_signature || "";
    charCount.textContent = signatureInput.value.length;
  });
}

$("#btnChooseAvatar").addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;
  try {
    currentAvatar = await compressAvatar(file);
    avatarPreview.style.backgroundImage = `url(${currentAvatar})`;
  } catch (e) {
    showMsg(profileMsg, e.message, "error");
  }
  avatarInput.value = "";
});

$("#btnRemoveAvatar").addEventListener("click", () => {
  currentAvatar = "";
  avatarPreview.style.backgroundImage = "";
});

signatureInput.addEventListener("input", () => {
  charCount.textContent = signatureInput.value.length;
});

$("#btnSaveProfile").addEventListener("click", () => {
  const signature = signatureInput.value.trim().slice(0, 100);
  chrome.storage.sync.set({ profile_avatar: currentAvatar, profile_signature: signature }, () => {
    if (chrome.runtime.lastError) {
      showMsg(profileMsg, "保存失败，请重试", "error");
      return;
    }
    showMsg(profileMsg, "已保存", "success");
    chrome.runtime.sendMessage({ type: "profileChanged" }).catch(() => {});
  });
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

loadProfile();