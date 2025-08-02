const FormatDateTime = (dateTime) => {
  const dateObj = new Date(dateTime);

  // Format date as "DD-MM-YY"
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(dateObj.getFullYear()).slice(-2);
  const formattedDate = `${day}-${month}-${year}`;

  // Format time as "hh:mm AM/PM"
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const amPm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // 24h to 12h format
  const formattedTime = `${hours}:${minutes} ${amPm}`;

  return { date: formattedDate, time: formattedTime };
};

module.exports = { FormatDateTime };
