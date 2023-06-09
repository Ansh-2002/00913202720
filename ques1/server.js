const express = require('express');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const app = express();
const API_URL = 'http://104.211.219.98/train';
const AUTH_API_URL = 'https://104.211.219.98/train/auth';

// const authorizationToken = process.env.AUTH_TOKEN;
let authorizationToken = '';

const fetchAuthorizationToken = async function registerCompany() {
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

    const response = await axios.post(AUTH_API_URL, requestData, { httpsAgent: agent });;
    const { access_token } = response.data;
    authorizationToken = `Bearer ${access_token}`;
    // authorizationToken = response.data.access_token;
  } catch (error) {
    console.error(error);
  }
}

// Fetch the authorization token on server startup
fetchAuthorizationToken();

app.get('/trains', async (req, res) => {
  try {
    // Fetch authorization token if not available
    if (!authorizationToken) {
      return res.status(500).json({ message: 'Authorization token not available' });
    }
    // Fetch all train details from the John Doe Railway Server
    const headers = { Authorization: authorizationToken };
    const response = await axios.get(`${API_URL}/trains`, { headers });
    const trains = response.data;
    
    // console.log(trains);

    if (!Array.isArray(trains)) {
      throw new Error('Invalid response format');
    }

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
 
     // Prepare the response with train details
     const trainSchedule = sortedTrains.map((train) => ({
       trainName: train.trainName,
       trainNumber: train.trainNumber,
       departureTime: train.departureTime,
       seatsAvailability: train.seatsAvailable,
       price: train.price,
     }));

    res.json(trainSchedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
