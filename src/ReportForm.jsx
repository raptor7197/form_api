import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import io from "socket.io-client";
import "./ReportForm.css";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

// Backend URL - direct reference for simplicity
const socket = io("http://localhost:5000");

const ReportForm = () => {
  const [formData, setFormData] = useState({ 
    category: "", 
    description: "" 
  });
  
  const [graphData, setGraphData] = useState({ 
    violation: 0, 
    criminal: 0, 
    threat: 0 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data fetching on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/graph");
        setGraphData(response.data);
        setError(null);
      } catch (err) {
        setError("Error fetching data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Socket listener for real-time updates
    socket.on("updateGraph", (updatedData) => {
      setGraphData(updatedData);
    });

    // Cleanup on unmount
    return () => {
      socket.off("updateGraph");
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ 
      ...prevData, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/report", formData);
      setFormData({ category: "", description: "" });
      setError(null);
    } catch (err) {
      setError("Error submitting report. Please try again.");
      console.error("Error submitting report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => ({
    labels: ["Violation", "Criminal", "Threat"],
    datasets: [
      {
        label: "Report Counts",
        data: [
          graphData.violation || 0, 
          graphData.criminal || 0, 
          graphData.threat || 0
        ],
        backgroundColor: ["#f87171", "#3b82f6", "#facc15"],
        borderColor: ["#dc2626", "#1d4ed8", "#ca8a04"],
        borderWidth: 2,
      }
    ],
  }), [graphData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Report Categories',
      },
    },
  };

  // Loading state
  if (isLoading && !Object.values(graphData).some(val => val > 0)) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="report-form-container">
      <form className="form" onSubmit={handleSubmit}>
      <div className="name-group">
          <label htmlFor="name">Name</label>
          <textarea
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter Name"
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            <option value="violation">Violation</option>
            <option value="criminal">Criminal</option>
            <option value="threat">Threat</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter description"
            required
          ></textarea>
          
        </div>
        
        <button 
          className="form-submit-btn" 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="graph-section">
        <h3>Reports by Category</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ReportForm;