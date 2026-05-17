const dateUtil = require('../../utils/date')
const cloud = require('../../utils/cloud')
const { suggestTag } = require('../../utils/tag-suggest')

const REPEAT_OPTIONS = ['不重复', '每天', '每周', '每月', '每年']
const REPEAT_VALUES = ['none', 'daily', 'weekly', 'monthly', 'yearly']

const TIME_HOURS = (() => {
  const arr = ['全天']
  for (let h = 0; h < 24; h++) {
    arr.push(String(h))
  }
  return arr
})()
const TIME_MINUTES = (() => {
  const arr = []
  for (let m = 0; m < 60; m++) {
    arr.push(String(m))
  }
  return arr
})()
const TIME_COLUMNS = [TIME_HOURS, TIME_MINUTES]

function timeToIndex(time) {
  if (!time) return [0, 0]
  const parts = time.split(':')
  return [parseInt(parts[0]) + 1, parseInt(parts[1])]
}

function indexToTime(idx) {
  if (idx[0] === 0) return ''
  return `${String(idx[0] - 1).padStart(2, '0')}:${String(idx[1]).padStart(2, '0')}`
}

function indexToDisplay(idx) {
  if (idx[0] === 0) return '全天'
  return `${TIME_HOURS[idx[0]]}:${TIME_MINUTES[idx[1]]}`
}

Page({
  data: {
    isEdit: false,
    reminderId: '',
    title: '',
    date: dateUtil.getToday(),
    time: '',
    repeatIndex: 0,
    repeatOptions: REPEAT_OPTIONS,
    selectedTag: '',
    note: '',
    tags: [],
    tagNames: [],
    tagIndex: 0,
    timeColumns: TIME_COLUMNS,
    timeIndex: [0, 0],
    timeDisplay: '全天'
  },

  onLoad(options) {
    const app = getApp()
    this.setData({ _isDark: app.globalData.isDark })

    if (options.date) {
      this.setData({ date: options.date })
    }

    if (options.id) {
      this.setData({ isEdit: true, reminderId: options.id })
      this.loadReminder(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新建提醒' })
    }

    app.applyCurrentTheme()
    this.loadTags()
  },

  onShow() {
    const app = getApp()
    if (this.data._isDark !== app.globalData.isDark) {
      this.setData({ _isDark: app.globalData.isDark })
    }
    this.loadTags()
  },

  async loadTags() {
    try {
      let tags = await cloud.getTags()
      // Hide "新标签" from selection (matches tags page behavior)
      tags = tags.filter(t => t.name !== '新标签')
      tags.sort((a, b) => (a.order || 999) - (b.order || 999))

      const defaultIdx = tags.findIndex(t => t.name === '默认')
      let tagIndex = defaultIdx > -1 ? defaultIdx : 0
      let selectedTag = tags[tagIndex]._id

      if (this.data.selectedTag) {
        const idx = tags.findIndex(t => t._id === this.data.selectedTag)
        if (idx > -1) {
          tagIndex = idx
          selectedTag = this.data.selectedTag
        }
      }

      const tagNames = tags.map(t => t.name)
      this.setData({ tags, tagNames, tagIndex, selectedTag })
    } catch (err) {
      console.error('Failed to load tags:', err)
    }
  },

  async loadReminder(id) {
    try {
      const reminders = await cloud.getReminders()
      const reminder = reminders.find(r => r._id === id)
      if (!reminder) {
        wx.showToast({ title: '提醒不存在', icon: 'none' })
        wx.navigateBack()
        return
      }
      const repeatIndex = Math.max(0, REPEAT_VALUES.indexOf(reminder.repeat || 'none'))
      const selectedTag = reminder.tag || ''
      const tagIndex = this.data.tags.findIndex(t => t._id === selectedTag)
      const timeVal = reminder.time || ''
      const timeIndex = timeToIndex(timeVal)
      this.setData({
        title: reminder.title,
        date: reminder.date,
        time: timeVal,
        timeIndex,
        timeDisplay: indexToDisplay(timeIndex),
        repeatIndex,
        selectedTag,
        tagIndex: tagIndex > -1 ? tagIndex : 0,
        note: reminder.note || ''
      })
      wx.setNavigationBarTitle({ title: '编辑提醒' })
    } catch (err) {
      console.error('Failed to load reminder:', err)
    }
  },

  onTitleInput(e) {
    const title = e.detail.value
    const update = { title }
    const suggested = suggestTag(title, this.data.tags)
    const defaultIdx = this.data.tags.findIndex(t => t.name === '默认')

    if (suggested) {
      const idx = this.data.tags.findIndex(t => t._id === suggested._id)
      if (idx > -1) {
        update.tagIndex = idx
        update.selectedTag = suggested._id
      }
    } else if (defaultIdx > -1) {
      update.tagIndex = defaultIdx
      update.selectedTag = this.data.tags[defaultIdx]._id
    }
    this.setData(update)
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onTimeChange(e) {
    const idx = e.detail.value
    this.setData({
      timeIndex: idx,
      time: indexToTime(idx),
      timeDisplay: indexToDisplay(idx)
    })
  },

  onRepeatChange(e) {
    this.setData({ repeatIndex: parseInt(e.detail.value) })
  },

  onTagChange(e) {
    const index = parseInt(e.detail.value)
    const tag = this.data.tags[index]
    if (tag) {
      this.setData({ tagIndex: index, selectedTag: tag._id })
    }
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  onManageTags() {
    wx.navigateTo({ url: '/pages/tags/tags' })
  },

  async onSave() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入提醒内容', icon: 'none' })
      return
    }

    const reminderData = {
      title: this.data.title.trim(),
      date: this.data.date,
      time: this.data.time,
      repeat: REPEAT_VALUES[this.data.repeatIndex],
      tag: this.data.selectedTag,
      note: this.data.note.trim()
    }

    try {
      if (this.data.isEdit) {
        await cloud.updateReminder(this.data.reminderId, reminderData)
        wx.showToast({ title: '已更新' })
      } else {
        await cloud.addReminder(reminderData)
        wx.showToast({ title: '已创建' })
        this.requestSubscribeMessage()
      }
      wx.navigateBack()
    } catch (err) {
      console.error('Failed to save reminder:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  requestSubscribeMessage() {
    wx.requestSubscribeMessage({
      tmplIds: ['RBiILR2OaTtTfo-nIvFohCLRVxahCgbgxM7lZuxQubE'],
      fail: () => {}
    })
  },

  async onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个提醒吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cloud.deleteReminder(this.data.reminderId)
            wx.showToast({ title: '已删除' })
            wx.navigateBack()
          } catch (err) {
            console.error('Failed to delete:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: `📅 ${this.data.title}`,
      path: `/pages/editor/editor?id=${this.data.reminderId}`
    }
  }
})
