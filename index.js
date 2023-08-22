const mongoose = require("mongoose");
const msgSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  select: {
    type: String,
    required: true,
  },
});
const { MongoClient } = require('mongodb');
const Msg = require("../models/chatModel");

// Node Server which will handle socket connections.
const io = require("socket.io")(8000, {
    cors: {
        origin: "*",
    },
});
// const MONGO_URI = process.env.URI;
// const { name } = require('ejs');

const users = {};
// const client = new MongoClient(uri);

io.on("connection", (socket) => {
    socket.on("new-user-joined", async(name) => {
        console.log("New user: ", name);
        users[socket.id] = name;
        socket.broadcast.emit("user-joined", name);
    });

    socket.on("send", (message) => {

        
        socket.broadcast.emit("receive", {
            message: message,
            name: users[socket.id],
        });
    });

    socket.on("disconnect", (message) => {
        socket.broadcast.emit("left", users[socket.id]);
        delete users[socket.id];
    });
});