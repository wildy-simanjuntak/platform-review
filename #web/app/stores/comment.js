import { defineStore } from "pinia";

export const useCommentStore = defineStore("comment", () => {
  const config = useRuntimeConfig();
  const { data: authData, token } = useAuth();
  const { socket } = useSocket();

  const comments = ref([]);

  // Fungsi getComments tetap sama
  async function getComments(projectId) {
    try {
      const res = await $fetch(`${config.public.apiUrl}/api/comment/${projectId}`, {
        headers: { Authorization: token.value },
      });
      comments.value = res || [];
    } catch (err) {
      comments.value = [];
    }
  }

  // UPDATE: Tambahkan parameter imageBase64
  function sendComment(projectId, text, imageBase64 = null) {
    if (!socket) {
      console.warn("Socket tidak tersedia");
      return;
    }

    // Validasi: Harus ada teks ATAU gambar
    if (!text?.trim() && !imageBase64) {
      console.warn("Komentar kosong");
      return;
    }

    socket.emit(
      "comment:send",
      {
        contentId: projectId,
        text,
        imageBase64, // Kirim data gambar ke server
      },
      authData.value?.user,
    );
  }

  function listenComments(projectId) {
    if (!socket) return;
    socket.off(`comment:receive:${projectId}`);
    socket.on(`comment:receive:${projectId}`, (newComment) => {
      const exists = comments.value.some((c) => c._id === newComment._id);
      if (!exists) comments.value.push(newComment);
    });
  }

  function unlistenComments(projectId) {
    if (socket) socket.off(`comment:receive:${projectId}`);
  }

  return {
    comments,
    getComments,
    sendComment,
    listenComments,
    unlistenComments,
  };
});