// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173", // Adjust if frontend runs on a different port
//     methods: ["GET", "POST"],
//   },
// });

// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Server is running! Use /report to submit data.");
// });


// // Store counts for each category
// let graphCounts = { violation: 0, criminal: 0, threat: 0 };

// // Handle client connections
// io.on("connection", (socket) => {
//   console.log("Client connected:", socket.id);
  
//   // Send the initial graph data when a client connects
//   socket.emit("updateGraph", graphCounts);

//   socket.on("disconnect", () => {
//     console.log("Client disconnected:", socket.id);
//   });
// });

// // API endpoint to submit reports
// app.post("/report", (req, res) => {
//   const { category } = req.body;

//   if (category && graphCounts.hasOwnProperty(category)) {
//     graphCounts[category] += 1;

//     // Emit updated graph data to all connected clients
//     io.emit("updateGraph", graphCounts);
//   }

//   res.json(graphCounts);
// });

// // Start the server
// const PORT = 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define MongoDB schema and model
const reportSchema = new mongoose.Schema({
  category: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// API Routes
app.get("/", (req, res) => {
  res.send("Server is running! Use /report to submit data.");
});

app.get("/graph", async (req, res) => {
  try {
    const graphCounts = await Report.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const formattedCounts = graphCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { violation: 0, criminal: 0, threat: 0 });
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

    const newReport = new Report({ category, description });
    await newReport.save();

    const updatedCounts = await Report.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const formattedCounts = updatedCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { violation: 0, criminal: 0, threat: 0 });

    io.emit("updateGraph", formattedCounts);
    res.json(formattedCounts);
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Socket.io connection handling
io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);
  
  try {
    const initialCounts = await Report.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const formattedCounts = initialCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { violation: 0, criminal: 0, threat: 0 });
    socket.emit("updateGraph", formattedCounts);
  } catch (error) {
    console.error("Error fetching initial graph data:", error);
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
