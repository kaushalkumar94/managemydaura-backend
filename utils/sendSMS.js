const axios = require('axios');

// Send SMS Route
const sendSMS = async ({ visitDetails }) => {

  const numbers = visitDetails.numbers;
  const message = visitDetails.message;

  if (!numbers || !message) {
    return res.status(400).json({ error: 'Phone numbers and message are required' });
  }

  console.log("numbers: ", numbers);
  console.log("message: ", message);

  try {
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', null, {
      headers: {
        'authorization': process.env.FAST_2_MESSAGE_API_KEY
      },
      params: {
        message,
        language: 'english',
        route: 'q',
        numbers
      }
    });

  } catch (error) {
    console.error('SMS Sending Error:', error.response ? error.response.data : error.message);
  }
};

module.exports = { sendSMS };