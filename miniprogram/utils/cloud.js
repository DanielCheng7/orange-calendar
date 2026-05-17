/**
 * Cloud development wrapper
 */

const DB_NAME_REMINDERS = 'reminders'
const DB_NAME_TAGS = 'tags'
const DB_NAME_NOTES = 'notes'

let db = null

function init() {
  wx.cloud.init({
    env: wx.cloud.DYNAMIC_CURRENT_ENV
  })
  db = wx.cloud.database()
}

// ===== Reminders =====

async function getReminders() {
  const res = await db.collection(DB_NAME_REMINDERS).get()
  return res.data
}

function _getAllReminders() {
  return getReminders()
}

async function addReminder(reminder) {
  const data = {
    ...reminder,
    done: false,
    doneDates: [],
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }
  const res = await db.collection(DB_NAME_REMINDERS).add({ data })
  return res._id
}

async function updateReminder(id, fields) {
  fields.updatedAt = db.serverDate()
  return await db.collection(DB_NAME_REMINDERS).doc(id).update({ data: fields })
}

async function deleteReminder(id) {
  return await db.collection(DB_NAME_REMINDERS).doc(id).remove()
}

// ===== Tags =====

async function getTags() {
  const res = await db.collection(DB_NAME_TAGS).get()
  return res.data
}

async function addTag(tag) {
  const data = {
    ...tag,
    createdAt: db.serverDate()
  }
  const res = await db.collection(DB_NAME_TAGS).add({ data })
  return res._id
}

async function updateTag(id, fields) {
  return await db.collection(DB_NAME_TAGS).doc(id).update({ data: fields })
}

async function deleteTag(id) {
  return await db.collection(DB_NAME_TAGS).doc(id).remove()
}

// ===== Notes =====

async function getNote(date) {
  try {
    const res = await db.collection(DB_NAME_NOTES).where({ date }).get()
    return res.data[0] || null
  } catch (err) {
    return null
  }
}

async function saveNote(date, content) {
  try {
    const existing = await getNote(date)
    if (existing) {
      return await db.collection(DB_NAME_NOTES).doc(existing._id).update({
        data: { content, updatedAt: db.serverDate() }
      })
    }
  } catch (_) {}
  return await db.collection(DB_NAME_NOTES).add({
    data: { date, content, createdAt: db.serverDate(), updatedAt: db.serverDate() }
  })
}

module.exports = {
  init,
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  getTags,
  addTag,
  updateTag,
  deleteTag,
  getNote,
  saveNote
}
