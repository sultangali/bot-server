import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    fullname: String,
    phone: String,
    address: String,
    todo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Todo",
          }],
    status: {
      type: String,
        enum: ['accepted', 'denied'],
        default: 'denied',
    },
    role: {
      type: String,
      enum: ['client', 'manager', 'admin'],
      default: 'client'
  },
    avatar: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", schema)
