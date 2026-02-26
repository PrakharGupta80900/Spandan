const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

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

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientId !== "your_google_client_id_here") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if email already exists (for linking)
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value || user.avatar;
          await user.save();
          return done(null, user);
        }

        // Create new user with generated PID
        const pid = await generatePID();
        const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
        const isAdmin = adminEmails.includes(profile.emails[0].value.toLowerCase());

        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value || "",
          pid,
          role: isAdmin ? "admin" : "user",
          isVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
  );
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-__v");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = { generatePID };
