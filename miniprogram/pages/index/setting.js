// pages/index/setting.js
Component({
  options: {
    addGlobalClass: true,
  },

  data: {

  },

  methods: {
    CopyLink(e) {
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
  },

})
