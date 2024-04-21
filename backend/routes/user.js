const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");
const jwt = require("jsonwebtoken");

const userRouter = express.Router();

const signupbody = zod.object({
  userName: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

userRouter.post("/signup", async (req, res) => {
  const { success } = signupbody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Email already taken / Wrong input",
    });
  }

  const existingUser = await User.findOne({
    userName: req.body.userName,
  });
  if (existingUser) {
    return res.status(411).json({
      message: "User is already present",
    });
  }

  const user = await User.create({
    userName: req.body.userName,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: req.body.password,
  });

  const userId = user._id;

  // Create new Account

  await Account.create({
    userId,
    balance: 1 + Math.random() * 10000,
  });

  const token = jwt.sign({ userId: userId }, JWT_SECRET);
  res.json({
    message: "User Created Successfully",
    token: token,
  });
});

userRouter.post("/signin", async (req, res) => {
  const user = await User.findOne({
    userName: req.body.userName,
    password: req.body.password,
  });

  console.log(user);

  if (user) {
    const userId = user._id;
    const token = jwt.sign({ userId: userId }, JWT_SECRET);
    res.json({
      token: token,
    });
  } else {
    return res.status(411).json({
      message: "Error while logging in",
    });
  }
});

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

userRouter.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating the information",
    });
  }

  await User.updateOne(req.body, {
    id: req.userId,
  });

  res.json({
    message: "Updated Successfully",
  });
});

userRouter.get("/bulk", authMiddleware, async (req, res) => {
  const filter = req.params.filter || "";
  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = userRouter;
