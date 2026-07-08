const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      userId: req.user._id,
      status: 'submitted'
    };
    const report = await Report.create(reportData);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('reportChanged', { action: 'create', report });
    }
    
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    let query = {};
    // If not a manager, can only view own reports
    if (req.user.role !== 'Manager') {
      query.userId = req.user._id;
    } else {
      // Manager filters
      if (req.query.userId) query.userId = req.query.userId;
      if (req.query.projectId) query.projectId = req.query.projectId;
      if (req.query.startDate && req.query.endDate) {
        query.weekStartDate = { $gte: new Date(req.query.startDate) };
        query.weekEndDate = { $lte: new Date(req.query.endDate) };
      }
    }

    const reports = await Report.find(query)
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .sort({ weekStartDate: -1 });
      
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('projectId', 'name');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check ownership if not manager
    if (req.user.role !== 'Manager' && report.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this report' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check ownership if not manager
    if (req.user.role !== 'Manager' && report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('reportChanged', { action: 'update', report });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
