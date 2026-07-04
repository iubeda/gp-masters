const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(checkRole(['admin']));

router.get('/users', adminController.getUsers);
router.put('/users/:email/role', adminController.updateUserRole);

module.exports = router;
