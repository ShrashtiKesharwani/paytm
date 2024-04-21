const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

const accountRouter = express.Router();

accountRouter.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({ userId: req.userId });
  res.json({
    balance: account.balance,
  });
});

accountRouter.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const to = req.body.to;
  const amount = req.body.amount;
  const account = await Account.findOne({ userId: req.userId }).session(
    session
  );
  if (!amount || account.balance < amount) {
    await session.abortTransaction;
    return res.status(400).json({
      message: "Insuffiecient balance",
    });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);
  if (!toAccount) {
    await session.abortTransaction;
    return res.status(400).json({
      message: "Invalid Account",
    });
  }

  //   Perform the transfer
  const result = await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);

  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);

  // Commit the transaction
  await session.commitTransaction();
  res.json({
    message: "Transfer Successfull",
  });
});

module.exports = accountRouter;
