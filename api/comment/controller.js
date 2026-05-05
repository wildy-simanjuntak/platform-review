import Comment from "./model.js"
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const publicFolder = process.env.UPLOAD_PATH;
const chatFolder = path.join(publicFolder, 'chat');

export const getByModule = async (request, reply) => {
  try {
    const { id } = request.params;

    if (!id) {
      return reply.status(400).send({ message: "Module ID is required" });
    }

    const comments = await Comment.find({ moduleId: id }) 
      .populate("user", "username") 
      .sort({ createdAt: 1 })
      .lean();

    return reply.status(200).send(comments);
    
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

export const setComment = async (req, res) => {
  try {
    const parts = req.parts();
    let body = {};
    let filename = null;

    for await (const part of parts) {
      if (part.file) {
        if (!fs.existsSync(chatFolder)) {
          fs.mkdirSync(chatFolder, { recursive: true });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(part.filename);
        filename = `${uniqueSuffix}${ext}`;
        
        const fullPath = path.join(chatFolder, filename);
        await pipeline(part.file, fs.createWriteStream(fullPath));
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const newComment = new Comment({
      moduleId: body.moduleId,
      text: body.text,
      image: filename ? `/chat/${filename}` : null,
      user: body.userId
    });

    const saved = await newComment.save();
    const populated = await saved.populate("user", "username");

    res.status(200).send(populated);

  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
};