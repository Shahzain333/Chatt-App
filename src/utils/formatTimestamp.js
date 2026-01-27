export const formatTimestamp = (timestamp, showTime = false) => {
  if (!timestamp) return '';
  
  let date;
  
  // Handle all timestamp formats
  if (typeof timestamp === 'string') {
    date = new Date(timestamp); // JavaScript automatically converts UTC to local time
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    return '';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Get local time components
  const localHours = date.getHours(); // Already in local time
  const localMinutes = date.getMinutes();
  
  // Format time
  const ampm = localHours >= 12 ? 'PM' : 'AM';
  const formattedHours = localHours % 12 || 12;
  const formattedMinutes = localMinutes < 10 ? `0${localMinutes}` : localMinutes;
  const formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  // Check dates
  if (date >= today) {
    return formattedTime;
  }
  
  if (date >= yesterday && date < today) {
    return "Yesterday";
  }
  
  // For older dates
  const day = date.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  const suffix = day >= 11 && day <= 13 ? "th" 
    : day % 10 === 1 ? "st" 
    : day % 10 === 2 ? "nd" 
    : day % 10 === 3 ? "rd" 
    : "th";

  if (year !== now.getFullYear()) {
    return `${day}${suffix} ${month}, ${year}`;
  }
  
  return `${day}${suffix} ${month}`;

};