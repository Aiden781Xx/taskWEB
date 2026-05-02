const express = require('express');
const router = express.Router();
const { getUsers, getUser, getUserActivity, getOverallActivity, updateUserProfile, updateUserRole, deleteUser } = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.use(authenticate);
router.get('/', getUsers);
router.get('/activity/overall', authorizeRoles('admin'), getOverallActivity);
router.patch('/me', updateUserProfile);
router.get('/:id/activity', getUserActivity);
router.get('/:id', getUser);
router.patch('/:id', authorizeRoles('admin'), updateUserProfile);
router.patch('/:id/role', authorizeRoles('admin'), updateUserRole);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

module.exports = router;
