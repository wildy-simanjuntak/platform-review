import slug from "slug";
import { join } from "node:path";
import Logs from "./logs/model.js";
import Project from "./project/model.js";
import Module from "./module/model.js";
import Content from "./content/model.js";
import Users from "./users/model.js";
import Comment from "./comment/model.js";

export const setupSocket = (io, publicFolder) => {
  io.on("connect", (socket) => {
    console.info("Socket connected!", socket.id);

    socket.on("logs-project:list", async (callback) => {
      const logs = await Logs.find();
      callback({ data: logs });
    });

    socket.on("logs-project:list", async (callback) => {
      const logs = await Logs.find();
      callback({ data: logs });
    });

    socket.on("logs-project:create", async (data, sender) => {
      const slugName = slug(data.name);
      const path = join(publicFolder, "digital-content", slugName);

      const newLogs = new Logs({
        level: "create",
        message: `${sender.username} already create ${data.name}`,
        source: `${path}`,
        metadata: [{ user: sender._id }],
      });

      const saved = await newLogs.save();
      socket.broadcast.emit("logs-project:create", saved);
      socket.emit("logs-project:create", saved);
    });

    socket.on("logs-module:create", async (data) => {
      const project = await Project.findById(data.project);
      const sender = await Users.findById(data.signBy);
      const receipt = await Users.findById(data.signTo);

      const slugName = slug(data.name);
      const path = join(
        publicFolder,
        "digital-content",
        project.slug,
        slugName,
      );

      const newLogs = new Logs({
        level: "create",
        message: `${sender.username} already create ${data.name} in ${project.name} and sign to  ${receipt.username}`,
        source: `${path}`,
        metadata: [{ user: sender }],
      });

      const saved = await newLogs.save();
      socket.broadcast.emit("logs-module:create", saved);
      socket.emit("logs-module:create", saved);
    });

    socket.on("logs-content:create", async (data, sender) => {
      const project = await Project.findById(data.project);
      const module = await Module.findById(data.module);
      const contentSlug = slug(data.name);

      const path = join(
        publicFolder,
        "digital-content",
        project.slug,
        module.slug,
        contentSlug,
      );
      const newLogs = new Logs({
        level: "create",
        message: `${sender.username} already create content ${data.name} in ${module.name} `,
        source: `${path}`,
        metadata: [{ user: sender }],
      });
      const saved = await newLogs.save();
      socket.broadcast.emit("logs-content:create", saved);
      socket.emit("logs-content:create", saved);
    });

    socket.on("logs-project:update", async (data, sender) => {
      const project = await Project.findById(data._id);
      const name = project.name;

      const slugName = slug(data.name);
      const path = join(publicFolder, "digital-content", slugName);

      const newLogs = new Logs({
        level: "update",
        message: `${sender.username} already update project from ${name} to ${data.name}`,
        source: `${path}`,
        metadata: [{ user: sender }],
      });

      const saved = await newLogs.save();
      socket.broadcast.emit("logs-project:update", saved);
      socket.emit("logs-project:update", saved);
    });

    socket.on("logs-module:update", async (data) => {
      try {
        const module = await Module.findById(data._id);
        if (!module) return console.warn("Module tidak ditemukan");

        const project = await Project.findById(module.project);
        const sender = await Users.findById(data.signBy);

        const senderName = sender ? sender.username : "Unknown";

        const slugName = slug(data.name);
        const path = join(
          publicFolder,
          "digital-content",
          project?.slug || "unknown",
          slugName,
        );

        const newLogs = new Logs({
          level: "update",
          message: `${senderName} updated module from ${module.name} to ${data.name} in ${project?.name || "Project"}`,
          source: path,
          metadata: [{ user: sender }],
        });

        const saved = await newLogs.save();

        io.emit("logs-module:update", saved);
      } catch (err) {
        console.error("Error logs-module:update:", err);
      }
    });

    socket.on("logs-content:update", async (data, sender) => {
      try {
        const module = await Module.findById(data.module);
        const project = await Project.findById(module?.project);
        const content = await Content.findById(data._id);

        if (!content) return;

        const contentSlug = slug(data.name);
        const path = join(
          publicFolder,
          "digital-content",
          project?.slug || "x",
          module?.slug || "x",
          "pages/content",
          contentSlug,
        );

        const newLogs = new Logs({
          level: "update",
          message: `${sender.username} updated content from ${content.name} to ${data.name} in ${module?.name || "Module"}`,
          source: path,
          metadata: [{ user: sender }],
        });

        const saved = await newLogs.save();
        io.emit("logs-content:update", saved);
      } catch (err) {
        console.error("Error logs-content:update:", err);
      }
    });

    socket.on("logs-project:delete", async (data, sender) => {
      console.log(
        "Menerima logs-project:delete dengan data:",
        data,
        "dari sender:",
        sender,
      );
      await Promise.all(
        data.map(async (v) => {
          const path = join(publicFolder, "digital-content", v.slug);

          const newLogs = new Logs({
            level: "delete",
            message: `${sender.username} already delete project ${v.name}`,
            source: `${path}`,
            metadata: [{ user: sender }],
          });

          const saved = await newLogs.save();
          socket.broadcast.emit("logs-project:delete", saved);
          socket.emit("logs-project:delete", saved);
        }),
      );
    });

    socket.on("logs-module:delete", async (data, sender) => {
      try {
        await Promise.all(
          data.map(async (v) => {
            const project = await Project.findOne({ name: v.project });

            if (!project) {
              console.error(
                `Project dengan nama ${v.project} tidak ditemukan untuk module ${v.name}`,
              );
              return;
            }

            const path = join(
              publicFolder,
              "digital-content",
              project.slug || "unknown",
              v.slug || "unknown",
            );

            const newLogs = new Logs({
              level: "delete",
              message: `${sender.username} already deleted module ${v.name} in ${project.name}`,
              source: path,
              metadata: [{ user: sender }],
            });

            const saved = await newLogs.save();
            socket.broadcast.emit("logs-module:delete", saved);
            socket.emit("logs-module:delete", saved);
          }),
        );
      } catch (error) {
        console.error("Error pada logs-module:delete:", error);
      }
    });

    socket.on("logs-content:delete", async (data, sender) => {
      try {
        await Promise.all(
          data.map(async (v) => {
            console.log("Processing delete log for content:", v);
            if (!v) return;

            const module = await Module.findOne({ name: v.module });
            console.log("Found module:", module);
            const project = await Project.findById(module.project);

            const path = join(
              publicFolder,
              "digital-content",
              project.slug,
              module.slug,
              "pages/content",
              v.slug,
            );

            const newLogs = new Logs({
              level: "delete",
              message: `${sender.username} menghapus konten ${v.name}`,
              source: path,
              metadata: [{ user: sender }],
            });

            const saved = await newLogs.save();
            socket.broadcast.emit("logs-content:delete", saved);
            socket.emit("logs-content:delete", saved);
          }),
        );
      } catch (err) {
        console.error("Error Socket Delete:", err);
      }
    });

    socket.on("comment:new", (savedComment) => {
      console.log(savedComment);
      if (savedComment && savedComment.moduleId) {
        io.emit(`comment:receive:${savedComment.moduleId}`, savedComment);
      }
    });
  });
};
