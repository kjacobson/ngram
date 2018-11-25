module.exports = formattedTime = (remaining, showMinutes = false) => {
    const minutes = remaining / 60;
    const minutesInt = Math.floor(minutes);
    let seconds = remaining % 60;
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return (minutesInt || '') + ':' + seconds;
};
