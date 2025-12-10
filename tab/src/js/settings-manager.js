/**
 * 设置管理器
 * 处理背景图片等设置功能
 */
const SettingsManager = (function () {
  const STORAGE_KEY = 'ywr-extension-settings';

  // 默认设置
  const defaultSettings = {
    backgroundImage: null, // base64 或 URL
    backgroundOpacity: 0.15, // 背景透明度 (0-1, 值越大背景越明显)
    backgroundBlur: 0, // 背景模糊度 (0-20px)
  };

  let settings = { ...defaultSettings };
  let panelEl = null;
  let overlayEl = null;
  let isScreensaverActive = false;
  let screensaverReady = false; // 防止进入屏保时立即被退出

  /**
   * 初始化
   */
  const init = () => {
    loadSettings();
    createSettingsPanel();
    createPageBackground();
    createScreensaverLayer();
    bindEvents();
    applyBackground();
  };

  /**
   * 从 localStorage 加载设置
   */
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        settings = { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  /**
   * 保存设置到 localStorage
   */
  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  /**
   * 创建设置面板 HTML
   */
  const createSettingsPanel = () => {
    // 遮罩层
    overlayEl = document.createElement('div');
    overlayEl.className = 'settings-overlay';
    overlayEl.id = 'settings-overlay';
    document.body.appendChild(overlayEl);

    // 设置面板
    panelEl = document.createElement('div');
    panelEl.className = 'settings-panel';
    panelEl.id = 'settings-panel';
    panelEl.innerHTML = `
      <div class="settings-panel-header">
        <span class="settings-panel-title">设置</span>
        <button class="settings-panel-close" id="settings-close">✕</button>
      </div>
      <div class="settings-panel-body">
        <div class="settings-section">
          <div class="settings-section-title">背景设置</div>
          
          <div class="settings-item">
            <label class="settings-item-label">背景图片</label>
            <div class="settings-item-desc">支持 JPG、PNG、WebP 格式</div>
            <div class="bg-upload-area" id="bg-upload-area">
              <div class="bg-upload-icon">🖼️</div>
              <div class="bg-upload-text">点击上传或拖拽图片</div>
              <img class="bg-upload-preview" id="bg-preview" alt="背景预览">
              <input type="file" class="bg-upload-input" id="bg-input" accept="image/*">
            </div>
            <div class="bg-controls">
              <button class="bg-control-btn" id="bg-change-btn">更换</button>
              <button class="bg-control-btn danger" id="bg-remove-btn">移除</button>
            </div>
          </div>

          <div class="settings-item">
            <label class="settings-item-label">背景透明度</label>
            <div class="settings-item-desc">调整背景图片的可见程度</div>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="bg-opacity-slider" min="0" max="100" value="${settings.backgroundOpacity * 100}">
              <span class="slider-value" id="bg-opacity-value">${Math.round(settings.backgroundOpacity * 100)}%</span>
            </div>
          </div>

          <div class="settings-item">
            <label class="settings-item-label">背景模糊</label>
            <div class="settings-item-desc">为背景添加模糊效果</div>
            <div class="slider-row">
              <input type="range" class="settings-slider" id="bg-blur-slider" min="0" max="20" value="${settings.backgroundBlur}">
              <span class="slider-value" id="bg-blur-value">${settings.backgroundBlur}px</span>
            </div>
          </div>

          <div class="settings-item">
            <label class="settings-item-label">屏保模式</label>
            <div class="settings-item-desc">隐藏所有内容，只显示壁纸（按任意键退出）</div>
            <button class="settings-link-btn" id="screensaver-btn">
              <span>🌙 进入屏保</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">更多</div>
          <div class="settings-item">
            <button class="settings-link-btn" id="open-options-btn">
              <span>扩展选项</span>
              <span class="settings-link-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panelEl);

    // 如果已有背景图片，显示预览
    if (settings.backgroundImage) {
      const preview = document.getElementById('bg-preview');
      const uploadArea = document.getElementById('bg-upload-area');
      preview.src = settings.backgroundImage;
      uploadArea.classList.add('has-image');
    }
  };

  /**
   * 创建页面背景层
   */
  const createPageBackground = () => {
    const bgEl = document.createElement('div');
    bgEl.className = 'page-background';
    bgEl.id = 'page-background';
    bgEl.innerHTML = '<div class="page-background-overlay" id="page-background-overlay"></div>';
    document.body.insertBefore(bgEl, document.body.firstChild);
  };

  /**
   * 创建屏保层
   */
  const createScreensaverLayer = () => {
    const screensaverEl = document.createElement('div');
    screensaverEl.className = 'screensaver-layer';
    screensaverEl.id = 'screensaver-layer';
    screensaverEl.innerHTML = `
      <div class="screensaver-hint">
        <span>按任意键或移动鼠标退出屏保</span>
      </div>
    `;
    document.body.appendChild(screensaverEl);
  };

  /**
   * 进入屏保模式
   */
  const enterScreensaver = () => {
    if (!settings.backgroundImage) {
      alert('请先设置背景图片');
      return;
    }
    isScreensaverActive = true;
    screensaverReady = false; // 先设为 false，防止立即退出
    closePanel();
    
    const screensaverEl = document.getElementById('screensaver-layer');
    const contentArea = document.querySelector('.content-area');
    
    screensaverEl.classList.add('is-active');
    // 直接通过 JS 隐藏内容区域
    if (contentArea) {
      contentArea.style.setProperty('display', 'none', 'important');
      contentArea.style.setProperty('opacity', '0', 'important');
      contentArea.style.setProperty('visibility', 'hidden', 'important');
    }
    
    // 延迟 500ms 后才允许退出屏保（防止点击/移动事件立即触发退出）
    setTimeout(() => {
      screensaverReady = true;
    }, 500);
    
    // 3秒后隐藏提示
    setTimeout(() => {
      const hint = screensaverEl.querySelector('.screensaver-hint');
      if (hint && isScreensaverActive) {
        hint.classList.add('is-hidden');
      }
    }, 3000);
  };

  /**
   * 退出屏保模式
   */
  const exitScreensaver = () => {
    if (!isScreensaverActive) return;
    isScreensaverActive = false;
    screensaverReady = false;
    
    const screensaverEl = document.getElementById('screensaver-layer');
    const hint = screensaverEl.querySelector('.screensaver-hint');
    const contentArea = document.querySelector('.content-area');
    
    screensaverEl.classList.remove('is-active');
    hint.classList.remove('is-hidden');
    // 恢复内容区域显示
    if (contentArea) {
      contentArea.style.removeProperty('display');
      contentArea.style.removeProperty('opacity');
      contentArea.style.removeProperty('visibility');
    }
    
    // 恢复原来的背景透明度
    applyBackground();
  };

  /**
   * 应用背景设置
   */
  const applyBackground = () => {
    const bgEl = document.getElementById('page-background');
    const overlayEl = document.getElementById('page-background-overlay');

    if (settings.backgroundImage) {
      bgEl.style.backgroundImage = `url(${settings.backgroundImage})`;
      bgEl.style.filter = settings.backgroundBlur > 0 ? `blur(${settings.backgroundBlur}px)` : 'none';
      // 透明度: 值越大背景越明显，所以遮罩层透明度 = 1 - 背景透明度
      overlayEl.style.opacity = 1 - settings.backgroundOpacity;
    } else {
      bgEl.style.backgroundImage = 'none';
      overlayEl.style.opacity = 1;
    }
  };

  /**
   * 绑定事件
   */
  const bindEvents = () => {
    // 打开设置面板
    const settingBtn = document.querySelector('.ipage-aside-setting');
    if (settingBtn) {
      settingBtn.addEventListener('click', openPanel);
    }

    // 关闭设置面板
    document.getElementById('settings-close').addEventListener('click', closePanel);
    overlayEl.addEventListener('click', closePanel);

    // 背景图片上传
    const uploadArea = document.getElementById('bg-upload-area');
    const fileInput = document.getElementById('bg-input');

    uploadArea.addEventListener('click', (e) => {
      if (e.target.closest('.bg-controls')) return;
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleImageFile(file);
      }
    });

    // 更换按钮
    document.getElementById('bg-change-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // 移除按钮
    document.getElementById('bg-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeBackground();
    });

    // 透明度滑块
    const opacitySlider = document.getElementById('bg-opacity-slider');
    const opacityValue = document.getElementById('bg-opacity-value');
    opacitySlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      settings.backgroundOpacity = value;
      opacityValue.textContent = `${e.target.value}%`;
      applyBackground();
      saveSettings();
    });

    // 模糊滑块
    const blurSlider = document.getElementById('bg-blur-slider');
    const blurValue = document.getElementById('bg-blur-value');
    blurSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      settings.backgroundBlur = value;
      blurValue.textContent = `${value}px`;
      applyBackground();
      saveSettings();
    });

    // 屏保模式按钮
    document.getElementById('screensaver-btn').addEventListener('click', () => {
      enterScreensaver();
    });

    // 扩展选项按钮
    document.getElementById('open-options-btn').addEventListener('click', () => {
      window.open('/options/index.html');
    });

    // ESC 关闭设置面板 或 退出屏保
    document.addEventListener('keydown', (e) => {
      if (isScreensaverActive && screensaverReady) {
        exitScreensaver();
        return;
      }
      if (e.key === 'Escape' && panelEl.classList.contains('is-visible')) {
        closePanel();
      }
    });

    // 点击退出屏保
    document.addEventListener('click', (e) => {
      if (isScreensaverActive && screensaverReady) {
        exitScreensaver();
      }
    });

    // 鼠标移动退出屏保（带延迟防抖）
    let mouseMoveTimer = null;
    document.addEventListener('mousemove', () => {
      if (isScreensaverActive && screensaverReady) {
        if (mouseMoveTimer) clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(() => {
          exitScreensaver();
        }, 100);
      }
    });
  };

  /**
   * 处理图片文件
   */
  const handleImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      settings.backgroundImage = base64;
      saveSettings();
      applyBackground();

      // 更新预览
      const preview = document.getElementById('bg-preview');
      const uploadArea = document.getElementById('bg-upload-area');
      preview.src = base64;
      uploadArea.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  };

  /**
   * 移除背景
   */
  const removeBackground = () => {
    settings.backgroundImage = null;
    saveSettings();
    applyBackground();

    // 更新 UI
    const preview = document.getElementById('bg-preview');
    const uploadArea = document.getElementById('bg-upload-area');
    const fileInput = document.getElementById('bg-input');
    preview.src = '';
    uploadArea.classList.remove('has-image');
    fileInput.value = '';
  };

  /**
   * 打开设置面板
   */
  const openPanel = () => {
    panelEl.classList.add('is-visible');
    overlayEl.classList.add('is-visible');
  };

  /**
   * 关闭设置面板
   */
  const closePanel = () => {
    panelEl.classList.remove('is-visible');
    overlayEl.classList.remove('is-visible');
  };

  return {
    init,
    openPanel,
    closePanel,
  };
})();

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.init();
});
