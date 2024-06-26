const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const chatSchema = new Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  message: [],
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
