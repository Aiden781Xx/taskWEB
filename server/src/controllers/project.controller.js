const { body } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// Validation rules
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      // Admins can see all projects
      projects = await Project.find()
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .sort({ updatedAt: -1 });
    } else {
      // Members only see projects they belong to
      projects = await Project.find({ 'members.user': req.user._id })
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .sort({ updatedAt: -1 });
    }

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return {
          ...project.toObject(),
          taskCounts: counts,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithCounts.length,
      data: { projects: projectsWithCounts },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (member of project)
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check membership (unless global admin)
    const isMember = project.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: { project, tasks },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      color,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project: populatedProject },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (admin of project)
const updateProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check if user is project admin or global admin
    const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());
    if ((!membership || membership.role !== 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admins can update projects.' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (admin of project)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check if user is project owner or global admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete projects.' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete project
    await Project.findByIdAndDelete(project._id);

    res.status(200).json({
      success: true,
      message: 'Project and all its tasks deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (admin of project)
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check if user is project admin
    const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());
    if ((!membership || membership.role !== 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admins can add members.' });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found with this email.' });
    }

    // Check if already a member
    const alreadyMember = project.members.some((m) => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project.' });
    }

    project.members.push({
      user: userToAdd._id,
      role: role || 'member',
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: `${userToAdd.name} added to project.`,
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (admin of project)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check if user is project admin
    const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());
    if ((!membership || membership.role !== 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admins can remove members.' });
    }

    // Can't remove the owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();

    // Unassign tasks from removed member
    await Task.updateMany(
      { project: project._id, assignee: req.params.userId },
      { assignee: null }
    );

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Member removed from project.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  projectValidation,
};
