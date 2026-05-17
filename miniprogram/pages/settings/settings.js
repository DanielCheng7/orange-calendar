Page({
  data: {
    themeOptions: ['跟随系统', '浅色', '深色'],
    themeIndex: 0
  },

  onLoad() {
    const app = getApp()
    this.setData({
      _isDark: app.globalData.isDark,
      themeIndex: app.globalData.themeMode
    })
    app.applyCurrentTheme()
  },

  onShow() {
    const app = getApp()
    if (this.data._isDark !== app.globalData.isDark) {
      this.setData({ _isDark: app.globalData.isDark })
    }
  },

  onManageTags() {
    wx.navigateTo({ url: '/pages/tags/tags' })
  },

  onSubscribeMessage() {
    wx.requestSubscribeMessage({
      tmplIds: [],
      success() {
        wx.showToast({ title: '已开启订阅' })
      },
      fail() {
        wx.showToast({ title: '订阅失败', icon: 'none' })
      }
    })
  },

  onThemeChange(e) {
    const mode = parseInt(e.detail.value)
    this.setData({ themeIndex: mode })
    const app = getApp()
    app.switchTheme(mode)
  }
})
