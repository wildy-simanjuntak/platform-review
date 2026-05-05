<script setup>
import { useRolesStore } from "../../stores/roles";
import { useUsersStore } from "../../stores/users";
import { useProjectStore } from "../../stores/projects.js";
import { useModuleStore } from "../../stores/module.js";
import { useContentStore } from "../../stores/content.js";
import { onActivated, watch } from "vue";

const roles = useRolesStore();
const users = useUsersStore();
const project = useProjectStore();
const module = useModuleStore();
const content = useContentStore();

const page = ref(1);
const pageCount = 5;

const { pending, execute, refresh } = useLazyAsyncData(
  () =>
    Promise.all([
      roles.getAll(),
      users.getAll(),
      project.getAll(),
      module.getAll(),
      content.getAll(),
    ]),
  {
    immediate: false,
  },
);

const columns = [
  { key: "name", label: "Project Name", sortable: true },
  { key: "modules", label: "Modules Count" },
  { key: "updatedAt", label: "Last Update" },
  { key: "actions", label: "Actions" },
];

const paginatedProjects = computed(() => {
  return project.items.slice(
    (page.value - 1) * pageCount,
    page.value * pageCount,
  );
});

const summaryCards = computed(() => [
  {
    label: "USERS",
    count: users.items.length,
    icon: "i-solar-users-group-rounded-bold",
  },
  { label: "ROLES", count: roles.items.length, icon: "i-solar-user-id-bold" },
  {
    label: "PROJECTS",
    count: project.items.length,
    icon: "i-solar-folder-2-bold",
  },
  {
    label: "MODULES",
    count: module.items.length,
    icon: "i-solar-folder-2-bold",
  },
  { label: "CONTENTS", count: content.items.length, icon: "i-solar-file-bold" },
]);

onMounted(async () => {
  await execute();
});
</script>

<template>
  <div class="py-10 w-full px-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
      <UCard
        v-for="card in summaryCards"
        :key="card.label"
        :ui="{ body: { padding: 'p-4' } }"
      >
        <div class="flex justify-between items-center">
          <div>
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {{ card.label }}
            </p>
            <p class="text-2xl font-semibold mt-1">{{ card.count }}</p>
          </div>
          <UIcon :name="card.icon" class="w-10 h-10 text-primary-500/50" />
        </div>
      </UCard>
    </div>

    <div
      class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <h2 class="text-xl font-bold">Project Architecture</h2>
        <UInput
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search project..."
          class="w-full sm:w-64"
        />
      </div>

      <UTable :rows="paginatedProjects" :columns="columns" :loading="pending">
        <template #modules-data="{ row }">
          <UBadge color="gray" variant="soft" size="xs">
            {{ row.module?.length || 0 }} Modules
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center space-x-2">
            <UButton
              :to="`/dashboard/${row._id}`"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-right-20-solid"
              label="View Project"
              size="xs"
            />
          </div>
        </template>
      </UTable>

      <div
        class="flex justify-center items-center py-4 border-t border-gray-200 dark:border-gray-800"
      >
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="project.items.length"
          :ui="{
            wrapper: 'flex items-center gap-2',
            base: 'rounded-md shadow-sm',
          }"
        />
      </div>
    </div>

    <div class="mt-4 text-center text-xs text-gray-400">
      Showing {{ paginatedProjects.length }} of
      {{ project.items.length }} projects
    </div>
  </div>
</template>
