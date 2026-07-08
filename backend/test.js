const mongoose = require('mongoose');
const Report = require('./models/Report');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/weekly-reports';

mongoose.connect(MONGO_URI).then(async () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    console.log('startOfWeek:', startOfWeek);

    const allReports = await Report.find({});
    console.log('All reports count:', allReports.length);
    if (allReports.length > 0) {
      console.log('First report weekStartDate:', allReports[0].weekStartDate);
    }

    const reportsThisWeek = await Report.find({
      weekStartDate: { $gte: startOfWeek }
    });
    console.log('reportsThisWeek count:', reportsThisWeek.length);
    mongoose.connection.close();
});
