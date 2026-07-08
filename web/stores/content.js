import { defineStore } from "pinia";
import { createAlova } from "alova";
import GlobalFetch from "alova/GlobalFetch";
import { useModuleStore } from "../stores/module.js";

export const useContentStore = defineStore("content", () => {
  const config = useRuntimeConfig();
  const { data: authData, token } = useAuth();
  const { socket } = useSocket();

  const headers = {
    Authorization: token.value,
  };

  const alovaInstance = createAlova({
    baseURL: config.public.apiUrl,
    requestAdapter: GlobalFetch(),
    responded: {
      onSuccess: async (response) => {
        const json = await response.json();
        if (response.status !== 200)
          throw new Error(json.message || "Request Error");
        return json;
      },
    },
  });

  const items = ref([]);

  const syncModule = (updatedModule) => {
    if (!updatedModule) return;
    const moduleStore = useModuleStore();
    const index = moduleStore.items.findIndex(
      (m) => m._id === updatedModule._id,
    );
    if (index !== -1) {
      moduleStore.items[index] = { ...updatedModule };
    }
  };

  async function getAll() {
    const res = await alovaInstance.Get("/api/content").send();
    items.value = res;
    return res;
  }

  async function create(body) {
    const res = await alovaInstance
      .Post("/api/content/", body, {
        headers: {
          ...headers,
          "Content-Type": "application/json;charset=UTF-8",
        },
      })
      .send();

    socket.emit("logs-content:create", body, authData.value.user);

    items.value.push(res.data);
    console.log("Created Content:", items.value);
    syncModule(res.module);

    return res.data;
  }

  async function upload(body) {
    const res = await alovaInstance
      .Post("/api/content/upload", body, {
        headers: { Authorization: token.value },
        enableUpload: true,
      })
      .send();

    const index = items.value.findIndex((v) => v._id === res.data._id);
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...res.data };
    } else {
      items.value.push(res.data);
    }

    syncModule(res.module);
    return res.data;
  }

  async function update(body) {
    const { contentZip, ...rest } = body;
    const formData = new FormData();
    formData.append("data", JSON.stringify(rest));

    if (contentZip) {
      formData.append("content", contentZip);
    }

    const res = await alovaInstance
      .Put(`/api/content/${body._id}`, formData, {
        headers: { Authorization: token.value },
        enableUpload: true,
      })
      .send();

    socket.emit("logs-content:update", rest, authData.value.user);

    const index = items.value.findIndex((v) => v._id === res.data._id);
    if (index !== -1) {
      items.value[index] = { ...res.data };
    }

    syncModule(res.module);
    return res.data;
  }

  async function remove(body) {
    const res = await alovaInstance
      .Delete("/api/content/remove", body, {
        headers: {
          ...headers,
          "Content-Type": "application/json;charset=UTF-8",
        },
      })
      .send();

    const { deletedIds, module: updatedModule } = res;

    items.value = items.value.filter((item) => !deletedIds.includes(item._id));

    socket.emit("logs-content:delete", body, authData.value.user);

    syncModule(updatedModule);

    return res;
  }

  return {
    items,
    getAll,
    create,
    update,
    remove,
    upload,
  };
});
