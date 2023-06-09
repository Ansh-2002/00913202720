import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';

const API_BASE_URL = 'http://localhost:3001'; // Replace with your backend API URL

const TrainListPage = () => {
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/trains`);
        console.log(response.data);
        console.log("hello")
        setTrains(response.data);
      } catch (error) {
        console.error('Failed to fetch train data:', error.message);
      }
    };

    fetchTrains();
  }, []);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" align="center" gutterBottom>
        All Trains
      </Typography>
      <List>
        {trains.map(train => (
          <ListItem key={train.trainNumber} button component={Link} to={`/trains/${train.trainNumber}`}>
            <ListItemText primary={train.trainName} secondary={`Train Number: ${train.trainNumber}`} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

const TrainDetailsPage = ({ match }) => {
  const [train, setTrain] = useState(null);

  useEffect(() => {
    const fetchTrain = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/trains/${match.params.trainNumber}`);
        setTrain(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Failed to fetch train data:', error.message);
      }
    };

    fetchTrain();
  }, [match.params.trainNumber]);

  return (
    <Container maxWidth="md">
      {train ? (
        <>
          <Typography variant="h4" align="center" gutterBottom>
            Train Details
          </Typography>
          <Typography variant="h6" gutterBottom>
            Train Name: {train.trainName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Train Number: {train.trainNumber}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Departure Time: {train.departureTime.Hours}:{train.departureTime.Minutes}:{train.departureTime.Seconds}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Sleeper Seats Available: {train.seatsAvailable.sleeper}
          </Typography>
          <Typography variant="body1" gutterBottom>
            AC Seats Available: {train.seatsAvailable.AC}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Sleeper Price: {train.price.sleeper}
          </Typography>
          <Typography variant="body1" gutterBottom>
            AC Price: {train.price.AC}
          </Typography>
        </>
      ) : (
        <Typography variant="body1" align="center">
          Loading train details...
        </Typography>
      )}
    </Container>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" component={TrainListPage} />
        <Route exact path="/trains/:trainNumber" component={TrainDetailsPage} />
      </Routes>
    </Router>
  );
};

export default App;