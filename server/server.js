require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);

// Get frontend URL from environment or use fallback
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});

mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // 
});

const reportSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['violation', 'criminal', 'threat']
  },
  description: {
    type: String,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Report = mongoose.model('Report', reportSchema);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Helper function to get formatted counts
async function getFormattedCounts() {
  const graphCounts = await Report.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  return graphCounts.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, { violation: 0, criminal: 0, threat: 0 });
}

// Routes
app.get("/", (req, res) => {
  res.send("Server is running! Use /report to submit data.");
});

app.get("/graph", async (req, res) => {
  try {
    const formattedCounts = await getFormattedCounts();
    res.json(formattedCounts);
  } catch (error) {
    console.error("Error fetching graph data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/text", (req, res) => {
  res.json({ text: "This is some example text from the backend." });
});

app.post("/report", async (req, res) => {
  try {
    const { category, description } = req.body;

    if (!category || !['violation', 'criminal', 'threat'].includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ error: "Description is required" });
    }

    const newReport = new Report({ category, description });
    await newReport.save();

    const formattedCounts = await getFormattedCounts();

    io.emit("updateGraph", formattedCounts);
    res.json(formattedCounts);
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);
  
  try {
    const formattedCounts = await getFormattedCounts();
    socket.emit("updateGraph", formattedCounts);
  } catch (error) {
    console.error("Error fetching initial graph data:", error);
    socket.emit("error", { message: "Could not fetch initial data" });
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});