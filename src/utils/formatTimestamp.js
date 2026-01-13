export const formatTimestamp = (timestamp, showTime = false) => {
  if (!timestamp) return '';
  
  let date;
  
  // Handle Firebase timestamp (seconds & nanoseconds)
  if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // Handle ISO string directly
  else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  }
  // Handle milliseconds
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  }
  // Handle Firebase Timestamp object
  else if (timestamp.toDate) {
    date = timestamp.toDate();
  }
  else {
    return '';
  }

  const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };

  const formattedDate = date.toLocaleDateString("en-US", dateOptions);
  const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

  const day = date.getDate();
  const suffix = day >= 11 && day <= 13 ? "th" 
    : day % 10 === 1 ? "st" 
    : day % 10 === 2 ? "nd" 
    : day % 10 === 3 ? "rd" 
    : "th";

  const finalDate = formattedDate.replace(/(\d+)/, `$1${suffix}`);

  return showTime ? `${finalDate} · ${formattedTime}` : finalDate;
};