import slug from "slug";
import Content from "./model.js";
import Modules from "../module/model.js";
import Project from "../project/model.js";

import util from "node:util";
import fs from "node:fs";
import { pipeline } from "node:stream";
import { mkdir, rmdir, rename, stat, unlink } from "node:fs/promises";
import { copy, emptyDir } from "fs-extra";
import { join } from "node:path";
// import fileDirName from "../utils/file-dir-name.js";
// import getFileExtension from "../utils/get-file-extension.js";
import unZip from "adm-zip";

const publicFolder = process.env.UPLOAD_PATH;

const pump = util.promisify(pipeline);

const getUpdatedModule = async (moduleId) => {
  return await Modules.findById(moduleId).populate(["project", "content"]);
};

export const getAll = async (req, res) => {
  try {
    const content = await Content.find({}).populate({
      path: "module",
      populate: { path: "project" },
    });
    res.status(200).send(content);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const create = async (req, res) => {
  try {
    const { name, module, status } = req.body;
    const newContent = new Content({
      name,
      slug: slug(name),
      module,
      status,
    });

    const item = await newContent.save();
    await item.populate({
      path: "module",
      populate: { path: "project" },
    });
    const moduleData = await getUpdatedModule(module);

    res.status(200).send({
      data: item,
      module: moduleData,
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      res
        .status(400)
        .send({ message: "Duplicated data, please review your input!" });
    } else {
      res.status(500).send(error);
    }
  }
};

export const upload = async (req, res) => {
  try {
    const parts = req.parts();
    
    for await (const part of parts) {
      // Kita memproses semuanya di dalam blok ini karena 
      // part.fields sudah tersedia di sini
      if (part.type === "file" && part.fieldname === "file") {
        
        // 1. Ambil data dari fields yang sudah tersedia di dalam part ini
        const moduleId = part.fields.moduleId.value;
        const type = part.fields.type.value;

        // 2. Ambil data Modul
        const mod = await Modules.findById(moduleId).populate("project");
        if (!mod) return res.status(404).send({ message: "Modul tidak ditemukan" });

        // 3. Cari atau buat Content
        let item = await Content.findOne({ module: moduleId, name: type });
        if (!item) {
          item = await Content.create({
            name: type,
            module: moduleId,
            slug: type.toLowerCase().replace(/\s+/g, '-')
          });
        }

        // 4. Proses Path & Unzip
        const tempZipPath = join(publicFolder, "temp", `${item.slug}-${Date.now()}.zip`);
        const targetFolder = join(
          publicFolder, "digital-content", mod.project.slug, mod.slug, "pages/content", item.slug
        );

        await mkdir(join(publicFolder, "temp"), { recursive: true });
        await mkdir(targetFolder, { recursive: true });

        // Unzip file
        await pump(part.file, fs.createWriteStream(tempZipPath));
        const zip = new unZip(tempZipPath);
        zip.extractAllTo(targetFolder, true);
        await unlink(tempZipPath);

        // 5. Update Status & Sinkronisasi
        item.status = true;
        await item.save();

        if (!mod.content.includes(item._id)) {
          mod.content.push(item._id);
          await mod.save();
        }

        const moduleData = await getUpdatedModule(mod._id);

        return res.status(200).send({
          data: item,
          module: moduleData,
        });
      }
    }
  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).send({ message: "Gagal memproses file ZIP: " + err.message });
  }
};
// export const upload = async (req, res) => {
//   try {
//     const parts = req.parts();
//     for await (const part of parts) {
//       if (part.type === "file" && part.file) {
//         const {
//           _id,
//           slug: contentSlug,
//           module,
//         } = JSON.parse(part.fields.data.value);

//         const mod = await Modules.findById(module._id).populate("project");
//         const item = await Content.findById(_id);

//         const tempZipPath = join(publicFolder, "temp", `${item.slug}.zip`);
//         const targetFolder = join(
//           publicFolder,
//           "digital-content",
//           mod.project.slug,
//           mod.slug,
//           "pages/content",
//           contentSlug,
//         );

//         await mkdir(join(publicFolder, "temp"), { recursive: true });
//         await mkdir(targetFolder, { recursive: true });

//         await pump(part.file, fs.createWriteStream(tempZipPath));
//         const zip = new unZip(tempZipPath);
//         zip.extractAllTo(targetFolder, true);
//         await unlink(tempZipPath);

//         item.status = true;
//         item.compressedFile = null;
//         item.compressedFileSize = 0;
//         await item.save();

//         if (!mod.content.includes(_id)) {
//           mod.content.push(_id);
//           await mod.save();
//         }

//         const moduleData = await getUpdatedModule(mod._id);

//         res.status(200).send({
//           data: item,
//           module: moduleData,
//         });
//       }
//     }
//   } catch (err) {
//     res.status(500).send({ message: "Gagal memproses file ZIP" });
//   }
// };

export const update = async (req, res) => {
  try {
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "field" && part.value != undefined) {
        const { _id, name, module } = JSON.parse(part.fields.data.value);

        const item = await Content.findById(_id);
        const mod = await Modules.findById(item.module);
        const project = await Project.findById(mod.project);

        const oldPath = join(
          publicFolder,
          "digital-content",
          project.slug,
          mod.slug,
          "pages/content",
          item.slug,
        );
        const newPath = join(
          publicFolder,
          "digital-content",
          project.slug,
          mod.slug,
          "pages/content",
          slug(name),
        );

        if (item.slug !== slug(name)) {
          await mkdir(newPath, { recursive: true });
          await copy(oldPath, newPath);
          await emptyDir(oldPath);
          await rmdir(oldPath);
        }

        Object.assign(item, { name, slug: slug(name) });
        await item.populate({
          path: "module",
          populate: { path: "project" },
        });
        await item.save();

        const moduleData = await getUpdatedModule(mod._id);

        res.status(200).send({
          data: item,
          module: moduleData,
        });
      }
      // Note: Logic upload file di update bisa mengikuti pola yang sama jika diperlukan
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export const remove = async (req, res) => {
  try {
    let lastModuleId = null;

    await Promise.all(
      req.body.map(async (v) => {
        const item = await Content.findById(v._id);
        const mod = await Modules.findById(item.module);
        const project = await Project.findById(mod.project);

        lastModuleId = mod._id;

        await mod.content.pull(item._id);
        await mod.save();

        const folderPath = join(
          publicFolder,
          "digital-content",
          project.slug,
          mod.slug,
          "pages/content",
          item.slug,
        );
        await rmdir(folderPath, { recursive: true }).catch(() => {});

        await Content.findOneAndDelete({ _id: v._id });
      }),
    );

    const moduleData = await getUpdatedModule(lastModuleId);

    res.status(200).send({
      deletedIds: req.body.map((v) => v._id),
      module: moduleData,
    });
  } catch (error) {
    res.status(500).send(error);
  }
};
