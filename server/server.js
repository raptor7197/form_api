const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust if frontend runs on a different port
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Store counts for each category
let graphCounts = { violation: 0, criminal: 0, threat: 0 };

// Handle client connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  // Send the initial graph data when a client connects
  socket.emit("updateGraph", graphCounts);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// API endpoint to submit reports
app.post("/report", (req, res) => {
  const { category } = req.body;

  if (category && graphCounts.hasOwnProperty(category)) {
    graphCounts[category] += 1;

    // Emit updated graph data to all connected clients
    io.emit("updateGraph", graphCounts);
  }

  res.json(graphCounts);
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
