const THEME_KEY = 'calendar_theme'

App({
  globalData: {
    openid: '',
    hasNewReminder: false,
    isDark: false,
    themeMode: 0 // 0=跟随系统, 1=浅色, 2=深色
  },

  onLaunch() {
    const cloud = require('./utils/cloud')
    cloud.init()
    this.initTheme()
  },

  initTheme() {
    const saved = wx.getStorageSync(THEME_KEY)
    const mode = saved !== '' ? saved : 0
    this.globalData.themeMode = mode
    this.applyTheme(mode, true)

    if (mode === 0) {
      try {
        wx.onThemeChange((res) => {
          console.log('[Theme] system theme changed:', res.theme)
          if (this.globalData.themeMode === 0) {
            this.applyTheme(0, false)
          }
        })
      } catch (e) {
        console.warn('[Theme] onThemeChange not supported')
      }
    }
  },

  applyTheme(mode, init) {
    let isDark = false

    if (mode === 0) {
      isDark = this.detectSystemDark()
    } else {
      isDark = mode === 2
    }

    console.log('[Theme] apply:', { mode, isDark, init })
    this.globalData.isDark = isDark

    if (!init) {
      this.syncPageTheme(isDark)
    }
    this.updateUI(isDark)
  },

  detectSystemDark() {
    try {
      const info = wx.getSystemInfoSync()
      console.log('[Theme] system info theme:', info.theme)
      if (info.theme === 'dark') return true

      // Fallback: try newer API
      const appBase = wx.getAppBaseInfo ? wx.getAppBaseInfo() : null
      if (appBase && appBase.theme) {
        console.log('[Theme] appBase theme:', appBase.theme)
        return appBase.theme === 'dark'
      }
    } catch (e) {
      console.warn('[Theme] detection failed:', e)
    }
    return false
  },

  syncPageTheme(isDark) {
    const pages = getCurrentPages()
    pages.forEach(p => {
      if (p && p.setData) {
        p.setData({ _isDark: isDark })
      }
    })
  },

  updateUI(isDark) {
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1E1B18' : '#ffffff'
    })
    wx.setBackgroundColor({
      backgroundColor: isDark ? '#141210' : '#F8F6F3'
    })
  },

  switchTheme(mode) {
    console.log('[Theme] switch to mode:', mode)
    this.globalData.themeMode = mode
    wx.setStorageSync(THEME_KEY, mode)
    this.applyTheme(mode, false)
  },

  // Called by each page's onLoad to sync nav bar on page navigation
  applyCurrentTheme() {
    this.updateUI(this.globalData.isDark)
  }
})
