import { defineStore } from "pinia";
import { createAlova } from "alova";
import { useProjectStore } from "../stores/projects.js";
import GlobalFetch from "alova/GlobalFetch";

export const useModuleStore = defineStore("module", () => {
  const config = useRuntimeConfig();

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
    const res = await alovaInstance.Get("/api/module").send();
    this.items = res;

    return res;
  }

  async function create(body) {
    const { landingPage, ...rest } = body;
    const formData = new FormData();
    formData.append("data", JSON.stringify(rest));
    formData.append("landingPage", landingPage);

    const res = await alovaInstance
      .Post("/api/module/", formData, {
        headers: {
          Authorization: token.value,
        },
        enableUpload: true,
      })
      .send();

    const newModule = res.data;
    const updatedProject = res.project;
    socket.emit("logs-module:create", rest);

    this.items.push(newModule);

    const projectStore = useProjectStore();

    const projectIndex = projectStore.items.findIndex(
      (p) => p._id === updatedProject._id,
    );

    if (projectIndex !== -1) {
      projectStore.items[projectIndex] = updatedProject;
    }

    return newModule;
  }

  async function update(body) {
    const res = await alovaInstance
      .Put(`/api/module/${body._id}`, body, { headers })
      .send();
    console.log("Update Module Response:", res);
    const updatedModule = res.data;
    const updatedProject = res.project;

    socket.emit("logs-module:update", body);

    const index = this.items.findIndex((v) => v._id === updatedModule._id);
    if (index !== -1) {
      Object.assign(this.items[index], updatedModule);
    }

    const projectStore = useProjectStore();
    const pIndex = projectStore.items.findIndex(
      (p) => p._id === updatedProject._id,
    );
    if (pIndex !== -1) {
      projectStore.items[pIndex] = updatedProject;
    }

    return updatedModule;
  }

  async function remove(body) {
    const res = await alovaInstance
      .Delete("/api/module/remove", body, { headers })
      .send();

    const { deletedIds, project: updatedProject } = res;

    this.items = this.items.filter((item) => !deletedIds.includes(item._id));

    if (updatedProject) {
      const projectStore = useProjectStore();
      const pIndex = projectStore.items.findIndex(
        (p) => p._id === updatedProject._id,
      );
      if (pIndex !== -1) {
        projectStore.items[pIndex] = updatedProject;
      }
    }

    socket.emit('logs-module:delete', body, data.value.user);
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
