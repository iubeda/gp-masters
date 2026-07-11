const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

const router = express.Router();

// All admin routes require authentication and admin role
// Re-validate role from database for security (prevent stale JWT roles)
router.use(authMiddleware);
router.use(checkRole(['admin'], true));

router.get('/users', adminController.getUsers);
router.put('/users/:email/role', adminController.updateUserRole);

// Dictionary routes
router.get('/dictionaries/:type', adminController.getDictionary);
router.post('/dictionaries/:type', adminController.addDictionaryRecord);

module.exports = router;
