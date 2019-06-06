import Painter from '../../utils/painter.js'

const app = getApp()
const painter = new Painter('myCanvas')

Page({

  data: {
    canvasHeight: 0
  },

  todoList: {},
  canvasWidth: 320,
  maxHeight: 480,
  penAlpha: 0.5,
  tempImage: null,

  onLoad: function (options) {
    // 调整画布
    if (app.globalData.systemInfo) {
      this.initCanvasRect(app.globalData.systemInfo)
    } else {
      const that = this
      wx.getSystemInfo({
        success: function (res) {
          that.initCanvasRect(res)
        }
      })
    }
    // 加载数据
    let list = app.globalData.pageParam
    if (list) {
      this.openList(list)
      app.globalData.pageParam = null
    } else {
      console.log('get list from url query string id =', options.id)
      wx.showLoading({
        title: '加载中...',
      })
      const that = this
      wx.cloud.callFunction({
        name: 'list-get',
        data: {
          id: options.id
        },
        success(res) {
          wx.hideLoading()
          console.log('log get res: %o', res)
          list = res.result
          that.openList(list)
        },
        fail(err) {
          console.log('get list error.', err)
          wx.hideLoading()
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          })
        }
      })
    }
  },

  initCanvasRect(systemInfo) {
    this.canvasWidth = systemInfo.windowWidth
    this.setData({
      canvasHeight: systemInfo.canvasWidth + 50
    })
    this.maxHeight = systemInfo.windowWidth + 100
  },

  openList(list) {
    console.log("will show old list: %o", list)
    this.todoList = list
    if (list.image) {
      this.setupImage(list.image)
    }
  },

  setupImage(newImage) {
    this.tempImage = newImage
    let that = this
    wx.getImageInfo({
      src: newImage,
      success: function (res) {
        console.log('image rect: %o', res)
        // 获取图片信息，重新设置画布的高度
        let height = that.canvasWidth / res.width * res.height
        if (height > that.maxHeight) {
          height = that.maxHeight
        }
        console.log('new canvas height:', height)
        that.setData({
          canvasHeight: height
        });
        const ctx = wx.createCanvasContext('myCanvas')
        ctx.drawImage(res.path, 0, 0, that.canvasWidth, height)
        ctx.draw()

        if (that.todoList.points.length > 0) {
          // 重新绘制笔迹
          setTimeout(() => {
            painter.setPoints(that.todoList.points)
            painter.reDraw(that)
            // 生成包含笔迹的临时图片
            setTimeout(() => {
              that.saveTempImage()
            }, 200)
          }, 200)
        }
      }
    })
  },

  saveTempImage() {
    // 调用微信canvas存为图片
    const that = this
    wx.canvasToTempFilePath({
      canvasId: 'myCanvas',
      success: function (res) {
        that.tempImage = res.tempFilePath
      }
    })
  },

  close() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({
        delta: 1
      })
    } else {
      wx.redirectTo({
        url: '/pages/pen/draw'
      })
    }
  },

  onShareAppMessage: function () {
    return {
      title: '我的待办清单',
      imageUrl: this.tempImage,
      path: '/pages/pen/share?id=' + this.todoList._id
    }
  }
})