const mongoose = require('mongoose');
const Report = require('./models/Report');
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/weekly-reports';

mongoose.connect(MONGO_URI).then(async () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    console.log('startOfWeek:', startOfWeek);

    const reportsThisWeek = await Report.find({
      weekStartDate: { $gte: startOfWeek }
    });
    console.log('reportsThisWeek count:', reportsThisWeek.length);
    if (reportsThisWeek.length === 0) {
        const all = await Report.find({});
        console.log('All reports count:', all.length);
        if (all.length > 0) {
            console.log('First report date:', all[0].weekStartDate);
            console.log('is it gte?', all[0].weekStartDate >= startOfWeek);
        }
    }
    mongoose.connection.close();
});
