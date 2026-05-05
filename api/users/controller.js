import User from "./model.js";

import util from 'node:util';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { mkdir, rmdir, rename, stat, rm } from "node:fs/promises";
import { join } from "node:path";
import fileDirName from "../utils/file-dir-name.js";
import getFileExtension from '../utils/get-file-extension.js';

import slug from "slug";
import jimp from 'jimp';

const { __dirname } = fileDirName(import.meta);
const publicFolder = `${__dirname}/../../web/public/`;

const pump = util.promisify(pipeline);

export const getAll = async (req, res) => {
  try {
    const users = await User.find({}, "-password").populate("role");

    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).send({ message: "Tidak ada data user, silakan login." });
    }

    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).send({ message: "User tidak ditemukan" });
    }

    await user.populate("role");
    res.status(200).send({ user: user.profile });
  } catch (err) {
    console.error("Error di getMe:", err);
    res.status(500).send({ message: "Internal server error", error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const newUser = new User(req.body);

    const user = await newUser.save();
    await user.populate("role");
    res.status(200).send(user.profile);
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
         res.status(400).send({ message: 'This email is already registered, please input another email' });
    } else {
      res.status(500).send(error);
    }
  }
};

export const update = async (req, res) => {
  try {
    const { username, email, role, password, bio } = req.body; 

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    Object.assign(user, { username, email, role, bio });

    if (password && password.trim() !== "") {
      user.password = password;
    }

    const item = await user.save();
    
    await item.populate({
      path: "role",
    });

    res.status(200).send(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateBio = async (req, res) => {
  try {
    console.log(req.body);
    const { bio } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Hanya update bio
    user.bio = bio;

    const item = await user.save();
    await item.populate("role");

    res.status(200).send(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    await Promise.all(
      req.body.map(async (v) => {
        await User.findOneAndDelete({ _id: v._id });
      })
    );
    res.status(200).send(req.body);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const profile = async (req, res) => {
  try {
    const parts = req.parts();
    let updatedUser = null;

    for await (const part of parts) {
      if (part.type === "file" && part.file) {
        const user = await User.findById(req.params.id);
        if (!user) continue;

        const ext = getFileExtension(part.filename).toLowerCase();
        const folder = join(publicFolder, 'image', 'users');
        await mkdir(folder, { recursive: true });

        const fileNameTmp = `${slug(user.username)}-tmp-${Date.now()}.png`;
        const fileName = `${slug(user.username)}.png`;
        const tmpPath = join(folder, fileNameTmp);
        const finalPath = join(folder, fileName);

        if (["png", "jpg", "jpeg"].includes(ext)) {
          await pump(part.file, fs.createWriteStream(tmpPath));

          const image = await jimp.read(tmpPath);
          await image
            .cover(480, 480)
            .quality(80) 
            .writeAsync(finalPath);

          user.image = true; 
          user.updatedAt = new Date();
          user.markModified('updatedAt');
          await user.save();
          
          updatedUser = user;

          if (fs.existsSync(tmpPath)) {
            await rm(tmpPath);
          }
        } 
        else {
          part.file.resume();
        }
      }
    }

    if (!updatedUser) {
      return res.status(400).send("No valid image uploaded");
    }

    res.status(200).send(updatedUser);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { newPassword, oldPassword } = req.body;
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const isMatch = await user.verifyPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).send({ message: 'Old password is incorrect' });
    }

    if(oldPassword == newPassword) {
      return res.status(400).send({ message: "New password cannot be the same as the old password." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).send(user);
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
