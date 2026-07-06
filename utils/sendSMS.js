require("dotenv").config();

const twilio = require("twilio");
const axios = require("axios");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber =
  process.env.TWILIO_WHATSAPP_SANDBOX_NUMBER ||
  process.env.TWILIO_WHATSAPP_PRODUCTION_NUMBER;

let client;
if (accountSid && authToken && accountSid.startsWith('AC')) {
  client = twilio(accountSid, authToken);
} else {
  console.log("Twilio not configured — WhatsApp features disabled.");
}
async function sendSingleWhatsAppMessage(
  to,
  body,
  isTemplate = false,
  templateContentSid = null,
  templateVariables = {}
) {
  if (!client) {
    return {
      success: false,
      error: "Twilio client not initialized. Check credentials.",
    };
  }
  try {
    const messageOptions = {
      from: twilioWhatsAppNumber, // Your Twilio WhatsApp sender number
      to: `whatsapp:${to}`, // Recipient's WhatsApp number
    };

    if (isTemplate) {
      if (!templateContentSid) {
        throw new Error(
          "templateContentSid is required for template messages."
        );
      }
      messageOptions.contentSid = templateContentSid;
      if (Object.keys(templateVariables).length > 0) {
        messageOptions.contentVariables = JSON.stringify(templateVariables);
      }
    } else {
      messageOptions.body = body;
    }

    const message = await client.messages.create(messageOptions);
    console.log(`Message sent successfully to ${to}. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(`Error sending message to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSingleWhatsAppMessage,
};

// // Send SMS Route
// const sendSMS = async ({ visitDetails }) => {

//   const numbers = visitDetails.numbers;
//   const message = visitDetails.message;

//   if (!numbers || !message) {
//     return res.status(400).json({ error: 'Phone numbers and message are required' });
//   }

//   console.log("numbers: ", numbers);
//   console.log("message: ", message);

//   try {
//     const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', null, {
//       headers: {
//         'authorization': X5AMW0cy3FjoOZ6Rl4vYzgPkfQCdsKHGNpiVmbwLD1ExaI8UB2WK5QhJ6Uj7Vyrsf8uFnXOG4PqBeCbI
//       },
//       params: {
//         message,
//         language: 'english',
//         route: 'q',
//         numbers
//       }
//     });

//     return true; // SMS sent successfully

//   } catch (error) {
//     console.error('SMS Sending Error:', error.response ? error.response.data : error.message);
//     return false; // SMS sending failed
//   }
// };

module.exports = {
  // sendSMS,
  sendSingleWhatsAppMessage,
};
