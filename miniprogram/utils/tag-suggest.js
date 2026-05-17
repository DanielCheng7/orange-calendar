/**
 * Tag suggestion based on title keywords
 */

const KEYWORDS = {
  '工作': ['工作', '开会', '会议', '项目', '报告', '邮件', '方案', '任务', 'deadline', '客户', '面试', '周报', '述职', '汇报', '绩效', '需求', 'bug', '上线', '发布', '审批', '合同', '预算', '招聘', '代码', '开发', '设计', '产品', '运营', '方案', '计划', '总结', '沟通', '协调', '推进', '跟進', '交付'],
  '生活': ['买', '超市', '家务', '账单', '缴费', '快递', '修理', '购物', '水电', '燃气', '物业', '做饭', '吃饭', '吃', '餐', '外卖', '买菜', '洗', '扫', '倒垃圾', '取', '送', '还', '药', '医院', '看病', '体检', '运动', '健身', '跑步', '狗', '猫', '宠物', '缴费', '还款', '信用卡'],
  '学习': ['学习', '看书', '看', '书', '阅读', '读', '课程', '课', '作业', '考试', '复习', '笔记', '教程', '网课', '读书', '练习', '备考', '预习', '自学', '英语', '单词', '编程', '算法', '设计模式', '架构', '论文', '文献', '考证', '证书', '考研']
}

function suggestTag(title, tags) {
  if (!title || !tags || tags.length === 0) return null

  const lower = title.toLowerCase()

  let bestTag = null
  let bestScore = 0

  for (const tag of tags) {
    let score = 0
    const name = tag.name || ''

    // Direct match with tag name
    if (lower.includes(name.toLowerCase())) {
      score += 3
    }

    // Match keywords against title
    const keywords = KEYWORDS[name] || []
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestTag = tag
    }
  }

  return bestScore >= 1 ? bestTag : null
}

module.exports = { suggestTag }
