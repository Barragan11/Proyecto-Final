// back/controllers/userController.js
const User = require("../models/userModel");

async function getAllUsers(req, res, next) {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
};
