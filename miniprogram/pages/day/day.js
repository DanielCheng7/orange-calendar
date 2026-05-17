const dateUtil = require('../../utils/date')
const cloud = require('../../utils/cloud')
const repeat = require('../../utils/repeat')

Page({
  data: {
    dateDisplay: '',
    dateStr: '',
    pending: [],
    done: []
  },

  onLoad(options) {
    const app = getApp()
    const dateStr = options.date || dateUtil.getToday()
    this.setData({
      _isDark: app.globalData.isDark,
      dateStr,
      dateDisplay: dateUtil.getDateDisplay(dateStr)
    })
    app.applyCurrentTheme()
    this.loadData()
  },

  onShow() {
    const app = getApp()
    if (this.data._isDark !== app.globalData.isDark) {
      this.setData({ _isDark: app.globalData.isDark })
    }
    if (this.data.dateStr) this.loadData()
  },

  async loadData() {
    try {
      const reminders = await cloud.getReminders()
      const tags = await cloud.getTags()
      const tagMap = {}
      tags.filter(t => t.name !== '新标签').forEach(t => { tagMap[t._id] = t })

      const dayReminders = repeat.getRemindersForDate(reminders, this.data.dateStr)
      const pending = []
      const done = []

      for (const r of dayReminders) {
        const enriched = {
          ...r,
          _tagColor: tagMap[r.tag] ? tagMap[r.tag].color : '#D4834A',
          _tagName: tagMap[r.tag] ? tagMap[r.tag].name : '',
          done: false
        }
        if (r.repeat !== 'none') {
          if (r.doneDates && r.doneDates.includes(this.data.dateStr)) {
            enriched.done = true
            done.push(enriched)
          } else {
            pending.push(enriched)
          }
        } else {
          if (r.done) {
            enriched.done = true
            done.push(enriched)
          } else {
            pending.push(enriched)
          }
        }
      }

      this.setData({ pending, done })
    } catch (err) {
      console.error('Failed to load day reminders:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onToggleDone(e) {
    const { id, item } = e.detail
    try {
      let newDoneDates = item.doneDates || []

      if (item.repeat !== 'none') {
        if (item.doneDates && item.doneDates.includes(this.data.dateStr)) {
          newDoneDates = newDoneDates.filter(d => d !== this.data.dateStr)
        } else {
          newDoneDates.push(this.data.dateStr)
        }
        await cloud.updateReminder(id, { doneDates: newDoneDates })
      } else {
        await cloud.updateReminder(id, { done: !item.done })
      }
      this.loadData()
    } catch (err) {
      console.error('Failed to toggle done:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  onEditReminder(e) {
    const item = e.detail.item
    wx.navigateTo({
      url: `/pages/editor/editor?id=${item._id}`
    })
  },

  onShareAppMessage() {
    return {
      title: `${this.data.dateDisplay} 的日程安排`,
      path: `/pages/day/day?date=${this.data.dateStr}`
    }
  }
})
