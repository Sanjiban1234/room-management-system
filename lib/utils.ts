/**
 * Helper to check if a booking slot has already passed
 * @param dateStr Format: YYYY-MM-DD
 * @param timeSlot Format: "H:MM-H:MM" or "HH:MM-HH:MM"
 */
export function hasBookingPassed(dateStr: string, timeSlot: string): boolean {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    
    // Set to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (bookingDate < today) return true;
    if (bookingDate > today) return false;
    
    // If it's today, check the time
    // Extract the end time from "Start-End"
    const times = timeSlot.split('-');
    const endTimeStr = times[1] || times[0]; // Fallback to start if no end
    
    const [endHourStr, endMinuteStr] = endTimeStr.split(':');
    let endHour = parseInt(endHourStr);
    const endMinute = parseInt(endMinuteStr);
    
    // Standard application time assumption: If it's 1-6 without PM, it's likely PM
    // Adjust based on your specific app's time format (usually 2:30-3:30 is 14:30-15:30)
    // If endHour is less than 9, assume it's PM
    if (endHour < 9) endHour += 12;
    
    const sessionEndTime = new Date(today);
    sessionEndTime.setHours(endHour, endMinute, 0);
    
    return now > sessionEndTime;
  } catch (e) {
    return false;
  }
}
