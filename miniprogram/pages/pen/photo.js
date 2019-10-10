import { uploadTodoListImage } from '../../utils/cache.js'

const app = getApp();

Page({
  data: {
    isCameraAuth: false,
    hasChoosedImg: false,
    tabbarHeight: 42,
    canvasWidth: 640,
    canvasHeight: 1600, // 坑跌的canvas
    grayDegree: 127.5,
    useOriginal: false,
  },

  onLoad: function (options) {
    // 获取设备信息，canvas高度用
    const sysInfo = app.globalData.systemInfo;
    this.setData({
      canvasWidth: sysInfo.windowWidth,
      canvasHeight: sysInfo.windowWidth + 50,
    });
  },

  setupImage(filePath) {
    const that = this
    wx.getImageInfo({
      src: filePath,
      success: function (res) {
        // 获取图片信息，主要为宽高，选择合适的自适应方式（将最大边完整显示）
        let [height, width] = [that.data.canvasWidth / res.width * res.height, that.data.canvasWidth];
        if (height > that.data.canvasHeight) {
          height = that.data.canvasHeight;
        }
        const ctx = wx.createCanvasContext('foreCanvas');
        ctx.drawImage(res.path, 0, 0, width, height);
        ctx.draw();
        const backCtx = wx.createCanvasContext('backCanvas');
        backCtx.drawImage(res.path, 0, 0, width, height);
        backCtx.draw();
        that.setData({
          hasChoosedImg: true,
          canvasHeight: height,
        });
        if (!that.data.useOriginal) {
          setTimeout(() => {
            that.updateGray(that.data.grayDegree);
          }, 300);
        }
      }
    })
  },

  updateGray: function (threshold) {
    wx.canvasGetImageData({
      canvasId: 'backCanvas',
      x: 0,
      y: 0,
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      success(res) {
        let data = res.data;
        for (var i = 0; i < data.length; i += 4) {
          // 灰度计算公式
          var gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray >= threshold ? 250 : 3;                         // red
          data[i + 1] = gray >= threshold ? 218 : 49;                    // green
          data[i + 2] = gray >= threshold ? 141 : 79;                    // blue
          // data[i + 3] // alpha
        }
        wx.canvasPutImageData({
          canvasId: 'foreCanvas',
          x: 0,
          y: 0,
          width: res.width,
          height: res.height,
          data,
          success(res) {
            console.log("update image gray")
          },
          fail(err) {
            console.log("update image gray error.", err)
          }
        })
      }
    });
  },

  resetImage: function () {
    wx.canvasGetImageData({
      canvasId: 'backCanvas',
      x: 0,
      y: 0,
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      success(res) {
        wx.canvasPutImageData({
          canvasId: 'foreCanvas',
          x: 0,
          y: 0,
          width: res.width,
          height: res.height,
          data: res.data,
          success(res) {
            console.log("reset image")
          },
          fail(err) {
            console.log("reset image error.", err)
          }
        })
      }
    });
  },

  toggleFilter: function(e) {
    console.log('toggle switch')
    console.log(e.detail.value)
    this.setData({
      useOriginal: !e.detail.value,
    });
    if (this.data.useOriginal) {
      this.resetImage();
    } else {
      this.updateGray(this.data.grayDegree);
    }
  },

  updateImage: function (e) {
    let threshold = e.detail.value * 255 / 100;
    this.setData({
      grayDegree: threshold
    });
    this.updateGray(threshold);
  },

  onReady: function () {
    // 调整滑动条位置
    setTimeout(() => {
      const that = this
      wx.createSelectorQuery().select('#tabbar')
        .boundingClientRect(function (rect) {
          that.setData({
            tabbarHeight: rect.height
          })
        }).exec();
    }, 500);
    // 请求授权
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.setData({
            isCameraAuth: true
          })
        } else {
          this.setData({
            isCameraAuth: false
          })
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.setData({
                isCameraAuth: true
              })
            },
            fail: err => {
              this.setData({
                isCameraAuth: false
              })
            }
          })
        }
      }
    })
  },

  dismiss: function () {
    wx.navigateBack({
      delta: 1
    });
  },

  done: function () {
    wx.showLoading({
      title: '处理中...',
      mask: true,
    })
    // 调用微信canvas存为图片
    wx.canvasToTempFilePath({
      canvasId: 'foreCanvas',
      success: function (res) {
        // 上传图片
        uploadTodoListImage({
          filePath: res.tempFilePath,
          success: fileID => {
            wx.hideLoading()
            // 转图片成功，返回给首页
            app.event.emit('image:take', {
              fileID,
              image: res.tempFilePath
            });
            wx.navigateBack({
              delta: 1
            });
          },
          fail: err => {
            wx.hideLoading()
            wx.showToast({
              icon: 'none',
              title: '保存图片出错了，请重试～',
            })
          }
        })
      },
      fail: function (res) {
        wx.hideLoading()
        // canvas转图片失败
        wx.showToast({
          icon: 'none',
          title: '保存图片出错了，请重试～',
        })
      }
    });
  },

  cameraError(e) {
    console.log('camera error.', e.detail)
  },

  tokePhoto() {
    if (this.data.isCameraAuth) {
      const ctx = wx.createCameraContext()
      ctx.takePhoto({
        quality: 'normal',
        success: (res) => {
          this.setupImage(res.tempImagePath)
        }
      })
    } else {
      wx.openSetting({
        success: res => {
          console.log('new auth setting: ', res)
          this.setData({
            isCameraAuth: res.authSetting['scope.camera']
          })
        }
      })
    }
  },

  reTake() {
    this.setData({
      hasChoosedImg: false
    })
  },

  onShareAppMessage: function () {
    return {
      title: '指点你的待办清单',
      path: '/pages/pen/draw',
      imageUrl: '/images/bg-temp.jpg'
    }
  }
})