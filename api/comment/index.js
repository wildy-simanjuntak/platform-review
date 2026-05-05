import { getByModule, setComment } from "./controller.js";

export default async (fastify, opts) => {
  fastify.get("/:id", getByModule);
  fastify.post("/", setComment)
};