const mongoose = require('mongoose');
const Report = require('./models/Report');
const Project = require('./models/Project');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const startOfWeek = new Date('2026-07-04T18:30:00.000Z');
        const workloadByProject = await Report.aggregate([
          { $match: { weekStartDate: { $gte: startOfWeek } } },
          { $group: { _id: '$projectId', totalHours: { $sum: '$hoursWorked' }, count: { $sum: 1 } } }
        ]);
        
        console.log('Aggregation result:', workloadByProject);
        const populatedWorkload = await Project.populate(workloadByProject, { path: '_id', select: 'name' });
        console.log('Populated:', populatedWorkload);
    } catch(e) {
        console.error('ERROR:', e.message);
    }
    mongoose.connection.close();
});
