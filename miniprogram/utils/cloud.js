const app = getApp();

export const initEnv = () => {
  if (!app.globalData.openid) {
    try {
      const value = wx.getStorageSync('openid')
      if (value) {
        app.globalData.openid = value;
      }
    } catch (e) {
      console.log("Can't get local openid", e);
    }
  }
  if (!app.globalData.openid) {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid;
        wx.setStorage({
          key: 'openid',
          data: res.result.openid
        });
        console.log("get openid from cloud");
      },
      fail: err => {
        console.log('[云函数] 获取 openid 失败.', err)
      }
    });
  }
  console.log("current openid = %s", app.globalData.openid);
};

export const getDefaultTodoList = (callback) => {
  wx.getStorage({
    key: 'todoList',
    success(res) {
      app.globalData.todoList = res.data;
      console.log("current todoList = %o", app.globalData.todoList)
      callback(res.data)
    }
  })
}

export const createTodoList = (filePath, success, fail) => {
  let date = new Date();
  const cloudPath = `todoList/${app.globalData.openid}/${formatTime(date)}${filePath.match(/\.[^.]+?$/)[0]}`;
  console.log("cloud path = %s", cloudPath);
  wx.cloud.uploadFile({
    cloudPath,
    filePath,
    success: result => {
      console.log('[上传文件] 成功：', result.fileID);
      const db = wx.cloud.database();
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()
      let todoList = {
        year,
        month,
        day,
        date,
        points: [],
        originFileID: result.fileID,
        snapshotFileID: ''
      };
      db.collection('todoList').add({
        data: todoList,
        success: res => {
          console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id);
          todoList._id = res._id;
          app.globalData.todoList = todoList;
          wx.setStorage({
            key: 'todoList',
            data: todoList,
          });
          if (success) {
            success(todoList);
          }
        },
        fail: e => {
          console.error('[数据库] [新增记录] 失败：', err)
          if (fail) {
            fail(e);
          }
        }
      });
    },
    fail: e => {
      console.error('[上传文件] 失败：', e);
      if (fail) {
        fail(e);
      }
    }
  });
};

export const getTodoList = (listID, callback, fail) => {
  const db = wx.cloud.database();
  db.collection('todoList').doc(listID).get({
    success(res) {
      callback(res.data);
    },
    fail(err) {
      if (fail) {
        fail(err)
      }
    }
  });
};

export const updateTodoListPoints = (todoList) => {
  if (todoList._id == app.globalData.todoList._id) {
    wx.setStorage({
      key: 'todoList',
      data: todoList,
    });
  }
  const db = wx.cloud.database();
  db.collection('todoList').doc(todoList._id).update({
    data: {
      points: todoList.points
    },
    success(res) {
      console.log("upload points to cloud");
    }
  });
}

export const cacheOriginalImage = (tempFile, callback) => {
  const fs = wx.getFileSystemManager()
  fs.saveFile({
    tempFilePath: tempFile, // 传入一个临时文件路径
    success(res) {
      console.log('图片缓存成功', res.savedFilePath)
      wx.setStorage({
        key: 'last_image',
        data: res.savedFilePath
      })
      callback(res.savedFilePath)
    },
    fail(e) {
      callback(tempFile)
    }
  })
}

export const getOrignalImage = (fileID, callback, completion) => {
  if (fileID == app.globalData.todoList.originFileID) {
    try {
      const value = wx.getStorageSync('last_image')
      if (value) {
        console.log("last_image local path: " + value)
        callback(value)
        if (completion) {
          completion()
        }
      } else {
        downloadImage(fileID, tempFile => {
          cacheOriginalImage(tempFile, callback)
        }, completion)
      }
    } catch (e) {
      console.log('get last_image path from storage error', e);
    }
  } else {
    downloadImage(fileID, callback, completion)
  }
}

function downloadImage(fileID, callback, completion) {
  wx.cloud.downloadFile({
    fileID: fileID, // 文件 ID
    success: res => {
      // 返回临时文件路径
      callback(res.tempFilePath)
    },
    complete: () => {
      if (completion) {
        completion()
      }
    }
  })
}

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