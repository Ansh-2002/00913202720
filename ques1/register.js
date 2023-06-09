const axios = require('axios');
const https = require('https');

const registerUrl = 'http://104.211.219.98/train/auth';

async function registerCompany() {
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

    const response = await axios.post(registerUrl, requestData, { httpsAgent: agent });
    console.log(response.data.access_token);
  } catch (error) {
    console.error(error);
  }
}

registerCompany();
