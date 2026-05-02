const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask, getDashboardStats, taskValidation } = require('../controllers/task.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/dashboard/stats', getDashboardStats);
router.route('/').get(getTasks).post(taskValidation, validate, createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
