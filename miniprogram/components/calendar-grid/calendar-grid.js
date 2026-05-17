Component({
  properties: {
    grid: {
      type: Array,
      value: []
    },
    weekDays: {
      type: Array,
      value: ['日', '一', '二', '三', '四', '五', '六']
    },
    selectedDate: {
      type: String,
      value: ''
    }
  },

  methods: {
    onDayTap(e) {
      const { date } = e.currentTarget.dataset
      this.triggerEvent('daytap', { date })
    }
  }
})
