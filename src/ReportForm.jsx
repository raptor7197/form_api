import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import io from "socket.io-client";
import "./ReportForm.css";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import ShapeBlur from './particles';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const socket = io("http://localhost:5000");

const ReportForm = () => {
  const [formData, setFormData] = useState({ category: "", description: "" });
  const [graphData, setGraphData] = useState({ violation: 0, criminal: 0, threat: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/graph");
        setGraphData(response.data);
      } catch (error) {
        setError("Error fetching data. Please try again.");
        console.error("Error fetching data:", error);
      }
      setIsLoading(false);
    };

    fetchData();

    socket.on("updateGraph", (updatedData) => {
      setGraphData(updatedData);
    });

    return () => socket.off("updateGraph");
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
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
    } catch (error) {
      setError("Error submitting report. Please try again.");
      console.error("Error submitting report:", error);
    }
    setIsLoading(false);
  };

  const chartData = useMemo(() => ({
    labels: ["Violation", "Criminal", "Threat"],
    datasets: [
      {
        label: "Report Counts",
        data: [graphData.violation, graphData.criminal, graphData.threat],
        backgroundColor: ["#f87171", "#3b82f6", "#facc15"],
        borderColor: ["#dc2626", "#1d4ed8", "#ca8a04"],
        hoverBorderColor: ["#7a38c7","#84ca35","#dc9123"],
        borderWidth: 2,
      }
    ],
  }), [graphData]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="report-form-container">
      {/* <ShapeBlur /> */}
      <form className="form" onSubmit={handleSubmit}>
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
        <button className="form-submit-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <div className="graph-section">
        <h3>Graph Data</h3>
        <Bar data={chartData} />
      </div>
    </div>
  );
};

export default ReportForm;
