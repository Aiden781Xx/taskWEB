const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

const userSelect = 'name email avatar role createdAt updatedAt';

const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };
    }
    const users = await User.find(filter).select(userSelect).sort({ name: 1 });
    res.status(200).json({ success: true, count: users.length, data: { users } });
  } catch (error) { next(error); }
};

const getUser = async (req, res, next) => {
  try {
    const isSelf = req.params.id === req.user._id.toString();
    if (!isSelf && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can view another user profile.' });
    }
    const user = await User.findById(req.params.id).select(userSelect);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

const buildUserActivity = async (userId) => {
  const [assignedCounts, createdCounts, ownedProjects, memberProjects, recentAssignedTasks, recentCreatedTasks] = await Promise.all([
    Task.aggregate([{ $match: { assignee: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { createdBy: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Project.countDocuments({ owner: userId }),
    Project.countDocuments({ 'members.user': userId }),
    Task.find({ assignee: userId }).populate('project', 'name color').sort({ updatedAt: -1 }).limit(8),
    Task.find({ createdBy: userId }).populate('project', 'name color').populate('assignee', 'name email avatar').sort({ createdAt: -1 }).limit(8),
  ]);

  const toStatusCounts = (rows) => {
    const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
    rows.forEach((row) => {
      counts[row._id] = row.count;
      counts.total += row.count;
    });
    return counts;
  };

  return {
    assigned: toStatusCounts(assignedCounts),
    created: toStatusCounts(createdCounts),
    ownedProjects,
    memberProjects,
    recentAssignedTasks,
    recentCreatedTasks,
  };
};

const getUserActivity = async (req, res, next) => {
  try {
    const isSelf = req.params.id === req.user._id.toString();
    if (!isSelf && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can view another user activity.' });
    }
    const user = await User.findById(req.params.id).select(userSelect);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const activity = await buildUserActivity(user._id);
    res.status(200).json({ success: true, data: { user, activity } });
  } catch (error) { next(error); }
};

const getOverallActivity = async (req, res, next) => {
  try {
    const [totalUsers, totalProjects, totalTasks, recentUsers, recentTasks, statusStats, roleStats] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments(),
      User.find().select(userSelect).sort({ createdAt: -1 }).limit(6),
      Task.find().populate('project', 'name color').populate('assignee', 'name email avatar').populate('createdBy', 'name email avatar').sort({ updatedAt: -1 }).limit(10),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const statusCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    statusStats.forEach((row) => { statusCounts[row._id] = row.count; });
    const roleCounts = { admin: 0, member: 0 };
    roleStats.forEach((row) => { roleCounts[row._id] = row.count; });

    res.status(200).json({
      success: true,
      data: { totalUsers, totalProjects, totalTasks, statusCounts, roleCounts, recentUsers, recentTasks },
    });
  } catch (error) { next(error); }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.user._id.toString();
    const isSelf = targetId === req.user._id.toString();
    if (!isSelf && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update another user profile.' });
    }

    const { name, email, avatar, role } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();
    if (avatar !== undefined) updates.avatar = String(avatar).trim();

    if (role !== undefined) {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can change roles.' });
      if (!['admin', 'member'].includes(role)) return res.status(400).json({ success: false, message: 'Role must be admin or member.' });
      if (isSelf && role !== req.user.role) return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
      updates.role = role;
    }

    if (updates.name !== undefined && (updates.name.length < 2 || updates.name.length > 50)) {
      return res.status(400).json({ success: false, message: 'Name must be 2-50 characters.' });
    }
    if (updates.email !== undefined && !/^\S+@\S+\.\S+$/.test(updates.email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email.' });
    }
    if (updates.email) {
      const existing = await User.findOne({ email: updates.email, _id: { $ne: targetId } });
      if (existing) return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.findByIdAndUpdate(targetId, updates, { new: true, runValidators: true }).select(userSelect);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User profile updated.', data: { user } });
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or member.' });
    }
    // Prevent self-demotion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(userSelect);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: `User role updated to ${role}.`, data: { user } });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account from admin.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) return res.status(400).json({ success: false, message: 'At least one admin must remain.' });
    }

    await Project.updateMany(
      { owner: user._id },
      { $set: { owner: req.user._id }, $addToSet: { members: { user: req.user._id, role: 'admin' } } }
    );
    await Project.updateMany({}, { $pull: { members: { user: user._id } } });
    await Task.updateMany({ assignee: user._id }, { assignee: null });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, message: 'User deleted and related assignments cleaned up.' });
  } catch (error) { next(error); }
};

module.exports = { getUsers, getUser, getUserActivity, getOverallActivity, updateUserProfile, updateUserRole, deleteUser };
