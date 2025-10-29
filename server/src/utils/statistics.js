//file: api/express-rest-api/src/utils/statistics.js
const calculateUserStats = (users) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    return {
        totalUsers,
        activeUsers,
        inactiveUsers
    };
};

const calculateEventStats = (events) => {
    const totalEvents = events.length;
    const upcomingEvents = events.filter(event => new Date(event.date) > new Date()).length;
    const pastEvents = totalEvents - upcomingEvents;

    return {
        totalEvents,
        upcomingEvents,
        pastEvents
    };
};

const formatStats = (stats) => {
    return {
        ...stats,
        formattedTotalUsers: `${stats.totalUsers} users`,
        formattedTotalEvents: `${stats.totalEvents} events`
    };
};

module.exports = {
    calculateUserStats,
    calculateEventStats,
    formatStats
};