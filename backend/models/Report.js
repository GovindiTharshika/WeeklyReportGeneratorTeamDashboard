const mongoose = require('mongoose');

/**
 * Report Schema
 * Represents a weekly status report submitted by a team member.
 * Contains references to the user and the project, along with work details.
 */
const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  tasksCompleted: {
    type: String,
    required: true
  },
  tasksPlanned: {
    type: String,
    required: true
  },
  blockers: {
    type: String,
    required: false
  },
  hoursWorked: {
    type: Number,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['submitted', 'late', 'pending', 'draft', 'Draft'],
    default: 'submitted'
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
