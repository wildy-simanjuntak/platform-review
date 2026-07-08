<!-- <script setup>
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
</template> -->

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useProjectStore } from '../../stores/projects';
import { useModuleStore } from '../../stores/module';
import { useContentStore } from '../../stores/content';

 const {  data } = useAuth();
const projectStore = useProjectStore();
const moduleStore = useModuleStore();
const contentStore = useContentStore();

const loading = ref(false);

const state = ref({
  projectId: null,
  moduleId: null,
  contentType: null,
  contentZip: null
});

const contentOptions = [
  'component identification',
  'component location assessment',
  'reference assessment',
  'operational simulation'
];

// Reset module jika project berubah
watch(() => state.value.projectId, () => {
  state.value.moduleId = null;
});

// Filter modul menggunakan ID string untuk memastikan kecocokan tipe data
const filteredModules = computed(() => {
  const selectedProject = projectStore.items.find(
    p => p._id === state.value.projectId
  );

  if (!selectedProject?.module) return [];

  const currentUserId = data.value?.user?._id;

  return selectedProject.module.filter(mod =>
    mod.signTo.includes(currentUserId)
  );
});

const { pending, execute, refresh } = useLazyAsyncData(
  () =>
    Promise.all([
      projectStore.getAll(),
      moduleStore.getAll(),
    ]),
  {
    immediate: false,
  },
);

const submit = async () => {
  if (!state.value.projectId || !state.value.moduleId || !state.value.contentType || !state.value.contentZip) {
    return alert('Harap lengkapi semua field!');
  }

  loading.value = true;
  const formData = new FormData();
  formData.append('moduleId', state.value.moduleId);
  formData.append('type', state.value.contentType);
  formData.append('file', state.value.contentZip);

  try {
    await contentStore.upload(formData);
    alert('Upload berhasil!');
    state.value = { projectId: null, moduleId: null, contentType: null, contentZip: null };
  } catch (err) {
    alert('Gagal: ' + err.message);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await execute();
});
</script>
<template>
  <div class="w-full mx-auto p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl">
    <div class="mb-8">
      <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Upload Content</h2>
      <p class="text-sm text-gray-500 mt-1">Configure your module and upload the zip package</p>
    </div>

    <UForm :state="state" @submit="submit" class="space-y-6">
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormGroup label="Project" name="projectId">
          <USelectMenu
            v-model="state.projectId"
            :options="projectStore.items"
            value-attribute="_id"
            option-attribute="name"
            placeholder="Select project"
            searchable
            size="lg"
            class="w-full"
          />
        </UFormGroup>

        <UFormGroup label="Module" name="moduleId">
          <USelectMenu
            v-model="state.moduleId"
            :options="filteredModules"
            value-attribute="_id"
            option-attribute="name"
            :disabled="!state.projectId"
            placeholder="Select module"
            searchable
            size="lg"
            class="w-full"
          />
        </UFormGroup>
      </div>

      <UFormGroup label="Content Type" name="contentType">
        <USelectMenu
          v-model="state.contentType"
          :options="contentOptions"
          placeholder="e.g. Component Identification"
          size="lg"
        >
          <template #leading>
            <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
          </template>
        </USelectMenu>
      </UFormGroup>

      <UFormGroup label="Content Package" name="contentZip">
        <div class="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-500 transition-colors">
          <Upload v-model="state.contentZip" accept=".zip" />
          <p class="text-[10px] text-gray-400 mt-2 text-center">Only .zip files allowed (Max 100MB)</p>
        </div>
      </UFormGroup>

      <div class="pt-4">
        <UButton 
          type="submit" 
          size="lg"
          block
          :loading="loading"
          class="shadow-lg shadow-primary-500/30 font-semibold"
        >
          {{ loading ? 'Processing...' : 'Upload & Deploy' }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>