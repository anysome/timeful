// pages/index/setting.js
Component({
  options: {
    addGlobalClass: true,
  },

  data: {

  },

  methods: {
    openApp(e) {
      wx.navigateToMiniProgram({
        appId: e.currentTarget.dataset.appid,
        success(res) {
          console.log('nav to other app.', res)
        },
        fail(err) {
          console.log('nav to app error: ', err)
          wx.showToast({
            title: '抱歉无法打开小程序',
            icon: 'none'
          })
        }
      })
    },
    copyLink(e) {
      wx.setClipboardData({
        data: e.currentTarget.dataset.link,
        success: res => {
          wx.showToast({
            title: '已复制链接',
            duration: 1000,
          })
        }
      })
    },
    showQrcode() {
      wx.previewImage({
        urls: ['https://file.ihugao.com/image/muse/zan-code.jpg'],
        current: 'https://file.ihugao.com/image/muse/zan-code.jpg'
      })
    },
    authSetting() {
      wx.openSetting({
        success: res => {
          console.log('new auth setting: ', res)
        }
      })
    },
  },

})
