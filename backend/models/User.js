const mongoose = require('mongoose');

/**
 * User Schema
 * Represents an authenticated user in the system (either a Manager or Team Member).
 * Stores credentials and assigned projects.
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Team Member', 'Manager'],
    default: 'Team Member',
  },
  assignedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
