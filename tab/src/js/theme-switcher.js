/**
 * 主题切换器
 * 支持 5 套主题：default, purple-gold, forest-green, cyber-neon, caramel-warm
 */
const ThemeSwitcher = (function () {
  const STORAGE_KEY = 'ywr-extension-theme';
  const THEMES = ['default', 'purple-gold', 'forest-green', 'cyber-neon', 'caramel-warm', 'ocean-blue', 'sakura-pink', 'midnight-star'];

  let currentTheme = 'default';
  let themeSwitcherEl = null;
  let themeBtn = null;

  /**
   * 初始化主题切换器
   */
  const init = () => {
    themeSwitcherEl = document.getElementById('theme-switcher');
    themeBtn = document.querySelector('.ipage-aside-theme');

    // 从存储中读取已保存的主题
    loadSavedTheme();

    // 绑定事件
    bindEvents();

    // 更新选中状态
    updateActiveState();
  };

  /**
   * 从 localStorage 加载已保存的主题
   */
  const loadSavedTheme = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.includes(saved)) {
        currentTheme = saved;
      }
      // 无论是否有保存的主题，都应用当前主题
      applyTheme(currentTheme);
    } catch (e) {
      console.warn('Failed to load theme from storage:', e);
      applyTheme(currentTheme);
    }
  };

  /**
   * 应用主题
   */
  const applyTheme = (theme) => {
    if (!THEMES.includes(theme)) {
      theme = 'default';
    }
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;

    // 保存到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme to storage:', e);
    }

    updateActiveState();
  };

  /**
   * 更新选中状态的样式
   */
  const updateActiveState = () => {
    if (!themeSwitcherEl) return;

    const options = themeSwitcherEl.querySelectorAll('.theme-option');
    options.forEach((option) => {
      if (option.dataset.theme === currentTheme) {
        option.classList.add('is-active');
      } else {
        option.classList.remove('is-active');
      }
    });
  };

  /**
   * 切换下拉菜单显示/隐藏
   */
  const toggleDropdown = () => {
    if (!themeSwitcherEl) return;
    themeSwitcherEl.classList.toggle('is-visible');
  };

  /**
   * 隐藏下拉菜单
   */
  const hideDropdown = () => {
    if (!themeSwitcherEl) return;
    themeSwitcherEl.classList.remove('is-visible');
  };

  /**
   * 绑定事件
   */
  const bindEvents = () => {
    // 点击主题图标切换下拉菜单
    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
    }

    // 点击主题选项切换主题
    if (themeSwitcherEl) {
      themeSwitcherEl.addEventListener('click', (e) => {
        const option = e.target.closest('.theme-option');
        if (option && option.dataset.theme) {
          applyTheme(option.dataset.theme);
          hideDropdown();
        }
        e.stopPropagation();
      });
    }

    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', () => {
      hideDropdown();
    });
  };

  /**
   * 获取当前主题
   */
  const getTheme = () => currentTheme;

  /**
   * 设置主题（供外部调用）
   */
  const setTheme = (theme) => {
    applyTheme(theme);
  };

  return {
    init,
    getTheme,
    setTheme,
  };
})();

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  ThemeSwitcher.init();
});
