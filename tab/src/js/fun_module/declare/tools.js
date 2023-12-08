const $tools = (() => {
  const tabsContainer = $el.__("#ipage-tabs");

  const btnToolLayout = $el.__(".btn-tool-layout");
  const btnToolHistory = $el.__(".btn-tool-history");
  const btnToolTabs = $el.__(".btn-tool-tabs");
  const btnToolTheme = $el.__(".btn-tool-theme");
  const btnToolTask = $el.__(".btn-tool-task");
  const btnToolMore = $el.__(".btn-tool-more");
  return {
    tabsContainer,
    btnToolLayout,
    btnToolHistory,
    btnToolTabs,
    btnToolTheme,
    btnToolTask,
    btnToolMore,
  };
})();
