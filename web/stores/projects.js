import { defineStore } from "pinia";
import { createAlova } from "alova";
import GlobalFetch from "alova/GlobalFetch";
import { useModuleStore } from "../stores/module.js";
import { useContentStore } from "../stores/content.js";

export const useProjectStore = defineStore("project", () => {
  const config = useRuntimeConfig();
  const moduleStore = useModuleStore();
  const contentStore = useContentStore();
  const { token, data } = useAuth();
  const { socket } = useSocket();
  const headers = {
    Authorization: token.value,
    "Content-Type": "application/json;charset=UTF-8",
  };

  const alovaInstance = createAlova({
    baseURL: config.public.apiUrl,
    requestAdapter: GlobalFetch(),
    responded: {
      onSuccess: async (response) => {
        const json = await response.json();
        if (response.status !== 200) throw new Error(json.message);
        return json;
      },
    },
  });

  const items = ref([]);

  async function getAll() {
    const res = await alovaInstance.Get("/api/project").send();
    this.items = res;

    return res;
  }

  async function create(body) {
    const res = await alovaInstance
      .Post("/api/project/", body, { headers })
      .send();
    socket.emit("logs-project:create", body, data.value.user);
    this.items.push(res);

    return res;
  }

  async function update(body) {
    const res = await alovaInstance
      .Put(`/api/project/${body._id}`, body, { headers })
      .send();
    socket.emit("logs-project:update", body, data.value.user);
    const index = this.items.findIndex((v) => v._id === res._id);
    Object.assign(this.items[index], res);

    return res;
  }

  async function remove(body) {
    const res = await alovaInstance
      .Delete("/api/project/remove", body, { headers })
      .send();

    const { projects, modules, content } = res.deleted;

    projects.forEach((id) => {
      const index = items.value.findIndex((v) => v._id === id);
      if (index !== -1) items.value.splice(index, 1);
    });

    if (modules.length > 0 && moduleStore.items) {
      modules.forEach((id) => {
        const index = moduleStore.items.findIndex((v) => v._id === id);
        if (index !== -1) moduleStore.items.splice(index, 1);
      });
    }

    if (content.length > 0 && contentStore.items) {
      content.forEach((id) => {
        const index = contentStore.items.findIndex((v) => v._id === id);
        if (index !== -1) contentStore.items.splice(index, 1);
      });
    }

    socket.emit("logs-project:delete", body, data.value.user);
    return res;
  }

  return {
    items,
    getAll,
    create,
    update,
    remove,
  };
});
