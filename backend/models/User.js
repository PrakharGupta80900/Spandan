const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Registration = require("./Registration");
const Event = require("./Event");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z\s]{2,}$/.test(v.trim());
        },
        message: "Name can only contain letters and spaces, and must be at least 2 characters long"
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
    pid: {
      type: String,
      unique: true,
      sparse: true,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{1,30}$/.test(v.trim());
        },
        message: "Roll number must contain only digits"
      }
    },
    college: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z\s&]{2,}$/.test(v.trim());
        },
        message: "College name can only contain letters, spaces, and & symbol, and must be at least 2 characters long"
      }
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Clean up registrations when user is deleted
userSchema.pre("deleteOne", { document: true, query: false }, async function() {
  try {
    const registrations = await Registration.find({ user: this._id }).populate("event");
    const eventCounts = {};
    
    // Each registration consumes exactly 1 slot in current event count semantics.
    registrations.forEach(reg => {
      if (reg.event) {
        const spotsUsed = 1;
        eventCounts[reg.event._id] = (eventCounts[reg.event._id] || 0) + spotsUsed;
      }
    });
    
    await Registration.deleteMany({ user: this._id });
    
    // Update event counts
    await Promise.all(
      Object.entries(eventCounts).map(([eventId, count]) =>
        Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -count } })
      )
    );
  } catch (err) {
    console.error("Error cleaning up registrations:", err);
  }
});

// Also handle deleteMany
userSchema.pre("deleteMany", { document: false, query: true }, async function() {
  try {
    const users = await this.model.find(this.getFilter()).select("_id");
    const userIds = users.map(user => user._id);
    
    const registrations = await Registration.find({ user: { $in: userIds } }).populate("event");
    const eventCounts = {};
    
    // Each registration consumes exactly 1 slot in current event count semantics.
    registrations.forEach(reg => {
      if (reg.event) {
        const spotsUsed = 1;
        eventCounts[reg.event._id] = (eventCounts[reg.event._id] || 0) + spotsUsed;
      }
    });
    
    await Registration.deleteMany({ user: { $in: userIds } });
    
    // Update event counts
    await Promise.all(
      Object.entries(eventCounts).map(([eventId, count]) =>
        Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -count } })
      )
    );
  } catch (err) {
    console.error("Error cleaning up registrations:", err);
  }
});

module.exports = mongoose.model("User", userSchema);
