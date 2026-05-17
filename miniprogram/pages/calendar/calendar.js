const dateUtil = require('../../utils/date')
const cloud = require('../../utils/cloud')
const repeat = require('../../utils/repeat')

Page({
  data: {
    year: 0,
    month: 0,
    grid: [],
    weekDays: dateUtil.getWeekDayLabels(),
    selectedDate: '',
    selectedDateDisplay: '',
    dayReminders: [],
    allReminders: [],
    tags: [],
    selectMode: false,
    selectedIds: [],
    previewTab: 0,
    dayNote: '',
    noteLines: [1]
  },

  onLoad() {
    const app = getApp()
    const now = new Date()
    this.setData({
      _isDark: app.globalData.isDark,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      selectedDate: dateUtil.getToday()
    })
    app.applyCurrentTheme()
    this.loadData()
  },

  onShow() {
    const app = getApp()
    if (this.data._isDark !== app.globalData.isDark) {
      this.setData({ _isDark: app.globalData.isDark })
    }
    this.loadData()
  },

  async loadData() {
    const { year, month } = this.data
    try {
      const reminders = await cloud.getReminders()
      const tags = await cloud.getTags()
      // Hide "新标签" from display (matches tags page behavior)
      const visibleTags = tags.filter(t => t.name !== '新标签')

      const tagMap = {}
      visibleTags.forEach(t => { tagMap[t._id] = t })

      const grid = dateUtil.buildMonthGrid(year, month)
      const gridWithDots = grid.map(cell => ({
        ...cell,
        isSelected: cell.date === this.data.selectedDate,
        hasReminder: reminders.some(r => repeat.shouldAppearOnDate(r.date, cell.date, r.repeat || 'none'))
      }))

      const dayReminders = repeat.getRemindersForDate(reminders, this.data.selectedDate)
      const dayRemindersWithTag = dayReminders.map(r => {
        let done = false
        if (r.repeat !== 'none') {
          done = r.doneDates && r.doneDates.includes(this.data.selectedDate)
        } else {
          done = !!r.done
        }
        return {
          ...r,
          done,
          _tagColor: tagMap[r.tag] ? tagMap[r.tag].color : '#D4834A',
          _tagName: tagMap[r.tag] ? tagMap[r.tag].name : ''
        }
      })

      // Load note for selected date
      const noteData = await cloud.getNote(this.data.selectedDate)
      const dayNote = noteData ? noteData.content : ''
      const noteLines = this._computeLines(dayNote)

      this.setData({
        grid: gridWithDots,
        allReminders: reminders,
        tags: visibleTags,
        dayReminders: dayRemindersWithTag,
        selectedDateDisplay: dateUtil.getDateDisplay(this.data.selectedDate),
        dayNote,
        noteLines
      })
    } catch (err) {
      console.error('Failed to load data:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onPrevMonth() {
    let { year, month } = this.data
    if (month === 1) { year--; month = 12 }
    else { month-- }
    this.setData({ year, month })
    this.loadData()
  },

  onNextMonth() {
    let { year, month } = this.data
    if (month === 12) { year++; month = 1 }
    else { month++ }
    this.setData({ year, month })
    this.loadData()
  },

  onDayTap(e) {
    const { date } = e.detail
    this.setData({ selectedDate: date, previewTab: 0, selectMode: false, selectedIds: [] })
    this.loadData()
  },

  onSwitchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    if (tab !== this.data.previewTab) {
      this.setData({ previewTab: tab })
      if (tab === 1 && this.data.selectMode) {
        this.setData({ selectMode: false, selectedIds: [] })
      }
    }
  },

  _computeLines(text) {
    const lines = (text || '').split('\n')
    return lines.map((_, i) => i + 1)
  },

  _saveNoteDebounced: null,

  onNoteInput(e) {
    const dayNote = e.detail.value
    const noteLines = this._computeLines(dayNote)
    this.setData({ dayNote, noteLines })

    if (this._saveNoteDebounced) clearTimeout(this._saveNoteDebounced)
    this._saveNoteDebounced = setTimeout(async () => {
      try {
        await cloud.saveNote(this.data.selectedDate, dayNote)
      } catch (err) {
        console.error('Failed to save note:', err)
      }
    }, 500)
  },


  onViewDay() {
    wx.navigateTo({
      url: `/pages/day/day?date=${this.data.selectedDate}`
    })
  },

  onAddReminder() {
    wx.navigateTo({
      url: `/pages/editor/editor?date=${this.data.selectedDate}`
    })
  },

  onEditReminder(e) {
    if (this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/editor/editor?id=${id}`
    })
  },

  async onToggleDone(e) {
    if (this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    const item = this.data.dayReminders.find(r => r._id === id)
    if (!item) return
    try {
      if (item.repeat !== 'none') {
        let doneDates = item.doneDates || []
        if (doneDates.includes(this.data.selectedDate)) {
          doneDates = doneDates.filter(d => d !== this.data.selectedDate)
        } else {
          doneDates.push(this.data.selectedDate)
        }
        await cloud.updateReminder(id, { doneDates })
      } else {
        await cloud.updateReminder(id, { done: !item.done })
      }
      this.loadData()
    } catch (err) {
      console.error('Failed to toggle done:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  onToggleSelectMode() {
    const selectMode = !this.data.selectMode
    const dayReminders = this.data.dayReminders.map(r => ({
      ...r,
      _selected: false
    }))
    this.setData({ selectMode, dayReminders, selectedIds: [] })
  },

  onToggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const dayReminders = this.data.dayReminders.map(r => {
      if (r._id === id) {
        return { ...r, _selected: !r._selected }
      }
      return r
    })
    const selectedIds = dayReminders.filter(r => r._selected).map(r => r._id)
    this.setData({ dayReminders, selectedIds })
  },

  onDeleteSelected() {
    const selected = this.data.dayReminders.filter(r => r._selected)
    if (selected.length === 0) {
      wx.showToast({ title: '请选择要删除的提醒', icon: 'none' })
      return
    }
    wx.showModal({
      title: '删除提醒',
      content: `确定要删除选中的 ${selected.length} 条提醒吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await Promise.all(selected.map(r => cloud.deleteReminder(r._id)))
            wx.showToast({ title: `已删除 ${selected.length} 条` })
            this.setData({ selectMode: false, selectedIds: [] })
            this.loadData()
          } catch (err) {
            console.error('Failed to delete selected:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onCancelSelect() {
    const dayReminders = this.data.dayReminders.map(r => ({ ...r, _selected: false }))
    this.setData({ selectMode: false, dayReminders, selectedIds: [] })
  }
})
