import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    moduleId: { 
      type: String, 
      ref: "Modules", 
      required: true 
    },
    text: { type: String, required: true },
    image: {
      type: String, 
      required: false,
    },
    user: { type: String, ref: "Users" },
  },
  { timestamps: true },
);

export default model("Comment", commentSchema);