import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Tenant } from "../models/tenant.model";
import { z } from "zod";
import bcryptjs from "bcryptjs";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  tenantName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user already exists
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    // Create tenant
    const slug = body.tenantName.toLowerCase().replace(/\s+/g, "-");
    const tenant = await Tenant.create({
      name: body.tenantName,
      slug: `${slug}-${Date.now()}`,
    });

    // Create user
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
      tenantId: tenant._id,
      role: "owner",
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, tenantId: tenant._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: body.email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Check password
    const valid = await user.comparePassword(body.password);
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
