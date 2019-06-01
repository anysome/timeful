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

function getDefaultTodoList(options) {
  wx.getStorage({
    key: 'todoList',
    success(res) {
      const list = res.data
      console.log('get cached default todolist: %o', list)
      options.success && options.success(list)
    },
    fail(err) {
      console.log('get cached todolist fail.', err)
      wx.cloud.callFunction({
        name: 'list-get-last',
        success: res => {
          const list = res.result
          console.log('get last list form cloud', res.result)
          if (list) {
            updateCachedTodoList(list)
            options.success && options.success(list)
          } else {
            options.empty && options.empty()
          }
        },
        fail: err => {
          console.log('get last list form cloud error.', err)
          options.empty && options.empty()
        }
      })
    }
  })
}

export {
  updateCachedImagePath,
  uploadTodoListImage,
  updateCachedTodoList,
  getDefaultTodoList
}