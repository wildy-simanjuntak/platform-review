import slug from "slug";
import Modules from "./model.js";
import Project from "../project/model.js";
import Content from "../content/model.js";

import util from "node:util";
import fs from "node:fs";
import { pipeline } from "node:stream";
import { mkdir, unlink, rm } from "node:fs/promises";
import { copy } from "fs-extra";
import { join } from "node:path";
// import fileDirName from "../utils/file-dir-name.js";
import getFileExtension from "../utils/get-file-extension.js";
import unZip from "adm-zip";

// const { __dirname } = fileDirName(import.meta);
const publicFolder = process.env.UPLOAD_PATH;

const pump = util.promisify(pipeline);

export const getAll = async (req, res) => {
  try {
    const modules = await Modules.find({})
      .populate("project")
      .populate("content")
      .populate("signBy", "-password")
      .populate("signTo", "-password");

    res.status(200).send(modules);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const create = async (req, res) => {
  try {
    const parts = req.parts();
    let item;
    let prjt;

    for await (const part of parts) {
      if (part.type === "field" && part.value !== "undefined") {
        const { name, project, signTo, signBy } = JSON.parse(part.value);
        const newModules = new Modules({
          name,
          slug: slug(name),
          project,
          signBy,
          signTo,
        });
        item = await newModules.save();
        prjt = await Project.findById(project);
        prjt.module.push(item._id);
        await prjt.save();
      } else if (part.type === "file" && part.file) {
        const ext = getFileExtension(part.filename);
        if (ext === "zip") {
          const target = join(
            publicFolder,
            "digital-content",
            prjt.slug,
            item.slug,
          );
          const tempZip = join(publicFolder, "temp", `${item.slug}.zip`);

          await mkdir(join(publicFolder, "temp"), { recursive: true });
          await mkdir(target, { recursive: true });

          await pump(part.file, fs.createWriteStream(tempZip));
          new unZip(tempZip).extractAllTo(target, true);
          await unlink(tempZip);
        }
      }
    }

    const populatedItem = await Modules.findById(item._id)
      .populate("project")
      .populate("signBy")
      .populate("signTo");

    const updatedProject = await Project.findById(prjt._id).populate("module");

    res.status(200).send({
      message: "Module created successfully",
      data: populatedItem,
      project: updatedProject,
    });
  } catch (error) {
    if (error.code === 11000) {
      res
        .status(400)
        .send({ message: "Duplicated data, please review your input!" });
    } else {
      res.status(500).send(error);
    }
  }
};

export const update = async (req, res) => {
  try {
    const { name } = req.body;

    const moduleItem = await Modules.findById(req.params.id);
    if (!moduleItem) {
      return res.status(404).send({ message: "Module tidak ditemukan" });
    }
    const prjt = await Project.findById(moduleItem.project);
    if (!prjt) {
      return res.status(404).send({ message: "Project tidak ditemukan" });
    }

    const oldSlug = moduleItem.slug;
    const newSlug = slug(name);
    const oldPath = join(publicFolder, "digital-content", prjt.slug, oldSlug);
    const newPath = join(publicFolder, "digital-content", prjt.slug, newSlug);
    if (moduleItem.name !== name) {
      try {
        await mkdir(newPath, { recursive: true });
        await copy(oldPath, newPath);
        await rm(oldPath, { recursive: true, force: true });
      } catch (fsError) {
        console.error(
          "Folder tidak ditemukan atau gagal pindah:",
          fsError.message,
        );
      }
    }

    moduleItem.name = name;
    moduleItem.slug = newSlug;
    await moduleItem.save();

    await moduleItem.populate(["project", "signBy", "signTo"]);

    const updatedProject = await Project.findById(prjt._id).populate("module");

    res.status(200).send({
      data: moduleItem,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update Error Details:", error);
    res.status(500).send({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const results = [];

    for (const v of req.body) {
      const item = await Modules.findById(v._id);
      if (!item) continue;

      const project = await Project.findById(item.project);

      await Content.deleteMany({ module: item._id });

      if (project) {
        project.module.pull(item._id);
        await project.save();

        const folderPath = join(
          publicFolder,
          "digital-content",
          project.slug,
          item.slug,
        );
        await rm(folderPath, { recursive: true, force: true });

        results.push(project._id);
      }

      await Modules.findOneAndDelete({ _id: v._id });
    }

    const updatedProject =
      results.length > 0
        ? await Project.findById(results[0]).populate("module")
        : null;

    res.status(200).send({
      deletedIds: req.body.map((v) => v._id),
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
