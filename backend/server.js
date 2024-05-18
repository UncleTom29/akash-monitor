const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { DateTime } = require('luxon');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const {
  COUCHDB_URL,
  DB_NAME,
  DESIGN_DOC,
  CPU_VIEW,
  GPU_VIEW,
  MEMORY_VIEW,
  STORAGE_VIEW,
  COUCHDB_USERNAME,
  COUCHDB_PASSWORD,
  EMAIL_USER,
  EMAIL_PASS,
} = process.env;

// Log environment variables for debugging
console.log('COUCHDB_URL:', COUCHDB_URL);
console.log('DB_NAME:', DB_NAME);
console.log('DESIGN_DOC:', DESIGN_DOC);
console.log('CPU_VIEW:', CPU_VIEW);
console.log('GPU_VIEW:', GPU_VIEW);
console.log('MEMORY_VIEW:', MEMORY_VIEW);
console.log('STORAGE_VIEW:', STORAGE_VIEW);
console.log('COUCHDB_USERNAME:', COUCHDB_USERNAME);
console.log('COUCHDB_PASSWORD:', COUCHDB_PASSWORD);
console.log('EMAIL_USER:', EMAIL_USER);
console.log('EMAIL_PASS:', EMAIL_PASS);

const AUTH = Buffer.from(`${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`).toString('base64');

const fetch = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${AUTH}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

const convertToChartDataFormat = (dbRows) => {
  if (dbRows.length > 0) {
    return dbRows.map((row) => {
      const { key, value } = row;
      const date = DateTime.fromISO(key[0]).toISODate();
      const node = key[1];
      const average = (value.sum / value.count).toFixed(2);
      return { node, date, value: average };
    });
  }
  return [{ node: '', date: '', value: '' }];
};

const sendEmailNotification = (email, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Resource Monitoring Alert',
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

let alerts = [];

app.get(['/', '/search'], async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Please provide both start and end dates' });
  }

  const endDate = DateTime.fromISO(to).endOf('day').toISO();
  const startDate = DateTime.fromISO(from).startOf('day').toISO();

  const urls = [
    `${COUCHDB_URL}/${DB_NAME}/_design/${DESIGN_DOC}/_view/${CPU_VIEW}?startkey=["${startDate}"]&endkey=["${endDate}"]&inclusive_end=true&group_level=2`,
    `${COUCHDB_URL}/${DB_NAME}/_design/${DESIGN_DOC}/_view/${GPU_VIEW}?startkey=["${startDate}"]&endkey=["${endDate}"]&inclusive_end=true&group_level=2`,
    `${COUCHDB_URL}/${DB_NAME}/_design/${DESIGN_DOC}/_view/${MEMORY_VIEW}?startkey=["${startDate}"]&endkey=["${endDate}"]&inclusive_end=true&group_level=2`,
    `${COUCHDB_URL}/${DB_NAME}/_design/${DESIGN_DOC}/_view/${STORAGE_VIEW}?startkey=["${startDate}"]&endkey=["${endDate}"]&inclusive_end=true&group_level=2`,
  ];

  try {
    const responses = await Promise.all(urls.map(fetch));

    const cpuChartData = convertToChartDataFormat(responses[0]?.rows || []);
    const gpuChartData = convertToChartDataFormat(responses[1]?.rows || []);
    const memoryChartData = convertToChartDataFormat(responses[2]?.rows || []);
    const storageChartData = convertToChartDataFormat(responses[3]?.rows || []);

    // Check for alerts
    alerts.forEach((alert) => {
      responses.forEach((response, index) => {
        const resourceType = ['CPU', 'GPU', 'Memory', 'Storage'][index];
        const data = response?.rows || [];
        data.forEach((row) => {
          const value = row.value.sum / row.value.count;
          if (value > alert.milestone) {
            sendEmailNotification(alert.email, `${resourceType} usage exceeded ${alert.milestone}. Current usage: ${value.toFixed(2)}`);
          }
        });
      });
    });

    res.json({
      cpuChartData,
      gpuChartData,
      memoryChartData,
      storageChartData,
      startDate: startDate.split('T')[0],
      endDate: endDate.split('T')[0],
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/alerts', async (req, res) => {
  const { resource, milestone, email } = req.body;

  try {
    alerts.push({ resource, milestone, email });
    res.status(201).json({ message: 'Alert created successfully' });
  } catch (error) {
    console.error('Error creating alert:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
