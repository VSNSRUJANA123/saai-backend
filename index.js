const express = require("express");
const connectDB = require("./db/module");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/", require("./routes/item"));
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT} `);
});
