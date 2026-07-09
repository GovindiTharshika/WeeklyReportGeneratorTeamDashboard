const Report = require('../models/Report');
const User = require('../models/User');
const Project = require('../models/Project');

exports.getDashboardMetrics = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : (() => {
      const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
    })();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : (() => {
      const d = new Date(startDate); d.setDate(d.getDate() + 6); d.setHours(23, 59, 59, 999); return d;
    })();

    let query = {
      weekStartDate: { $gte: startDate, $lte: endDate }
    };
    
    const mongoose = require('mongoose');
    if (req.query.userId) query.userId = new mongoose.Types.ObjectId(req.query.userId);
    if (req.query.projectId) query.projectId = new mongoose.Types.ObjectId(req.query.projectId);

    const totalTeamMembers = await User.countDocuments({ role: 'Team Member' });
    
    const reportsThisWeek = await Report.find(query).populate('userId', 'name').populate('projectId', 'name');

    // Filter to only actual submitted reports for the metrics
    const submittedReports = reportsThisWeek.filter(r => r.status?.toLowerCase() !== 'draft');
    
    const submittedCount = submittedReports.length;
    const pendingCount = totalTeamMembers > submittedCount ? totalTeamMembers - submittedCount : 0;
    const complianceRate = totalTeamMembers > 0 ? (submittedCount / totalTeamMembers) * 100 : 0;

    let openBlockersCount = 0;
    reportsThisWeek.forEach(report => {
      if (report.blockers && report.blockers.trim().length > 0) {
        openBlockersCount++;
      }
    });

    // Chart Data: Workload distribution by project
    const workloadByProject = await Report.aggregate([
      { $match: query },
      { $group: { _id: "$projectId", totalHours: { $sum: "$hoursWorked" }, count: { $sum: 1 } } }
    ]);

    const populatedWorkload = await Project.populate(workloadByProject, { path: '_id', select: 'name' });
    const workloadChartData = populatedWorkload.map(item => ({
      name: item._id ? item._id.name : 'Unknown',
      hours: item.totalHours || 0,
      reports: item.count
    }));

    // Chart Data: Submission status (could be expanded)
    const submissionStatusData = [
      { name: 'Submitted', value: submittedCount },
      { name: 'Pending', value: pendingCount > 0 ? pendingCount : 0 }
    ];

    const responseData = {
      summary: {
        totalReportsSubmitted: submittedCount,
        complianceRate: complianceRate.toFixed(1),
        openBlockers: openBlockersCount,
        pendingReports: pendingCount > 0 ? pendingCount : 0
      },
      charts: {
        workloadByProject: workloadChartData,
        submissionStatus: submissionStatusData
      },
      recentReports: reportsThisWeek.slice(0, 5) // Send 5 most recent
    };
    console.log('Dashboard Response:', JSON.stringify(responseData));
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
