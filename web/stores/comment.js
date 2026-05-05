import { defineStore } from "pinia";
import { createAlova } from "alova";
import GlobalFetch from "alova/GlobalFetch";

export const useCommentStore = defineStore("comment", () => {
  const config = useRuntimeConfig();
  const { data: authData, token } = useAuth();
  const { socket } = useSocket();

  const comments = ref([]);

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

  async function getComments(moduleId) {
    try {
      const res = await alovaInstance.Get(`/api/comment/${moduleId}`, {
        headers: { ...headers }
      }).send();
      comments.value = res || [];
    } catch (err) {
      console.error("Gagal ambil komentar:", err);
      comments.value = [];
    }
  }

  async function sendComment(moduleId, text, file) {
    const formData = new FormData();
    
    if (file) {
      formData.append('image', file); 
    }
    
    formData.append('moduleId', moduleId);
    formData.append('text', text || '');
    formData.append('userId', authData.value?.user._id);

    /*
    console.log("Isi FormData:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    } */

    try {
      const savedComment = await alovaInstance.Post('/api/comment/', formData, {
        headers: { Authorization: token.value,},
        enableUpload: true,
      }).send();

      if (savedComment && savedComment._id) {
        const exists = comments.value.some((c) => c._id === savedComment._id);
        if (!exists) comments.value.push(savedComment);

        if (socket) {
          console.log(savedComment);
          socket.emit("comment:new", savedComment);
        }
      }
      
    } catch (err) {
      console.error("Gagal mengirim komentar:", err.message);
    }
  }

  function listenComments(moduleId) {
    if (!socket) return;
    socket.off(`comment:receive:${moduleId}`);
    socket.on(`comment:receive:${moduleId}`, (newComment) => {
      const exists = comments.value.some((c) => c._id === newComment._id);
      if (!exists) comments.value.push(newComment);
    });
  }

  function unlistenComments(moduleId) {
    if (socket) socket.off(`comment:receive:${moduleId}`);
  }

  return {
    comments,
    getComments,
    sendComment,
    listenComments,
    unlistenComments,
  };
});