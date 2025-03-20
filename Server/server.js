const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcryptjs");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors")
app.use(cors({ 
  origin: ["http://127.0.0.1:5500", "https://ev-recharge-bunk.vercel.app"] 
}));

app.use(express.json());

mongoose
  .connect("mongodb+srv://deepcoders0:ewGQpK7TFo40ITVN@deepviber03.vlc9q.mongodb.net/EV_RECHARGE")////newdb
  .then(() => {
    console.log("CONNECTED SUCCESSFULLY");
  })
  .catch((err) => {
    console.log(err);
  });

const schema = new mongoose.Schema({
  Username: { type: String, unique: true, required: true },
  Password: { type: String, required: function () { return this.isAdmin !== true } },
  isAdmin: { type: Boolean, default: false },
  Mail:{ type: String, unique: true, required: true ,match: /^\S+@\S+\.\S+$/},
  Phone:{ type: Number, unique: true, required: true ,match: /^[0-9]{10}$/ },
  Name:{ type: String, unique: true, required: true }
});

const UserRegisters = mongoose.model("UserRegisters", schema, "UserRegisters");

app.post("/userreg", async (req, res) => {
  try {
    const { Username, Password, Mail, Phone, Name } = req.body;

    // Basic validation for required fields
    if (!Username || !Password || !Mail || !Phone || !Name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if username, email, or phone already exists
    const existingUser = await UserRegisters.findOne({
      $or: [{ Username }, { Mail }, { Phone }],
    });

    if (existingUser) {
      let conflictMessage = "This account already exists";
      if (existingUser.Username === Username) conflictMessage = "Username already taken";
      if (existingUser.Mail === Mail) conflictMessage = "Email already registered";
      if (existingUser.Phone === Phone) conflictMessage = "Phone number already registered";

      return res.status(400).json({ message: conflictMessage });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Save the new user
    const newUser = new UserRegisters({
      Username,
      Password: hashedPassword,
      Mail,
      Phone,
      Name,
    });

    const savedUser = await newUser.save();
    console.log("✅ DATA INSERTION SUCCESSFUL!!");
    res.status(201).json({
      message: "User created successfully",
      username: savedUser.Username,
    });

  } catch (error) {
    console.error("❌ DATA INSERTION FAILED!!", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


app.post('/userlogin', async (req, res) => {
  try {

    const { Username, Password } = req.body;
    if (!Username || !Password) {
      return res.status(400).json({ message: "Username and Password are required" });
    }

    // Find user
    const user = await UserRegisters.findOne({ Username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password"});
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(201).json({ message: "Login successful", username: user.Username });

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error", error: err.message });

  }
})
const AdminRegisters = mongoose.model("AdminRegisters", schema, "AdminRegisters");


app.post('/adminlogin', async (req, res) => {
  try {

    const { Username, Password } = req.body;
    if (!Username || !Password) {
      return res.status(400).json({ message: "Username and Password are required" });
    }

    // Find user
    const admin = await AdminRegisters.findOne({ Username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid Username" });
    }

    // Compare passwords

    // Compare passwords
/*
    const bcrypt = require('bcrypt');
const isPasswordMatch = await bcrypt.compare(Password, admin.Password);
*/
    res.status(201).json({ message: "Admin Logged successfully", username:admin.Username});

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error", error: err.message });

  }
})
   

app.post("/adminreg", async (req, res) => {
  try {
    const { Username, Password,Mail,Phone,Name } = req.body;

    if (!Username || !Password || !Mail || !Phone || !Name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if username, email, or phone already exists
    const existingUser = await UserRegisters.findOne({
      $or: [{ Username }, { Mail }, { Phone }],
    });

    if (existingUser) {
      let conflictMessage = "This account already exists";
      if (existingUser.Username === Username) conflictMessage = "Username already taken";
      if (existingUser.Mail === Mail) conflictMessage = "Email already registered";
      if (existingUser.Phone === Phone) conflictMessage = "Phone number already registered";

      return res.status(400).json({ message: conflictMessage });
    }
    if (Password !== "TESTING") {
      return res.status(403).json({ message: "Check Your Password Admin!!" });
    }
    // Check if the username already exists



    // Save new user
    const newUser = new AdminRegisters({
      Username,
      isAdmin: true,
      Mail,
      Phone,
      Name
    });

    const admin=await newUser.save();
    console.log("DATA INSERTION SUCCESSFULLY!!");
    res.status(201).json({ message: "Admin created successfully", username:admin.Username});
  } catch (e) {
    console.log("DATA INSERTION FAILED!!", e);
    res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
});







//ADMIN 

app.use(express.urlencoded({ extended: true }));

const stationSchema = new mongoose.Schema({
  name: String,
  tel:{ type: String, unique: true, required: true ,match: /^[0-9]{10}$/ },
  location: String,
  MapURL: { type: String, default: "" }, 
  slots: Number,
  status: String,
  update: String
});

app.use(express.static(path.join(__dirname, "../Client")));

const StationCreation = mongoose.model("StationCreation", stationSchema, "StationCreation");
/*
app.get("/admin", (req, res) => {
  console.log("✅ Admin page loading");
  res.sendFile(path.join(__dirname, "..", "..", "Client", "Admin", "manage.html"));
});
*/

// POST Route for Station Creation (No GET needed for form!)
app.post("/admin/create-station", async (req, res) => {
  const { name,tel, location,MapURL="", slots, status, update } = req.body;

  try {
    const existingStation = await StationCreation.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      location: { $regex: new RegExp(`^${location}$`, "i") }
    });

    if (existingStation) {
      return res.status(400).send("Station already exists!");
    }

    const newStation = new StationCreation({
      name,
      tel,
      location,
      MapURL,
      slots,
      status,
      update
    });

    await newStation.save();
    res.send(
      `<script>
         alert("Station Created Successfully!");
         window.location.href = "/Admin/station.html";
       </script>`
    );  } catch (err) {
    console.error(err);
    return res.status(500).send("<h2 style='color:red;'>Station Already Exists!</h2>");
  }
});



//list

app.get("/stations", async (req, res) => {
  try {
    const stations = await StationCreation.find({});
    res.json(stations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stations." });
  }
});


//update but in slots -admin

app.patch("/admin/update-station/:id", async (req, res) => {
  const { id } = req.params;
  const { slots, status, update } = req.body;

  try {
    const updatedStation = await StationCreation.findByIdAndUpdate(
      id,
      { slots, status, update },
      { new: true }
    );

    if (!updatedStation) return res.status(404).send({ message: "Station not found" });

    res.json(updatedStation);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to update station" });
  }
});


//user retrieve stations

app.get("/user/rtvstations", async (req, res) => {
  try {
    const data = await StationCreation.find({});
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: "Failed To Get Station List!!" });
  }
})

//http://localhost:3000/user/profiledata
app.get("/user/profiledata/:Username", async (req, res) => {
  try {
    const { Username } = req.params; // Extracts Username from the URL
    const data = await UserRegisters.findOne({ Username }); // findOne instead of find (returns a single user)
    
    if (!data) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(data);
  } catch (e) {
    console.error("Failed to get user profile data:", e);
    res.status(500).json({ message: "Failed to get user profile data!", error: e.message });
  }
});
app.get("/admin/profiledata/:Username", async (req, res) => {
  try {
    const { Username } = req.params; // Extracts Username from the URL
    const data = await AdminRegisters.findOne({ Username }); // findOne instead of find (returns a single user)
    
    if (!data) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(data);
  } catch (e) {
    console.error("Failed to get Admin profile data:", e);
    res.status(500).json({ message: "Failed to get Admin profile data!", error: e.message });
  }
});


//user details

/*
app.get("/user/userdetails", async (req, res) => {
  try {
    
    const user = req.user;  // Assuming you store user info in req.user (e.g., JWT or session)
    if (user) {
        res.json({
            _id: user._id,
            Username: user.Username,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(401).json({ message: "No user logged in" });
    }
  } catch (e) {
    res.status(400).json({ message: "Failed To Get User Details!!" });
  }
})
*/



app.listen(port, () => {
  console.log(`SERVER RUNNING ON ${port}`);
});
