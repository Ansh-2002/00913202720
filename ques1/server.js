const express = require('express');
const axios = require('axios');

const app = express();
const API_URL = 'http://104.211.219.98/train';

// Register your company and obtain the authorization token
const authorizationToken = '';

app.get('/trains', async (req, res) => {
  try {
    // Fetch all train details from the John Doe Railway Server
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
