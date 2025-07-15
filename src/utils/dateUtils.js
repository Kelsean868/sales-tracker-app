/**
 * Adjusts a date to the beginning of the week based on user preference.
 * @param {Date} date The date to adjust.
 * @param {string} startOfWeek 'Sunday' or 'Monday'.
 * @returns {Date} The date of the first day of the week.
 */
export const getStartOfWeek = (date, startOfWeek = 'Sunday') => {
    const d = new Date(date);
    const day = d.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    const desiredStartDay = startOfWeek === 'Monday' ? 1 : 0;
    
    let diff;
    if (day >= desiredStartDay) {
        diff = day - desiredStartDay;
    } else {
        diff = day - desiredStartDay + 7;
    }

    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};
