const app = getApp()

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()
  return [year, month, day, hour, minute, second].map(formatNumber).join('_')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function updateCachedTodoList(todoList) {
  wx.setStorage({
    key: 'todoList',
    data: todoList,
  });
}

function updateCachedImagePath(filePath) {
  wx.setStorage({
    key: 'last_image',
    data: filePath
  })
}

function uploadTodoListImage(options) {
  const filePath = options.filePath
  let date = new Date()
  const cloudPath = `todoList/${app.globalData.openid}/${formatTime(date)}${filePath.match(/\.[^.]+?$/)[0]}`
  console.log("cloud path = %s", cloudPath)
  wx.cloud.uploadFile({
    cloudPath,
    filePath,
    success: result => {
      updateCachedImagePath(filePath)
      console.log('[上传文件] 成功：', result.fileID)
      options.success && options.success(result.fileID)
    },
    fail: err => {
      options.fail && options.fail(err)
    }
  })
}

export {
  updateCachedImagePath,
  uploadTodoListImage,
  updateCachedTodoList
}