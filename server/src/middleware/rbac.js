const Project = require('../models/Project');

// Check if user has a specific global role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`,
      });
    }
    next();
  };
};

// Check if user is a member of a project (and optionally has a specific project role)
const authorizeProjectRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.params.projectId || req.body.project;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required.',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found.',
        });
      }

      // Check if user is a member of the project
      const membership = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!membership) {
        // Allow global admins to access any project
        if (req.user.role === 'admin') {
          req.project = project;
          req.projectRole = 'admin';
          return next();
        }
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project.',
        });
      }

      // If specific roles are required, check project role
      if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Project role '${membership.role}' is not authorized for this action.`,
        });
      }

      req.project = project;
      req.projectRole = membership.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error during authorization.',
      });
    }
  };
};

module.exports = { authorizeRoles, authorizeProjectRole };
