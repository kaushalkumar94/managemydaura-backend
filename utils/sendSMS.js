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
        'authorization': X5AMW0cy3FjoOZ6Rl4vYzgPkfQCdsKHGNpiVmbwLD1ExaI8UB2WK5QhJ6Uj7Vyrsf8uFnXOG4PqBeCbI
      },
      params: {
        message,
        language: 'english',
        route: 'q',
        numbers
      }
    });

    return true; // SMS sent successfully

  } catch (error) {
    console.error('SMS Sending Error:', error.response ? error.response.data : error.message);
    return false; // SMS sending failed
  }
};

module.exports = { sendSMS };