const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); // adjust path if needed

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/tenantApp";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Hash password for all users
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Owner
    const owner = new User({
      name: "Owner One",
      email: "owner@example.com",
      password: hashedPassword,
      role: "owner",
    });

    // Create 5 Tenants
    const tenants = [];
    for (let i = 1; i <= 5; i++) {
      tenants.push(
        new User({
          name: `Tenant ${i}`,
          email: `tenant${i}@example.com`,
          password: hashedPassword,
          role: "tenant",
        })
      );
    }

    // Create 3 Workers
    const workers = [];
    for (let i = 1; i <= 3; i++) {
      workers.push(
        new User({
          name: `Worker ${i}`,
          email: `worker${i}@example.com`,
          password: hashedPassword,
          role: "worker",
        })
      );
    }

    // Save all users
    await owner.save();
    await Promise.all(tenants.map((t) => t.save()));
    await Promise.all(workers.map((w) => w.save()));

    console.log("Seed data created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
