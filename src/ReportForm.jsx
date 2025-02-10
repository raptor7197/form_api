import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import io from "socket.io-client";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Initialize WebSocket connection
const socket = io("http://localhost:5000");

const ReportForm = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [graphData, setGraphData] = useState({ violation: 0, criminal: 0, threat: 0 });

  // Fetch initial graph data from the server
  useEffect(() => {
    axios.get("http://localhost:5000/graph")
      .then(response => setGraphData(response.data))
      .catch(error => console.error("Error fetching graph data:", error));

    // Listen for real-time updates
    socket.on("updateGraph", (updatedData) => {
      setGraphData(updatedData);
    });

    return () => {
      socket.off("updateGraph");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !category || !description) {
      alert("All fields are required!");
      return;
    }

    try {
      await axios.post("http://localhost:5000/report", {
        name,
        category,
        description
      });

      setName("");
      setCategory("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  // Chart.js data
  const chartData = {
    labels: ["Violation", "Criminal", "Threat"],
    datasets: [
      {
        label: "Report Counts",
        data: [graphData.violation, graphData.criminal, graphData.threat],
        backgroundColor: ["#f87171", "#3b82f6", "#facc15"], // Red, Blue, Yellow
        borderColor: ["#dc2626", "#1d4ed8", "#ca8a04"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Report Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Category</option>
          <option value="violation">Violation</option>
          <option value="criminal">Criminal</option>
          <option value="threat">Threat</option>
        </select>

        <textarea
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Submit
        </button>
      </form>

      {/* Graph Section */}
      <h3 className="mt-6 text-lg font-bold">Graph Data</h3>
      <div className="mt-4">
        <Bar data={chartData} />
      </div>
    </div>
  );
};

export default ReportForm;
