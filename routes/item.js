const express = require("express");
const router = express.Router();
const Item = require("../models/items");
const Topic = require("../models/topics");
const Chat = require("../models/Chat");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
router.use(bodyParser.json());
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).send("server error");
  }
});

router.get("/search", async (req, res) => {
  const { subjectName } = req.query;
  if (!subjectName) {
    return res.status(400).json({ msg: "Subject name is required" });
  }

  try {
    const items = await Item.find(
      {
        $or: [
          { "subjects.name1": subjectName },
          { "subjects.name2": subjectName },
          { "subjects.name3": subjectName },
          { "subjects.name4": subjectName },
        ],
      },
      "title"
    );
    res.json(items);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

const OPENAI_API_KEY = process.env.OPEN_API;
const abortControllers = {};

router.post("/message", async (req, res) => {
  const { message, requestId } = req.body;
  if (abortControllers[requestId]) {
    abortControllers[requestId].abort();
  }

  const controller = new AbortController();
  abortControllers[requestId] = controller;
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );
    const assistantMessage = response.data.choices[0].message.content;
    res.json({ reply: assistantMessage });
  } catch (error) {
    if (error.name === "AbortError") {
      res.status(499).json({ error: "Request aborted" });
    }
    if (error.code === "ERR_CANCELED") {
      res.status(499).json({ error: "Request aborted" });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch response from OpenAI API" });
    }
  } finally {
    delete abortControllers[requestId];
  }
});

router.post("/chat/stop", (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "requestId is required" });
  }
  const controller = abortControllers[requestId];
  if (controller && typeof controller.abort === "function") {
    controller.abort();
    delete abortControllers[requestId];
    res.json({ message: "Request aborted" });
  } else {
    console.error(`No valid controller found for requestId: ${requestId}`);
    res.status(400).json({ error: "Invalid requestId or no request to abort" });
  }
});

router.post("/topics", async (req, res) => {
  const { subject } = req.body;

  try {
    const topicsData = await Topic.find(
      { "subjects.subject": subject },
      { "subjects.$": 1 }
    );

    if (topicsData.length > 0) {
      const topics = topicsData[0].subjects[0].topics;
      res.json({ subject, topics });
    } else {
      res.status(404).json({ message: "Subject not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error retrieving topics", error });
  }
});
router.post("/chat/new", async (req, res) => {
  const { name, message } = req.body;
  try {
    const newChat = new Chat({
      id: uuidv4(),
      name,
      message,
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/chat/history", async (req, res) => {
  try {
    const chats = await Chat.find({});
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat histories" });
  }
});
// router.get("/chat/:name", async (req, res) => {
//   const chatName = req.params.name;
//   try {
//     const chat = await Chat.findOne({ name: chatName });
//     res.json(chat);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch chat" });
//   }
// });
router.get("/chat/:id", async (req, res) => {
  const chatId = req.params.id;

  try {
    const chat = await Chat.findOne({ id: chatId });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});
module.exports = router;
