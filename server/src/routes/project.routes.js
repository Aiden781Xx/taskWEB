const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember, projectValidation } = require('../controllers/project.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.route('/').get(getProjects).post(projectValidation, validate, createProject);
router.route('/:id').get(getProject).put(projectValidation, validate, updateProject).delete(deleteProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
