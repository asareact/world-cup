/**
 * Utility functions for time conversion for Cuban timezone (America/Havana)
 * This handles the conversion from UTC times stored in database to Cuban local times
 */

/**
 * Converts a time string in UTC to the equivalent time in Cuban timezone
 * Cuba uses UTC-5 (or UTC-4 during daylight saving, but we'll use -5 as standard)
 * 
 * @param timeString - Time in HH:MM format (UTC)
 * @returns Normalized time in HH:MM format (Cuba local time)
 */
export function normalizeCubanTime(timeString: string): string {
  // Parse the hour and minute from the input time string
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Apply the timezone offset (Cuba is UTC-5, so add 8 hours to UTC time)
  let cubanHour = hour + 8;
  
  // Handle day overflow (if adding offset pushes to next day)
  if (cubanHour >= 24) {
    cubanHour -= 24;
  }
  
  return `${cubanHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Converts a full datetime string in UTC to Cuban local time
 * 
 * @param dateTimeString - DateTime in ISO format (UTC)
 * @returns Date string in HH:MM format (Cuba local time)
 */
export function getNormalizedCubanTime(dateTimeString: string): string {
  if (!dateTimeString) return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    
    // Get UTC hours and minutes
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    
    // Apply the timezone offset (Cuba is UTC-5, so add 5 hours to UTC time)
    let cubanHour = utcHours + 8;
    
    // Handle day overflow (if adding offset pushes to next day)
    if (cubanHour >= 24) {
      cubanHour -= 24;
    } else if (cubanHour < 0) {
      cubanHour += 24;
    }
    
    return `${cubanHour.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error normalizing time:', error);
    return 'N/A';
  }
}

/**
 * Gets the Cuban date and time from a UTC datetime string
 * 
 * @param dateTimeString - DateTime in ISO format (UTC)
 * @returns Formatted date and time in Cuban timezone
 */
export function getNormalizedCubanDateTime(dateTimeString: string): { date: string; time: string } {
  if (!dateTimeString) return { date: 'N/A', time: 'N/A' };
  
  try {
    const date = new Date(dateTimeString);
    
    // Get UTC values
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // Month is 0-indexed
    const day = date.getUTCDate();
    
    // Apply timezone offset for Cuba (UTC-5)
    let cubanHour = utcHours + 8;
    let cubanDay = day;
    
    // Handle day transitions
    if (cubanHour >= 24) {
      cubanHour -= 24;
      cubanDay += 1;
      
      // Handle month/year transitions (simplified, doesn't handle end of month/year edge cases perfectly)
      const daysInMonth = new Date(year, month, 0).getDate();
      if (cubanDay > daysInMonth) {
        cubanDay = 1;
        let cubanMonth = month + 1;
        let cubanYear = year;
        
        if (cubanMonth > 12) {
          cubanMonth = 1;
          cubanYear = year + 1;
        }
        
        return {
          date: `${cubanYear}-${cubanMonth.toString().padStart(2, '0')}-${cubanDay.toString().padStart(2, '0')}`,
          time: `${cubanHour.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
        };
      }
    } else if (cubanHour < 0) {
      cubanHour += 24;
      cubanDay -= 1;
      if (cubanDay < 1) {
        let cubanMonth = month - 1;
        let cubanYear = year;
        
        if (cubanMonth < 1) {
          cubanMonth = 12;
          cubanYear = year - 1;
        }
        
        cubanDay = new Date(cubanYear, cubanMonth, 0).getDate(); // Last day of previous month
        
        return {
          date: `${cubanYear}-${cubanMonth.toString().padStart(2, '0')}-${cubanDay.toString().padStart(2, '0')}`,
          time: `${cubanHour.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
        };
      }
    }
    
    return {
      date: `${year}-${month.toString().padStart(2, '0')}-${cubanDay.toString().padStart(2, '0')}`,
      time: `${cubanHour.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
    };
  } catch (error) {
    console.error('Error normalizing date/time:', error);
    return { date: 'N/A', time: 'N/A' };
  }
}