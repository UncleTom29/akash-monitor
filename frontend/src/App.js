// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BarChart from './components/BarChart';
import CalendarInput from './components/Calendar';
import Alerts from './components/Alerts';
import './App.css'; 

 

const App = () => { 
  const [cpuData, setCpuData] = useState([]);
  const [gpuData, setGpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [storageData, setStorageData] = useState([]);

  const fetchData = async (from, to) => {
    try {
      const response = await axios.get(`http://localhost:3001/search?from=${from}&to=${to}`);
      setCpuData(response.data.cpuChartData);
      setGpuData(response.data.gpuChartData);
      setMemoryData(response.data.memoryChartData);
      setStorageData(response.data.storageChartData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    fetchData(defaultStartDate.toISOString().split('T')[0], defaultEndDate.toISOString().split('T')[0]);
  }, []);

  const resources = ['CPU', 'GPU', 'Memory', 'Storage'];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resource Monitor Dashboard</h1>
      </header>
      <CalendarInput onSearch={(start, end) => fetchData(start.toISOString().split('T')[0], end.toISOString().split('T')[0])} />
      <div className="charts-container">
        <BarChart data={cpuData} title="CPU Utilization" type="CPU" />
        <BarChart data={gpuData} title="GPU Utilization" type="GPU" />
        <BarChart data={memoryData} title="Memory Utilization" type="Memory" />
        <BarChart data={storageData} title="Storage Utilization" type="Storage" />
      </div>
      <Alerts resources={resources} />
    </div>
  );
};

export default App;
