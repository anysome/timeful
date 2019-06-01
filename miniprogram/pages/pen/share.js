import Painter from '../../utils/painter.js'

const app = getApp()
const painter = new Painter('myCanvas')

Page({

  data: {
    canvasHeight: 0,
    todoListImage: '../../images/bg-temp.jpg',
  },

  todoList: {},
  canvasWidth: 320,
  maxHeight: 480,
  penAlpha: 0.5,

  onLoad: function (options) {
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

  openList(list) {
    console.log("will show old list: %o", list)
    this.todoList = list
    this.setupImage(list.image)
  },

  setupImage(newImage) {
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
        that.setData({
          todoListImage: newImage,
          canvasHeight: height
        });
        // 重新绘制笔迹
        setTimeout(() => {
          painter.setPoints(that.todoList.points)
          painter.reDraw(that)
        }, 500);
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
      title: '待办清单',
      path: '/pages/pen/share?id=' + this.todoList._id
    }
  }
})