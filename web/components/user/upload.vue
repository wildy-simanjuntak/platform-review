<script setup>
import { useContentStore } from "../../stores/content";

const store = useContentStore();
const { data } = useAuth({ immediate: true });

const search = ref("");
const showCreate = ref(false);
const showEdit = ref(false);

const selected = ref([]);
const itemData = ref({});
const page = ref(1);
const pageCount = ref(10);
const contentData = ref([]);
const dt = ref({});

const columns = [
  {
    key: "index",
    label: "#",
    class: "text-center",
  },
  {
    key: "project",
    label: "Project",
  },
  {
    key: "module",
    label: "Module",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "status",
    label: "File",
  },
  {
    key: "actions",
    label: "Actions",
  },
];

contentData.value = store.items
  .filter((val) => val.module.signTo.includes(data.value.user._id))
  .map((val) => val);

const items = computed(
  () =>
    useFilter(contentData.value, search.value, ["name", "project", "module"]) ||
    [],
);
const rows = computed(() =>
  items.value.slice(
    (page.value - 1) * pageCount.value,
    page.value * pageCount.value,
  ),
);
const pageFrom = computed(() => (page.value - 1) * pageCount.value + 1);
const pageTo = computed(() =>
  Math.min(page.value * pageCount.value, items.value.length),
);

const { pending, error, execute } = useLazyAsyncData(() => store.getAll(), {
  immediate: false,
});

const editDialog = (item) => {
  showEdit.value = true;
  dt.value = item;
};

onMounted(async () => {
  await execute();
  if (data.value) {
    contentData.value = store.items
      .filter((val) => val.module.signTo.includes(data.value.user._id))
      .map((val) => val);
  }
});

const toggleUpload = (row) => {
  showCreate.value = true;
  dt.value = row;
};
</script>

<template>
  <div class="w-full p-4 pt-24">
    <UCard class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold">Content Management</h2>
        <UInput
          v-model="search"
          placeholder="Search..."
          icon="i-heroicons-magnifying-glass-20-solid"
          class="w-64"
        >
          <template #trailing>
            <UButton
              v-show="search"
              color="gray"
              variant="link"
              icon="i-heroicons-x-mark-20-solid"
              :padded="false"
              @click="search = ''"
            />
          </template>
        </UInput>
      </div>

      <UTable
        :rows="rows"
        :columns="columns"
        :loading="pending"
        class="min-h-[300px]"
      >
        <template #index-data="{ index }">
          <div class="text-center">{{ index + 1 }}</div>
        </template>

        <template #project-data="{ row }">
          {{ row.module.project.name }}
        </template>

        <template #module-data="{ row }">
          {{ row.module.name }}
        </template>

        <template #status-data="{ row }">
          <div :key="row._id + row.status">
            <UTooltip v-if="row.status" text="View Content">
              <a
                :href="`/digital-content/${row.module.project.slug}/${row.module.slug}/pages/content/${row.slug}/index.html`"
                target="_blank"
                rel="noopener noreferrer"
              >
                <UIcon
                  name="i-solar-eye-broken"
                  class="w-6 h-6 text-primary-500"
                />
              </a>
            </UTooltip>

            <UTooltip v-else text="Upload ZIP">
              <UButton
                icon="i-solar-upload-bold"
                variant="ghost"
                color="orange"
                @click="toggleUpload(row)"
              />
            </UTooltip>
          </div>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-solar-pen-2-linear"
            variant="ghost"
            color="gray"
            @click="editDialog(row)"
          />
        </template>
      </UTable>

      <div
        class="flex items-center justify-end py-4 gap-4 border-t border-gray-100"
      >
        <span class="text-sm text-gray-500">
          Showing {{ pageFrom }} to {{ pageTo }} of {{ items.length }}
        </span>
        <USelectMenu v-model="pageCount" :options="[10, 20, 50]" class="w-20" />
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="items.length"
        />
      </div>
    </UCard>

    <UserUploadZip :show="showCreate" :dt="dt" @close="showCreate = false" />
    <UserEdit :show="showEdit" :data="dt" @close="showEdit = false" />
  </div>
</template>
