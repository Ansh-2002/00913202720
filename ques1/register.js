const axios = require('axios');
const https = require('https');

const registerUrl = 'https://104.211.219.98/train/register';

async function registerCompany() {
  try {
    const requestData = {
      companyName: 'Travel Buddy',
      ownerName: 'Anshdeep Singh',
      rollNo:"00913202720",
      ownerEmail: 'anshdeep0singh@gmail.com',
      accessCode: 'uzytMO'
    };

    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post(registerUrl, requestData, { httpsAgent: agent });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

registerCompany();
