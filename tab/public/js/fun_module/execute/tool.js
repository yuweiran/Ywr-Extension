
$tools.btnToolMore.addEventListener("click", () => {
  $dropdown.show($tools.btnToolMore, {
    tag: "toolMore",
    data: [
      { value: "Export", label: "Export Config" },
      { value: "Import", label: "Import Config" }
    ],
    callback: async (value) => {
      if (value === "Export") {
        await $apis.exportConfig()
        $notify.success({
          message: '配置导出成功',
          duration: 2000
        })
      } else if (value === "Import") {
        $modal.form({
          title: 'Import Config File',
          config: [
            { property: 'file', label: '', type: "file" }
          ],
          data: {
            file: ''
          },
          confirmCallback: async (data) => {
            const file = data.file
            if (file.length > 0) {
              await $apis.importConfig(file[0])
              $collections.renderCollections()
            }
          }
        })
      }
    }
  })
})