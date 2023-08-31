const $tools = (() => {
  const tabsContainer = $el.__("#ipage-tabs")
  const exportConfig = $el.__(".btn-config-export")
  const importConfig = $el.__(".btn-config-import")
  return {
    tabsContainer,
    exportConfig,
    importConfig
  }
})()