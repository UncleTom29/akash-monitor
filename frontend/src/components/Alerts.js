// src/components/Alerts.js
import React, { useState } from 'react';
import axios from 'axios';
import '../styling/Alerts.css';

const Alerts = ({ resources }) => {
  const [resource, setResource] = useState('');
  const [milestone, setMilestone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => { 
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/alerts', 
        { resource, milestone, email },
        {
          auth: {
            username: process.env.REACT_APP_COUCHDB_USERNAME,
            password: process.env.REACT_APP_COUCHDB_PASSWORD
          }
        }
      );
      setMessage('Alert created successfully');
      setResource('');
      setMilestone('');
      setEmail('');
    } catch (error) {
      setMessage('Error creating alert');
    }
  };
  return (
    <div className="alerts-container">
      <h3>Set Alerts</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="resource">Resource:</label>
          <select
            id="resource"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            required
          >
            <option value="">Select Resource</option>
            {resources.map((res, index) => (
              <option key={index} value={res}>
                {res}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="milestone">Milestone (%):</label>
          <input
            type="number"
            id="milestone"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            min="0"
            max="100"
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Set Alert</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Alerts;
