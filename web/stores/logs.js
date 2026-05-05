import { defineStore } from 'pinia';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';

export const useLogStore = defineStore('log', () => {
  const config = useRuntimeConfig();
  const { token } = useAuth();
  const { socket } = useSocket();
  const usersStore = useUsersStore();

  const alovaInstance = createAlova({
    baseURL: config.public.apiUrl,
    requestAdapter: GlobalFetch(),
    responded: {
      onSuccess: async (response) => {
        const json = await response.json();
        if (response.status !== 200) throw new Error(json.message || 'Error');
        return json;
      },
    },
  });

  const logs = ref([]);
  const isLoaded = ref(false);

  const formatLogUser = (log) => {
    const userRef = log.metadata?.[0]?.user;
    if (typeof userRef === 'string') {
      const userData = usersStore.items.find((u) => u._id === userRef || u.id === userRef);
      if (userData && log.metadata[0]) {
        log.metadata[0].user = {
          _id: userData._id,
          username: userData.username,
          image: userData.image
        };
      }
    }
    return log;
  };

  const fetchHistory = async () => {
    try {
      const res = await alovaInstance.Get('/api/logs/', {
        headers: { Authorization: token.value }
      }).send();
      
      const rawLogs = res.data || res;
      logs.value = Array.isArray(rawLogs) ? rawLogs.map(formatLogUser) : [];
      isLoaded.value = true;
    } catch (err) {
      console.error(err);
    }
  };

  const listenRealtime = () => {
    const events = [
      'logs-project', 'logs-module', 'logs-content'
    ].flatMap(category => [`${category}:create`, `${category}:update`, `${category}:delete`]);

    events.forEach(eventName => {
      socket.off(eventName);
      socket.on(eventName, (newLog) => {
        logs.value.unshift(formatLogUser(newLog));
        if (logs.value.length > 50) logs.value.pop();
      });
    });
  };

  const init = async () => {
    if (isLoaded.value) return;
    await fetchHistory();
    listenRealtime();
  };

  return {
    logs,
    isLoaded,
    init,
    fetchHistory
  };
});