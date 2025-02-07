const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // Allows handling JSON data

// Sample report data
let reports = { Violation: 10, Criminal: 15, Threat: 8 };

// Route to get chart data
app.get("/get-data", (req, res) => {
    res.json({
      Violation: 11,
      Criminal: 15,
      Threat: 8
    });
  });
  

// Route to receive form data from webhook
app.post("/webhook", (req, res) => {
  const { issueType } = req.body;

  if (reports[issueType] !== undefined) {
    reports[issueType] += 1;
  } else {
    reports[issueType] = 1;
  }

  res.json({ message: "Data received", reports });
});

// Start the backend server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
