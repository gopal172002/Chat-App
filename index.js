const mongoose = require("mongoose");
const { Msg } = require("./models/chatModel");
const cron = require("node-cron");
const CryptoJS = require("crypto-js");
const bcrypt = require("bcryptjs");

mongoose.connect("mongodb+srv://gopalkalsiya1h:Gopal172002@cluster0.ggzm5fi.mongodb.net/chatapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const io = require("socket.io")(8000, {
    cors: {
        origin: "*",
    },
});

const users = {};

//cronjob scheduling...
cron.schedule("0 0 * * *", async () => {
  try {
    // Delete all chats by removing all documents from the Msg collection
    await Msg.deleteMany({});
    console.log("All chats deleted at midnight.");
  } catch (error) {
    console.error("Error deleting chats:", error);
  }
});


io.on("connection", (socket) => {
    socket.on("new-user-joined", async(name) => {
        console.log("New user: ", name);
        users[socket.id] = name;
        socket.broadcast.emit("user-joined", name);
    });

    socket.on("send", async (message) => {
      try {
        
        const secretKey = "your-secret-key"; 
        const encryptedMessage = CryptoJS.AES.encrypt(message, secretKey).toString();
    
        // Hash the encrypted message before saving it
        const hashedMessage = await bcrypt.hash(encryptedMessage, 10);
    
        
        const newMessage = new Msg({
          message: hashedMessage, // hashed message
          name: users[socket.id], 
          room: "2", 
          select: "2", // selct
        });
    
        // Save the message to MongoDB
        await newMessage.save();
    
        
        socket.broadcast.emit("receive", {
          message: message, 
          name: users[socket.id],
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });
    
    socket.on("disconnect", (message) => {
        socket.broadcast.emit("left", users[socket.id]);
        delete users[socket.id];
    });
});