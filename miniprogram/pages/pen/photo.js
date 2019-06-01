import { uploadTodoListImage } from '../../utils/cache.js'

const app = getApp();

Page({
  data: {
    isCameraAuth: false,
    hasChoosedImg: false,
    tabbarHeight: 42,
    canvasWidth: 320,
    canvasHeight: 320,
    grayDegree: 127.5,
  },

  onLoad: function (options) {
    // 获取设备信息，canvas高度用
    const sysInfo = app.globalData.systemInfo;
    this.setData({
      canvasWidth: sysInfo.windowWidth,
      canvasHeight: sysInfo.windowWidth,
    });
  },

  updateGray: function (threshold) {
    console.log('get canvas height', this.data.canvasHeight)
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
        }
        console.log('update gray res: %o', res)
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
        console.log('canvas height changed ? ', that.data.canvasHeight, height)
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
        setTimeout(() => {
          that.updateGray(that.data.grayDegree);
        }, 300);
      }
    })
  },

  updateImage: function (e) {
    let threshold = e.detail.value * 255 / 100;
    this.setData({
      grayDegree: threshold
    });
    this.updateGray(threshold);
  },

  onReady: function () {
    setTimeout(() => {
      const that = this
      wx.createSelectorQuery().select('#tabbar')
        .boundingClientRect(function (rect) {
          that.setData({
            tabbarHeight: rect.height
          })
        }).exec();
    }, 500);
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
})