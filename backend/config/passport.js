// Generate PID in format PID260001
async function generatePID() {
  const User = require("../models/User");
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `PID${year}`;
  const lastUser = await User.findOne(
    { pid: { $regex: `^${prefix}` } },
    { pid: 1 },
    { sort: { pid: -1 } }
  );
  let nextNum = 1;
  if (lastUser && lastUser.pid) {
    const lastNum = parseInt(lastUser.pid.slice(prefix.length), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

module.exports = { generatePID };
