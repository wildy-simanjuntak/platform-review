import slug from 'slug';
import Projects from './model.js';
import Modules from '../module/model.js';
import Content from '../content/model.js';

import { mkdir, rmdir, rename, unlink } from 'node:fs/promises';
import { copy, emptyDir } from 'fs-extra'
import { join } from 'node:path';
import fileDirName from '../utils/file-dir-name.js';

// const { __dirname } = fileDirName(import.meta);
const publicFolder = process.env.UPLOAD_PATH;

export const getAll = async (req, res) => {
    try {
        const projects = await Projects.find({}).populate({
            path: 'module',
            populate: {
                path: 'content'
            }
        });
        res.status(200).send(projects);
    } catch (error) {
        res.status(500).send(error);
    }
}


export const create = async (req, res) => {
    try {
        const {
            name,
        } = req.body

        const newProjects = new Projects({
            name, slug: slug(name)
        })

        const projects = await newProjects.save()

        await mkdir(join(publicFolder, 'digital-content', projects.slug), { recursive: true });
        await projects.populate('module');
        res.status(200).send(projects);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).send({ message: 'Duplicated data, please review your input!' });
        } else {
            res.status(500).send(error);
        }
    }
}

export const update = async (req, res) => {
    try {
        const { name } = req.body;

        const projects = await Projects.findById(req.params.id);

        await mkdir(join(publicFolder, 'digital-content', slug(name)));
        await copy(join(publicFolder, 'digital-content', projects.slug), join(publicFolder, 'digital-content', slug(name)));
        await emptyDir(join(publicFolder, 'digital-content', projects.slug));
        await rmdir(join(publicFolder, 'digital-content', projects.slug))

        Object.assign(projects, { name, slug: slug(name) });

        const item = await projects.save();
        await item.populate('module')
        res.status(200).send(item);
    } catch (error) {
        res.status(500).send(error)
    }
}

export const remove = async (req, res) => {
    try {
        const deletedData = {
            projects: [],
            modules: [],
            content: []
        };

        for (const v of req.body) {
            const project = await Projects.findById(v._id);
            if (!project) continue;

            const modules = await Modules.find({ _id: { $in: project.module } });
            const moduleIds = modules.map(m => m._id);

            const contentIds = modules.flatMap(m => m.content);

            try {
                await rmdir(join(publicFolder, 'digital-content', project.slug), { recursive: true });
            } catch (err) {
                console.log("Folder sudah tidak ada atau gagal dihapus");
            }

            if (contentIds.length > 0) {
                await Content.deleteMany({ _id: { $in: contentIds } });
            }
            if (moduleIds.length > 0) {
                await Modules.deleteMany({ _id: { $in: moduleIds } });
            }
            await Projects.findByIdAndDelete(v._id);

            deletedData.projects.push(v._id);
            deletedData.modules.push(...moduleIds);
            deletedData.content.push(...contentIds);
        }

        res.status(200).send({
            message: "Project and all related data deleted successfully",
            deleted: deletedData
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error during deletion", error });
    }
};