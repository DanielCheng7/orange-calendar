const cloud = require('../../utils/cloud')

const PRESET_COLORS = ['#FF6B6B', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63']

Page({
  data: {
    tags: [],
    presetColors: PRESET_COLORS,
    pickingTagId: ''
  },

  onLoad() {
    const app = getApp()
    this.setData({ _isDark: app.globalData.isDark })
    app.applyCurrentTheme()
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

      // Ensure 4 defaults exist
      const defaultDefs = [
        { name: '默认', color: '#9E9E9E', order: 0, builtIn: true },
        { name: '工作', color: '#FF6B6B', order: 1, builtIn: true },
        { name: '生活', color: '#4CAF50', order: 2, builtIn: true },
        { name: '学习', color: '#2196F3', order: 3, builtIn: true }
      ]
      for (const def of defaultDefs) {
        if (!tags.some(t => t.name === def.name)) {
          await cloud.addTag(def)
        }
      }

      tags = await cloud.getTags()
      // Filter out "新标签" from display (may persist in DB if deletion unavailable)
      tags = tags.filter(t => t.name !== '新标签')
      tags.sort((a, b) => (a.order || 999) - (b.order || 999))
      this.setData({ tags, pickingTagId: '' })
    } catch (err) {
      console.error('Failed to load tags:', err)
    }
  },

  async onAddTag() {
    wx.showModal({
      title: '新建标签',
      editable: true,
      placeholderText: '输入标签名称',
      success: async (res) => {
        if (!res.confirm || !res.content.trim()) return
        const name = res.content.trim()
        const defaultColors = ['#FF6B6B', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0']
        const usedColors = this.data.tags.map(t => t.color)
        const color = defaultColors.find(c => !usedColors.includes(c)) || '#D4834A'
        try {
          await cloud.addTag({
            name,
            color,
            order: this.data.tags.length,
            builtIn: false
          })
          this.loadTags()
        } catch (err) {
          console.error('Failed to add tag:', err)
        }
      }
    })
  },

  onRenameTag(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name || ''
    wx.showModal({
      title: '重命名标签',
      editable: true,
      placeholderText: '输入新名称',
      content: name,
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          const newName = res.content.trim()
          const index = this.data.tags.findIndex(t => t._id === id)
          if (index > -1) {
            this.setData({ [`tags[${index}].name`]: newName })
          }
          await cloud.updateTag(id, { name: newName })
        }
      }
    })
  },

  onToggleColorPicker(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      pickingTagId: this.data.pickingTagId === id ? '' : id
    })
  },

  async onPickColor(e) {
    const color = e.currentTarget.dataset.color
    const id = this.data.pickingTagId
    if (!id) return
    try {
      await cloud.updateTag(id, { color })
      this.setData({ pickingTagId: '' })
      this.loadTags()
    } catch (err) {
      console.error('Failed to update tag color:', err)
    }
  },

  async onDeleteTag(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后，已有提醒的标签将不再显示颜色',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cloud.deleteTag(id)
            this.loadTags()
          } catch (err) {
            console.error('Failed to delete tag:', err)
          }
        }
      }
    })
  }
})
