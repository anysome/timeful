import Event from './utils/event'

App({
  event: new Event(),

  globalData: {
    pageParam: null,
    user: {}
  },

  login() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.globalData.openid = res.result.openid;
        wx.setStorage({
          key: 'openid',
          data: res.result.openid
        });
        console.log("get openid from cloud: ", res.result);
      },
      fail: err => {
        console.log('[云函数] 获取 openid 失败.', err)
      }
    });
  },

  onLaunch: function () {
    console.log('app launch')
    // 登录
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'dev-9c9sz',
        traceUser: true,
      })
    }
    // 获取系统状态栏信息
    wx.getSystemInfo({
      success: e => {
        console.log('get system info when app launch')
        this.globalData.systemInfo = e
        this.globalData.StatusBar = e.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;
        this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
      }
    })
    // get openid
    wx.getStorage({
      key: 'openid',
      success: res => {
        if (res.data) {
          console.log('get openid from local: %s', res.data)
          this.globalData.openid = res.data
        } else {
          this.login()
        }
      },
      fail: err => {
        this.login()
      }
    })
  }
})
