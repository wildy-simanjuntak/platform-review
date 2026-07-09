<script lang="ts" setup>
import { useProjectStore } from "../../../stores/projects.js";
import { useRoute } from "vue-router";
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from "vue";

const route = useRoute();
const projectStore = useProjectStore();
const q = ref("");
const newComment = ref("");
const chatContainer = ref<HTMLElement | null>(null);

const { execute, refresh } = useLazyAsyncData(
  "projects",
  () => projectStore.getAll(),
  {
    immediate: false,
  }
);

let interval: ReturnType<typeof setInterval>;

onMounted(async () => {
  await execute();

  interval = setInterval(() => {
    refresh();
  }, 5000); 
});

onUnmounted(() => {
  clearInterval(interval);
});

const currentProject = computed(() =>
  projectStore.items.find(p => p._id === route.params.id)
);

const filteredModules = computed(() => {
  const modules = currentProject.value?.module || [];
  if (!q.value) return modules;
  return modules.filter(
    (mod: any) =>
      mod.name?.toLowerCase().includes(q.value.toLowerCase()) ||
      mod.slug?.toLowerCase().includes(q.value.toLowerCase()),
  );
});

const moduleColumns = [
  { key: "name", label: "Module Name", sortable: true },
  { key: "slug", label: "Endpoint / Slug" },
  { key: "updatedAt", label: "Last Modified" },
  { key: "actions", label: "Actions", class: "text-right" },
];

const breadcrumbs = computed(() => [
  { label: "Dashboard", to: "/dashboard", icon: "i-heroicons-home" },
  { label: "Projects", to: "/dashboard" },
  { label: currentProject.value?.name || "Loading..." },
]);
</script>

<template>
  <div class="p-6 sm:p-10 space-y-8 w-full">
    <div class="space-y-4">
      <UBreadcrumb :links="breadcrumbs" />

      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1
            class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
          >
            {{ currentProject?.name || "Project Detail" }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Overview and management of your project modules architecture.
          </p>
        </div>
        <UButton
          icon="i-heroicons-arrow-left-20-solid"
          label="Back to Dashboard"
          color="gray"
          variant="ghost"
          to="/dashboard"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard :ui="{ body: { padding: 'p-5' } }">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-50 dark:bg-primary-950 rounded-lg">
            <UIcon
              name="i-solar-folder-2-bold"
              class="w-6 h-6 text-primary-600"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 font-medium">Total Modules</p>
            <p class="text-2xl font-bold">
              {{ currentProject?.module?.length || 0 }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="w-full gap-8">
      <div class="lg:col-span-3">
        <UCard
          :ui="{ body: { padding: 'p-0' }, header: { padding: 'px-4 py-4' } }"
        >
          <template #header>
            <div
              class="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <h3 class="font-bold text-lg">Architecture Modules</h3>
              <UInput
                v-model="q"
                icon="i-heroicons-magnifying-glass-20-solid"
                placeholder="Search modules..."
                size="sm"
                class="w-full sm:max-w-xs"
                color="white"
              >
                <template #trailing>
                  <UButton
                    v-show="q !== ''"
                    color="gray"
                    variant="link"
                    icon="i-heroicons-x-mark-20-solid"
                    :padded="false"
                    @click="q = ''"
                  />
                </template>
              </UInput>
            </div>
          </template>

          <UTable
            :rows="filteredModules"
            :columns="moduleColumns"
            class="w-full"
          >
            <template #name-data="{ row }">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center"
                >
                  <UIcon
                    name="i-solar-box-bold-duotone"
                    class="w-5 h-5 text-primary-500"
                  />
                </div>
                <span class="font-bold text-gray-900 dark:text-white">{{
                  row.name
                }}</span>
              </div>
            </template>

            <template #slug-data="{ row }">
              <UBadge variant="soft" color="primary" class="font-mono text-xs"
                >/{{ row.slug }}</UBadge
              >
            </template>

            <template #updatedAt-data="{ row }">
              <span class="text-xs text-gray-500">{{
                new Date(row.updatedAt).toLocaleDateString()
              }}</span>
            </template>

            <template #actions-data="{ row: mod }">
              <div class="flex justify-end pr-2">
                <UTooltip text="View Module Content">
                  <UButton
                    :to="`/project/${currentProject?.slug}/${mod.slug}/${mod._id}`"
                    icon="i-solar-eye-broken"
                    color="primary"
                    variant="soft"
                    size="sm"
                    class="rounded-full"
                  />
                </UTooltip>
              </div>
            </template>
          </UTable>

          <div v-if="filteredModules.length === 0" class="py-12 text-center">
            <UIcon
              name="i-heroicons-circle-stack"
              class="w-12 h-12 text-gray-300 mx-auto mb-3"
            />
            <p class="text-gray-500 font-medium">No modules found.</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Penting: Pastikan kontainer chat punya overflow-y */
.custom-scrollbar {
  overflow-y: auto;
  scroll-behavior: smooth;
  /* Menyembunyikan scrollbar di Firefox */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* Styling untuk Chrome/Safari */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* Warna slate-300 */
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155; /* Warna slate-700 untuk dark mode */
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
