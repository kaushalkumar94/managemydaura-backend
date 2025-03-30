const { db } = require('../firebaseConfig');
const { sendSMS } = require('../utils/sendSMS')

const sendSMSController = async (req, res, next) => {

    const { visitId } = req.body;

    // console.log("visitId: ", visitId);

    if(!visitId) {
        return res.status(500).json({ message: "visitId not provided" });
    }

    try {

        // Fetch visit details using visitId
        const visitDoc = await db.collection('visitCollection').doc(visitId).get();

        if (!visitDoc.exists) {
            return res.status(404).json({ message: 'Visit not found' });
        }

        const { message, location } = visitDoc.data();

        // console.log("message: ", message);
        // console,location("dateTime: ", dateTime);
        // console.log("location: ", location);

        if (!message || !location) {
            return res.status(400).json({ message: 'Missing required visit details' });
        }

        // Fetch all workers from the database
        const workersSnapshot = await db.collection('workerCollection').get();

        if (workersSnapshot.empty) {
            return res.status(404).json({ message: 'No workers found' });
        }

        // Extract phone numbers and create a comma-separated string
        const phoneNumbers = workersSnapshot.docs
            .map(doc => doc.data().phone)
            .filter(phone => phone);

        if (phoneNumbers.length === 0) {
            return res.status(400).json({ message: 'No valid phone numbers found' });
        }

        const phoneNumbersString = phoneNumbers.join(',');

        const createdMessage = `Hello dear member,
                                ${message}

                                📍 Location: ${location}

                                Thank you.`;

        const visitDetails = {
            numbers: phoneNumbersString,
            message: createdMessage,
        };

        // console.log("visitDetails: ", visitDetails);

        // Send SMS using the utility function
        await sendSMS( { visitDetails } );

        res.status(200).json({ message: 'SMS sent successfully' });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ message: 'Failed to send SMS', error: error.message });
    }
}


module.exports = { sendSMSController }