<script setup>
import { useUsersStore } from '../../stores/users';
import { useRolesStore } from '../../stores/roles';

const usersStore = useUsersStore();
const roleStore = useRolesStore();

const search = ref('');
const showCreate = ref(false);
const showEdit = ref(false);
const showRemove = ref(false);
const selected = ref([]);
const itemData = ref({});
const page = ref(1);
const pageCount = ref(10);

const columns = [{
    key: 'index',
    label: '#',
    class: 'text-center',
}, {
    key: 'username',
    label: 'Username',
}, {
    key: 'email',
    label: 'Email',
},
{
    key: 'role',
    label: 'Role',
}, {
    key: 'actions',
    label: 'Actions',
}];

const items = computed(() => useFilter(usersStore.items, search.value, ['username']) || []);
const rows = computed(() => items.value.slice((page.value - 1) * pageCount.value, (page.value) * pageCount.value));
const pageFrom = computed(() => (page.value - 1) * pageCount.value + 1);
const pageTo = computed(() => Math.min(page.value * pageCount.value, items.value.length));

const {
    pending,
    error,
    execute,
} = useLazyAsyncData(() => Promise.all(usersStore.getAll(), roleStore.getAll()), {
    immediate: false,
});


const editDialog = (item) => {
    showEdit.value = true;
    itemData.value = item;
};

onMounted(async () => {
    await execute();
});

</script>

<template>
    <div class="w-full">
        <div class="p-4 pt-24">
            <div class="p-10 bg-white rounded-lg border-2">
                <div class="flex justify-between">
                    <div class="text-2xl font-semibold">Users Management</div>
                    <div class="flex items-center space-x-4">
                        <UButton @click="showCreate = true" icon="i-solar-add-square-bold" size="sm" color="primary"
                            label="Create" :trailing="false">
                        </UButton>
                        <UButton icon="i-solar-trash-bin-2-bold" size="sm" color="red" label="Remove"
                            :disabled="!selected.length" @click="showRemove = true" />
                    </div>
                </div>
                <UTable v-model="selected" :rows="rows" :columns="columns" :loading="pending" class="max-h-96">
                    <template #index-data="{ index }">
                        <div class="text-center">
                            {{ index + 1 }}
                        </div>
                    </template>
                    <template #role-data="{ row }">
                        {{ row.role.name }}
                    </template>
                    <template #actions-data="{ row }">
                        <div class="flex space-x-[1rem]">
                            <UTooltip text="Edit">
                                <UButton icon="i-solar-pen-2-linear" size="xs" variant="ghost" color="gray"
                                    :padded="false" @click="editDialog(row)" />
                            </UTooltip>
                        </div>
                    </template>
                </UTable>

                <div v-if="rows.length" class="flex items-center justify-end py-4 gap-8">
                    <div class="text-primary-600">
                        Showing {{ pageFrom }} to {{ pageTo }} of {{ items.length }} results
                    </div>
                    <USelectMenu v-model="pageCount" :options="[10, 20, 30, 40, 50]" class="w-20" />
                    <UPagination v-model="page" :page-count="pageCount" :total="items.length" />
                </div>

            </div>

            <UsersCreate :show="showCreate" @close="showCreate = false" />
            <UsersEdit :show="showEdit" :data="itemData" @close="showEdit = false" />
            <UsersRemove :show="showRemove" :data="selected" @close="showRemove = false" />

        </div>
    </div>

    <!-- <div class="w-full min-h-screen bg-white p-4 pt-24 font-sans text-black">

        <div
            class="max-w-7xl mx-auto p-10 border-2 border-black bg-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

            <div class="flex justify-between items-center mb-10">
                <h1 class="text-2xl font-bold uppercase tracking-tighter">Users Management</h1>

                <div class="flex items-center space-x-4">
                   <UButton 
                    label="Create" 
                    color="white"
                    icon="i-solar-add-square-bold" 
                    @click="showCreate = true" 
                    />
                    <UButton icon="i-solar-trash-bin-2-bold" size="sm" color="white" label="Remove"  @click="showRemove = true" />
                </div>
            </div>

            <div class="border-2 border-black rounded-sm overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b-2 border-black bg-gray-50 uppercase text-xs font-black">
                            <th class="p-4 w-12 border-r-2 border-black text-center"><input type="checkbox"
                                    class="accent-black"></th>
                            <th class="p-4 w-16 border-r-2 border-black text-center">#</th>
                            <th class="p-4 border-r-2 border-black">Username</th>
                            <th class="p-4 border-r-2 border-black">Email</th>
                            <th class="p-4 border-r-2 border-black">Role</th>
                            <th class="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        <tr class="border-b-2 border-black hover:bg-gray-50 transition-colors">
                            <td class="p-4 border-r-2 border-black text-center"><input type="checkbox"
                                    class="accent-black">
                            </td>
                            <td class="p-4 border-r-2 border-black text-center font-mono text-gray-500">1</td>
                            <td class="p-4 border-r-2 border-black font-bold tracking-tight">admin_main</td>
                            <td class="p-4 border-r-2 border-black">admin@platform.com</td>
                            <td class="p-4 border-r-2 border-black">
                                <span
                                    class="px-2 py-0.5 border border-black text-[10px] font-black uppercase">ADMIN</span>
                            </td>
                            <td class="p-4 text-center">
                                <button
                                    @click="editDialog(row)"
                                    class="px-3 py-1 border border-black text-xs font-bold hover:bg-black hover:text-white transition-all">
                                    ✎ EDIT
                                </button>
                            </td>
                        </tr>
                        <tr class="border-b-2 border-black hover:bg-gray-50 transition-colors">
                            <td class="p-4 border-r-2 border-black text-center"><input type="checkbox"
                                    class="accent-black">
                            </td>
                            <td class="p-4 border-r-2 border-black text-center font-mono text-gray-500">2</td>
                            <td class="p-4 border-r-2 border-black font-bold tracking-tight">dev_user</td>
                            <td class="p-4 border-r-2 border-black">developer@labtech.io</td>
                            <td class="p-4 border-r-2 border-black">
                                <span
                                    class="px-2 py-0.5 border border-black text-[10px] font-black uppercase">STAFF</span>
                            </td>
                            <td class="p-4 text-center">
                                <button
                                    @click="editDialog(row)"
                                    class="px-3 py-1 border border-black text-xs font-bold hover:bg-black hover:text-white transition-all">
                                    ✎ EDIT
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex items-center justify-end mt-8 space-x-8">
                <div class="text-sm font-bold uppercase tracking-tight">
                    Showing 1 to 2 of 2 results
                </div>

                <div class="relative">
                    <select
                        class="appearance-none bg-white border-2 border-black px-4 py-1 pr-8 font-bold text-sm outline-none cursor-pointer">
                        <option>10</option>
                        <option>20</option>
                        <option>50</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        <span class="text-[10px]">▼</span>
                    </div>
                </div>

                <div class="flex border-2 border-black divide-x-2 divide-black">
                    <button class="px-3 py-1 font-black hover:bg-black hover:text-white transition-all">&lt;</button>
                    <button class="px-4 py-1 bg-black text-white font-black">1</button>
                    <button class="px-4 py-1 font-black hover:bg-gray-100 transition-all">2</button>
                    <button class="px-3 py-1 font-black hover:bg-black hover:text-white transition-all">&gt;</button>
                </div>
            </div>
            <UsersCreate :show="showCreate" @close="showCreate = false" />
            <UsersEdit :show="showEdit" :data="itemData" @close="showEdit = false" />
            <UsersRemove :show="showRemove" :data="selected" @close="showRemove = false" />
        </div>
    </div> -->
</template>