const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  paper: {
    type: String,
    required: true,
  },
  subjects: [
    {
      subject: String,
      topics: [String],
    },
  ],
});

const Topic = mongoose.model("Topic", topicSchema);

module.exports = Topic;
