const mongoose = require('mongoose');

/**
 * Project Schema
 * Represents a project or category that work can be logged against.
 * Includes a list of user references for team members assigned to the project.
 */
const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
