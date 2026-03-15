"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function registerUser(formData) {
  try {
    // 1. Extract data from the FormData object
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    // 2. Validate input
    if (!name || !email || !password) {
      return { error: "Please fill in all fields." };
    }

    if (password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    // 3. Connect to the MongoDB database
    await dbConnect();

    // 4. Check if the user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // 5. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Create and save the new user
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user", // Default role
    });

    // 7. Return success
    return { success: true };

  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Something went wrong during registration. Please try again." };
  }
}