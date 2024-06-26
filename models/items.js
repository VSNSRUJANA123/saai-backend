const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  desc: {
    type: String,
  },
  subjects: {
    type: Object,
  },
  images: {
    type: Object,
  },
});
module.exports = mongoose.model("item", itemSchema);
