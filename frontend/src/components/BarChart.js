// src/components/BarChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-plugin-datalabels';
import '../styling/BarChart.css';

// Register the components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const convertToUnits = (value, type) => {
  switch (type) {
    case 'CPU':
      return (value / 1000).toFixed(2); // Convert to CPU units
    case 'GPU':
      return value; // Leave GPU values as they are
    case 'Memory':
    case 'Storage':
      return (value / 1000000000).toFixed(2); // Convert to TB
    default:
      return value;
  }
};

const BarChart = ({ data, title, type }) => {
  const chartData = {
    labels: [...new Set(data.map(entry => entry.date))], // Ensure unique dates
    datasets: data.reduce((datasets, entry) => {
      const datasetIndex = datasets.findIndex(dataset => dataset.label === entry.node);
      if (datasetIndex === -1) {
        datasets.push({
          label: entry.node,
          data: data.filter(item => item.node === entry.node).map(item => convertToUnits(item.value, type)),
          backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`,
        });
      }
      return datasets;
    }, []),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom height and width
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw} ${type === 'Memory' || type === 'Storage' ? 'TB' : type}`;
          },
        },
      },
      datalabels: {
        display: true,
        align: 'end',
        anchor: 'end',
        formatter: (value) => `${value} ${type === 'Memory' || type === 'Storage' ? 'TB' : type}`,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Daily Averages',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Quantity',
        },
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return `${value} ${type === 'Memory' || type === 'Storage' ? 'TB' : type}`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div className="chart-border">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChart;
