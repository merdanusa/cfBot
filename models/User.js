const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  query: String,
  type: String,
  timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: String,
  joinedAt: { type: Date, default: Date.now },
  isVip: { type: Boolean, default: false },
  vipExpires: Date,
  history: [historySchema],
  searchCount: { type: Number, default: 0 },
  spyCount: { type: Number, default: 0 },
  lastSearch: Date,
  lastSpy: Date,
});

module.exports = mongoose.model("User", userSchema);
