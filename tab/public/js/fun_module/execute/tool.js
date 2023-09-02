$tools.exportConfig.addEventListener("click", async (event) => {
  await $apis.exportConfig()
  $notify.success({
    message: '配置导出成功',
    duration: 2000
  })
})

$tools.importConfig.addEventListener("click", async (event) => {
  $modal.form({
    title: '导入配置文件',
    config: [
      { property: 'file', label: '', type: "file" }
    ],
    data: {
      file: ''
    },
    confirmCallback: (data) => {
      const file = data.file
      if (file.length > 0) {
        $apis.importConfig(file[0])
      }
    }
  })
})