const express = require("express");
const router = express.Router();
const { register, login, checkauth, sendEmail } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");


router.post("/register", register);
router.post('/login', login);
router.get('/check-auth',authenticateToken, checkauth);
router.post('/send-email', sendEmail);


module.exports = router;