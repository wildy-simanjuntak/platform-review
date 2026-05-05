import { Schema, model } from 'mongoose';
import { nanoid } from 'nanoid';

const schema = new Schema({
    _id: { type: String, default: () => nanoid(12) },
    name: { type: String },
    slug: { type: String },
    module: { type: String, ref: 'Modules' },
    status: { type: Boolean, default: 'false'}
}, { timestamps: true });   

schema.index({ name: 1, module: 1 }, { unique: true });
schema.index({ slug: 1 });

export default model('Content', schema, 'content');