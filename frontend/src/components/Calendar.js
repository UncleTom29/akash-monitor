// src/components/CalendarInput.js
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CalendarInput = ({ onSearch }) => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  const handleSearch = () => {
    onSearch(startDate, endDate);
  };

  return (
    <div>
      <DatePicker selected={startDate} onChange={date => setStartDate(date)} />
      <DatePicker selected={endDate} onChange={date => setEndDate(date)} />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default CalendarInput;
