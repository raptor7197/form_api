import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

// Register required chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-data");
      const data = response.data;

      setChartData({
        labels: Object.keys(data),
        datasets: [
          {
            label: "Issue Reports",
            data: Object.values(data),
            backgroundColor: ["#FF5733", "#33FF57", "#3357FF"],
            borderColor: ["#C70039", "#28A745", "#1A5276"],
            borderWidth: 1
          }
        ]
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data initially
    const interval = setInterval(fetchData, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div style={{ width: "50%", margin: "auto" }}>
      <h2>Real-Time Issue Reports</h2>
      <Bar data={chartData} />
    </div>
  );
};

export default Dashboard;
