const Report = require('../models/Report');
const User = require('../models/User');
const Project = require('../models/Project');

exports.getDashboardMetrics = async (req, res) => {
  try {
    // Basic metrics for current week (simplification: last 7 days)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const totalTeamMembers = await User.countDocuments({ role: 'Team Member' });
    
    const reportsThisWeek = await Report.find({
      weekStartDate: { $gte: startOfWeek }
    }).populate('userId', 'name').populate('projectId', 'name');

    const submittedCount = reportsThisWeek.length;
    const pendingCount = totalTeamMembers - submittedCount;
    const complianceRate = totalTeamMembers > 0 ? (submittedCount / totalTeamMembers) * 100 : 0;

    let openBlockersCount = 0;
    reportsThisWeek.forEach(report => {
      if (report.blockers && report.blockers.trim().length > 0) {
        openBlockersCount++;
      }
    });

    // Chart Data: Workload distribution by project
    const workloadByProject = await Report.aggregate([
      { $match: { weekStartDate: { $gte: startOfWeek } } },
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
