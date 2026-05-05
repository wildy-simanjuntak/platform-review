<script lang="ts" setup>
import { useLogStore } from "../../stores/logs";
import { useUsersStore } from "../../stores/users";
import { onMounted, ref, computed } from "vue";

const logStore = useLogStore();
const usersStore = useUsersStore();

const { pending, error, execute } = useLazyAsyncData(
  () => usersStore.getAll(),
  {
    immediate: false,
  },
);

onMounted(() => {
  logStore.init();
  execute();
});

// 2. State untuk Filter (Local UI State)
const q = ref("");
const selectedLevel = ref("all");

const levels = [
  { label: "All Activities", value: "all" },
  { label: "Create", value: "create", color: "text-green-500" },
  { label: "Update", value: "update", color: "text-amber-500" },
  { label: "Delete", value: "delete", color: "text-red-500" },
];

// 3. Computed Filter (Client-side filtering untuk UX instan)
const filteredLogs = computed(() => {
  return logStore.logs.filter((log: any) => {
    const matchSearch =
      log.message?.toLowerCase().includes(q.value.toLowerCase()) ||
      log.source?.toLowerCase().includes(q.value.toLowerCase());
    const matchLevel =
      selectedLevel.value === "all" || log.level === selectedLevel.value;
    return matchSearch && matchLevel;
  });
});

// 4. Konfigurasi Kolom Tabel
const columns = [
  { key: "createdAt", label: "Time", sortable: true },
  { key: "level", label: "Event" },
  { key: "message", label: "Activity Details" },
  { key: "user", label: "Performed By" },
  { key: "source", label: "System Path" },
];

// Helper warna badge
const getLevelColor = (level: string) => {
  switch (level) {
    case "create":
      return "green";
    case "update":
      return "amber";
    case "delete":
      return "red";
    default:
      return "blue";
  }
};
</script>

<template>
  <div class="p-6 sm:p-10 space-y-6 w-full max-w-7xl mx-auto">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1
          class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2"
        >
          <UIcon
            name="i-solar-history-bold-duotone"
            class="text-primary-500 w-8 h-8"
          />
          System Activity Logs
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Real-time monitoring of all project, module, and content changes.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="gray"
          variant="ghost"
          @click="logStore.fetchHistory"
          label="Refresh History"
        />
      </div>
    </div>

    <UCard
      :ui="{ body: { padding: 'p-3 sm:p-4' } }"
      class="shadow-sm border-none ring-1 ring-gray-200 dark:ring-gray-800"
    >
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="q"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search by message or path..."
          class="flex-1"
          color="white"
        />
        <USelectMenu
          v-model="selectedLevel"
          :options="levels"
          value-attribute="value"
          option-attribute="label"
          class="w-full sm:w-48"
        >
          <template #label>
            <span v-if="selectedLevel === 'all'">Filter Level</span>
            <span v-else class="capitalize">{{ selectedLevel }}</span>
          </template>
        </USelectMenu>
      </div>
    </UCard>

    <UCard
      :ui="{ body: { padding: 'p-0' } }"
      class="overflow-hidden shadow-md border-none"
    >
      <UTable :rows="filteredLogs" :columns="columns" class="w-full">
        <template #empty-state>
          <div></div>
        </template>
        <template #createdAt-data="{ row }">
          <div class="flex flex-col leading-tight">
            <span class="text-xs font-bold text-gray-900 dark:text-white">
              {{
                new Date(row.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}
            </span>
            <span class="text-[10px] text-gray-400 font-mono">
              {{ new Date(row.createdAt).toLocaleDateString() }}
            </span>
          </div>
        </template>

        <template #level-data="{ row }">
          <UBadge
            :color="getLevelColor(row.level)"
            variant="soft"
            size="xs"
            class="uppercase font-extrabold px-2 py-0.5"
          >
            {{ row.level }}
          </UBadge>
        </template>

        <template #message-data="{ row }">
          <p
            class="text-sm text-gray-700 dark:text-gray-300 font-medium max-w-md truncate"
            :title="row.message"
          >
            {{ row.message }}
          </p>
        </template>

        <template #user-data="{ row }">
          <template v-if="row.metadata?.[0]?.user">
            <div class="flex items-center gap-2">
              <UAvatar
                size="xs"
                :src="
                  row.metadata[0].image
                    ? `/image/users/${slug(row.metadata[0].user.username)}.png`
                    : `https://ui-avatars.com/api/?name=${row.metadata[0].user.username}&background=random&size=128`
                "
                :alt="row.metadata[0].user.username"
              />
              <div class="flex flex-col">
                <span class="text-xs font-semibold">
                  {{ row.metadata[0].user.username }}
                </span>
              </div>
            </div>
          </template>
          <span v-else class="text-xs text-gray-400 italic">auto_system</span>
        </template>

        <template #source-data="{ row }">
          <span
            class="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 truncate block max-w-[200px]"
          >
            {{ row.source }}
          </span>
        </template>
      </UTable>

      <div
        v-if="filteredLogs.length === 0"
        class="py-20 text-center flex flex-col items-center"
      >
        <UIcon
          name="i-solar-clapperboard-edit-broken"
          class="w-16 h-16 text-gray-300 mb-4"
        />
        <h3 class="text-lg font-bold text-gray-400">No activities found</h3>
        <p class="text-sm text-gray-500">
          New logs will appear here as they happen.
        </p>
      </div>
    </UCard>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease;
}
.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
