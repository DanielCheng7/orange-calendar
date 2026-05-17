Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    tagName: {
      type: String,
      value: ''
    },
    tagColor: {
      type: String,
      value: '#D4834A'
    }
  },

  methods: {
    repeatLabel(repeat) {
      const labels = { daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' }
      return labels[repeat] || ''
    },
    onTap() {
      this.triggerEvent('tap', { item: this.properties.item })
    },
    onToggleDone(e) {
      const { id } = e.currentTarget.dataset
      this.triggerEvent('toggledone', { id, item: this.properties.item })
    }
  }
})
