const express = require('express');
const axios = require('axios');
const https = require('https');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const API_URL = 'http://104.211.219.98/train';
const AUTH_API_URL = 'https://104.211.219.98/train/auth';

let authorizationToken = '';
let trainSchedule = [];

// Fetch authorization token from the API
const fetchAuthorizationToken = async () => {
  try {
    const requestData = {
      companyName: 'Travel Buddy',
      clientID: '9026d4ef-a7ce-4571-a796-d4972e8f9444',
      ownerName: 'Anshdeep Singh',
      ownerEmail: 'anshdeep0singh@gmail.com',
      rollNo:"00913202720",
      clientSecret: 'EaCEmEUmEtNTDVBb'
    };

    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post(AUTH_API_URL, requestData, { httpsAgent: agent });
    authorizationToken = `Bearer ${response.data.access_token}`;

    // Fetch train schedules after obtaining the authorization token
    fetchTrainSchedules();
  } catch (error) {
    console.error(error);
  }
};

// Fetch train schedules from the John Doe Railway Server
const fetchTrainSchedules = async () => {
  try {
    // Make sure authorization token is available
    if (!authorizationToken) {
      console.log('Authorization token not available');
      return;
    }

    const headers = { Authorization: authorizationToken };
    const response = await axios.get(`${API_URL}/trains`, { headers });
    const trains = response.data;

    // Filter out trains departing in the next 30 minutes
    const currentDateTime = new Date();
    const twelveHoursLater = new Date(currentDateTime.getTime() + 12 * 60 * 60 * 1000);
    const filteredTrains = trains.filter((train) => {
      const departureTime = new Date();
      departureTime.setHours(train.departureTime.Hours, train.departureTime.Minutes, train.departureTime.Seconds);
      return departureTime >= currentDateTime && departureTime <= twelveHoursLater;
    });

    // Calculate actual departure time after considering delays
    filteredTrains.forEach((train) => {
      if (train.delayedBy) {
        const delayMinutes = train.delayedBy;
        const departureTime = new Date();
        departureTime.setHours(train.departureTime.Hours, train.departureTime.Minutes, train.departureTime.Seconds);
        departureTime.setMinutes(departureTime.getMinutes() + delayMinutes);
        train.departureTime.Hours = departureTime.getHours();
        train.departureTime.Minutes = departureTime.getMinutes();
        train.departureTime.Seconds = departureTime.getSeconds();
      }
    });

    // Sort trains based on price, available tickets, and departure time
    const sortedTrains = filteredTrains.sort((a, b) => {
      const priceComparison = a.price.sleeper - b.price.sleeper || a.price.AC - b.price.AC;
      const sleeperAvailabilityComparison = b.seatsAvailable.sleeper - a.seatsAvailable.sleeper;
      const acAvailabilityComparison = b.seatsAvailable.AC - a.seatsAvailable.AC;
      const departureTimeComparison =
        new Date(a.departureTime.Hours, a.departureTime.Minutes, a.departureTime.Seconds) -
        new Date(b.departureTime.Hours, b.departureTime.Minutes, b.departureTime.Seconds);
      return priceComparison || sleeperAvailabilityComparison || acAvailabilityComparison || departureTimeComparison;
    });

    trainSchedule = sortedTrains;

    console.log('Train schedules updated');
  } catch (error) {
    console.error('Failed to fetch train schedules:', error.message);
  }
};

// Fetch the authorization token and train schedules on server startup
fetchAuthorizationToken();
fetchTrainSchedules();

// Schedule periodic train schedule updates (every 1 hour in this example)
cron.schedule('0 * * * *', fetchTrainSchedules);

// Cache train schedules for a specified duration (5 minutes in this example)
const cacheDuration = 5 * 60 * 1000; // 5 minutes
let cacheTimestamp = 0;
let cachedData = [];

// Middleware to check if cached data is valid
const checkCache = (req, res, next) => {
  const currentTime = Date.now();
  if (currentTime - cacheTimestamp <= cacheDuration) {
    // Return cached data if still valid
    return res.json(cachedData);
  }
  // Proceed to fetch fresh data if cache is expired
  next();
};

app.get('/trains', checkCache, (req, res) => {
  res.json(trainSchedule);
});

app.listen(3001, () => {
  console.log('Server running on port 3000');
});
