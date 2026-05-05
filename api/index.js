import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifySocketIO from "fastify-socket.io";
import { setupSocket } from "./socket.js";

import { connect } from "mongoose";

import User from "./users/model.js";
import setup from "./auth/passport.js";

import auth from "./auth/index.js";
import users from "./users/index.js";
import roles from "./roles/index.js";
import project from "./project/index.js";
import module from "./module/index.js";
import content from "./content/index.js";
import comment from "./comment/index.js";
import logs from "./logs/index.js";

import fileDirName from "./utils/file-dir-name.js";
const { __dirname } = fileDirName(import.meta);
const publicFolder = `${__dirname}/../../web/public/`;

const fastify = Fastify({
  logger: true,
});

setup(User);

fastify.register(fastifyCors);
fastify.register(fastifyJwt, {
  secret: process.env.SESSION_KEY,
  sign: { expiresIn: "8h" },
});
fastify.register(fastifyMultipart, {
  limits: { fileSize: 1000000000 },
});
fastify.register(fastifySocketIO, {
  cors: {
   origin: process.env.SOCKET_CORS_ORIGIN,
   methods: ["GET", "POST"]
  },
});


fastify.addHook("onRequest", async (req, res) => {
  const isAuthRoute = req.url.includes("/api/auth");
  if (!isAuthRoute && req.headers.authorization) {
    try { await req.jwtVerify(); } 
    catch (err) { res.status(401).send({ error: "Unauthorized" }); }
  }
});

fastify.register(auth, { prefix: "/api/auth" });
fastify.register(users, { prefix: "/api/users" });
fastify.register(roles, { prefix: "/api/roles" });
fastify.register(project, { prefix: "/api/project" });
fastify.register(module, { prefix: "/api/module" });
fastify.register(content, { prefix: "/api/content" });
fastify.register(comment, { prefix: "/api/comment" });
fastify.register(logs, { prefix: "/api/logs" });

const connector = async () => {
  try {
    await connect(process.env.DB_URL, {
      serializeFunctions: true,
    });

    console.log("Connection has been established successfully.");
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};


fastify.ready((err) => {
  if (err) throw err;

  setupSocket(fastify.io, publicFolder);
});

const start = async () => {
  try {
    await connector();
    await fastify.listen({ port: process.env.PORT, host: process.env.HOST });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
