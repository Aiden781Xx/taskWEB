const { body } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 2, max: 200 }),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
];

const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignee, search, sort } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: userProjects.map((p) => p._id) };
    }
    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee === 'me' ? req.user._id : assignee;
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    let sortOpt = { updatedAt: -1 };
    if (sort === 'dueDate') sortOpt = { dueDate: 1 };
    if (sort === 'priority') sortOpt = { priority: -1 };
    const tasks = await Task.find(filter).populate('assignee', 'name email avatar').populate('createdBy', 'name email avatar').populate('project', 'name color').sort(sortOpt);
    res.status(200).json({ success: true, count: tasks.length, data: { tasks } });
  } catch (error) { next(error); }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignee', 'name email avatar').populate('createdBy', 'name email avatar').populate('project', 'name color');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.status(200).json({ success: true, data: { task } });
  } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignee, priority, dueDate, tags, status } = req.body;
    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ success: false, message: 'Project not found.' });
    const isMember = projectDoc.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'You must be a project member.' });
    const task = await Task.create({ title, description, project, assignee: assignee || null, createdBy: req.user._id, priority: priority || 'medium', status: status || 'todo', dueDate: dueDate || null, tags: tags || [] });
    const populated = await Task.findById(task._id).populate('assignee', 'name email avatar').populate('createdBy', 'name email avatar').populate('project', 'name color');
    res.status(201).json({ success: true, message: 'Task created.', data: { task: populated } });
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const project = await Project.findById(task.project);
    const membership = project ? project.members.find((m) => m.user.toString() === req.user._id.toString()) : null;
    const isProjectAdmin = membership && membership.role === 'admin';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    if (!isProjectAdmin && !isAssignee && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized.' });
    const { title, description, assignee, priority, status, dueDate, tags } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags) task.tags = tags;
    await task.save();
    const updated = await Task.findById(task._id).populate('assignee', 'name email avatar').populate('createdBy', 'name email avatar').populate('project', 'name color');
    res.status(200).json({ success: true, message: 'Task updated.', data: { task: updated } });
  } catch (error) { next(error); }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in-progress', 'review', 'done'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    task.status = status;
    await task.save();
    const updated = await Task.findById(task._id).populate('assignee', 'name email avatar').populate('createdBy', 'name email avatar').populate('project', 'name color');
    res.status(200).json({ success: true, data: { task: updated } });
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const project = await Project.findById(task.project);
    const membership = project ? project.members.find((m) => m.user.toString() === req.user._id.toString()) : null;
    if ((!membership || membership.role !== 'admin') && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can delete tasks.' });
    await Task.findByIdAndDelete(task._id);
    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (error) { next(error); }
};

const getDashboardStats = async (req, res, next) => {
  try {
    let projectFilter = {};
    let taskFilter = {};
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      const ids = userProjects.map((p) => p._id);
      projectFilter = { _id: { $in: ids } };
      taskFilter = { project: { $in: ids } };
    }
    const totalProjects = await Project.countDocuments(projectFilter);
    const taskStats = await Task.aggregate([{ $match: taskFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    let totalTasks = 0;
    taskStats.forEach((s) => { statusCounts[s._id] = s.count; totalTasks += s.count; });
    const overdueTasks = await Task.find({ ...taskFilter, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }).populate('assignee', 'name email avatar').populate('project', 'name color').sort({ dueDate: 1 }).limit(10);
    const myTasks = await Task.find({ assignee: req.user._id, status: { $ne: 'done' } }).populate('project', 'name color').sort({ dueDate: 1 }).limit(10);
    const recentTasks = await Task.find(taskFilter).populate('assignee', 'name email avatar').populate('project', 'name color').sort({ updatedAt: -1 }).limit(5);
    const priorityStats = await Task.aggregate([{ $match: { ...taskFilter, status: { $ne: 'done' } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]);
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityStats.forEach((p) => { priorityCounts[p._id] = p.count; });
    const User = require('../models/User');
    let totalMembers = 0;
    if (req.user.role === 'admin') { totalMembers = await User.countDocuments(); }
    else {
      const projects = await Project.find({ 'members.user': req.user._id });
      const s = new Set(); projects.forEach((p) => p.members.forEach((m) => s.add(m.user.toString()))); totalMembers = s.size;
    }
    res.status(200).json({ success: true, data: { totalProjects, totalTasks, totalMembers, statusCounts, priorityCounts, overdueTasks, myTasks, recentTasks, completionRate: totalTasks > 0 ? Math.round((statusCounts.done / totalTasks) * 100) : 0 } });
  } catch (error) { next(error); }
};

module.exports = { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask, getDashboardStats, taskValidation };
