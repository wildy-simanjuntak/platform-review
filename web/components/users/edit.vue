<script setup>
import { z } from 'zod';
import { useUsersStore } from '../../stores/users';
import { useRolesStore } from '../../stores/roles';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const store = useUsersStore();
const roles = useRolesStore();
const toast = useToast();

const isOpen = ref(false);
const form = ref();

const state = ref({
  _id: undefined,
  username: undefined,
  email: undefined,
  role: undefined,
  password: '',
  confPassword: '',
});

watch(() => [props.show, props.data], ([showValue, dataValue]) => {
  isOpen.value = showValue;
  if (dataValue) {
    state.value = {
      _id: dataValue._id,
      username: dataValue.username,
      email: dataValue.email,
      role: dataValue.role?._id,
      password: '',
      confPassword: '',
    };
  }
});

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.string().min(1, 'Role is required'),
  password: z.string().transform(v => v === '' ? undefined : v).optional().refine((val) => {
    if (!val) return true;
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val);
  }, 'Password must be at least 8 characters with uppercase, lowercase, and a number'),
  confPassword: z.string().optional(),
}).refine((data) => {
  if (data.password || data.confPassword) {
    return data.password === data.confPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confPassword"],
});

const {
  status,
  error,
  execute,
} = useLazyAsyncData(() => store.update(state.value), {
  immediate: false,
});

const current = computed(() => roles.items.find((v) => v._id === state.value.role));

const close = () => {
  error.value = undefined;
  emit('close');
};

const submit = async () => {
  await form.value?.validate();
  await execute();

  if (!error.value) {
    close();

    toast.add({
      title: 'Done',
      description: 'Data has been updated successfully',
      icon: 'i-solar-check-circle-linear',
      color: 'green',
    });
  }

  return null;
};
</script>

<template>
  <div>
    <UModal v-model="isOpen" prevent-close>
      <UForm ref="form" :schema="schema" :state="state" class="flex flex-col space-y-[2rem]" @submit="submit">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="text-base">
                Edit Users
              </div>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="close" />
            </div>
          </template>

          <div class="flex flex-col space-y-[2rem]">
            <ErrorHandler v-if="error" :error="error?.message" />

            <UFormGroup label="Username" name="username">
              <UInput v-model="state.username" />
            </UFormGroup>
            <UFormGroup label="Email" name="email">
              <UInput v-model="state.email" disabled />
            </UFormGroup>
            <UFormGroup label="Role" name="role">
              <USelectMenu v-model="state.role" :options="roles.items" size="lg" value-attribute="_id"
                option-attribute="name" searchable>
                <template #label>
                  {{ current?.name || 'Select...' }}
                </template>
              </USelectMenu>
            </UFormGroup>
            <UFormGroup label="New Password" name="password">
              <UInput v-model="state.password" type="password" placeholder="Optional" />
            </UFormGroup>

            <UFormGroup label="Confirm New Password" name="confPassword" v-if="state.password">
              <UInput v-model="state.confPassword" type="password" />
            </UFormGroup>
          </div>

          <template #footer>
            <div class="flex space-x-[1rem]">
              <div class="flex-1" />
              <UButton label="Close" color="white" @click="close" />
              <UButton label="Save" :loading="status === 'pending'" @click="submit" />
            </div>
          </template>
        </UCard>
      </UForm>
    </UModal>
  </div>

  <!-- <UModal v-model="isOpen" prevent-close class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">

      <div class="p-4 border-b-2 border-black flex items-center justify-between">
        <h2 class="text-lg font-bold uppercase tracking-tight">Edit Users</h2>
        <button @click="close" class="p-1 border-2 border-transparent hover:border-black transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-8">

        <div class="flex flex-col space-y-2">
          <label class="text-sm font-bold uppercase tracking-wider">Username</label>
          <input type="text" class="w-full border-2 border-black p-2 outline-none focus:bg-gray-100" value="admin_user">
        </div>

        <div class="flex flex-col space-y-2">
          <label class="text-sm font-bold uppercase tracking-wider text-gray-400">Email (Locked)</label>
          <div
            class="w-full border-2 border-gray-200 bg-gray-100 p-2 text-gray-400 cursor-not-allowed flex items-center justify-between">
            <span>admin@platform.com</span>
            <span class="text-[10px] border border-gray-300 px-1">READ ONLY</span>
          </div>
        </div>

        <div class="flex flex-col space-y-2">
          <label class="text-sm font-bold uppercase tracking-wider">Role</label>
          <div
            class="w-full border-2 border-black p-2 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer">
            <span>Admin</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div class="flex flex-col space-y-2">
          <label class="text-sm font-bold uppercase tracking-wider">New Password</label>
          <input type="password" class="w-full border-2 border-black p-2 outline-none" placeholder="Optional">
        </div>

        <div class="flex flex-col space-y-2 border-l-4 border-black pl-4">
          <label class="text-sm font-bold uppercase tracking-wider text-black">Confirm New Password</label>
          <input type="password" class="w-full border-2 border-black p-2 outline-none bg-white">
        </div>

      </div>

      <div class="p-6 border-t-2 border-black bg-gray-50 flex justify-end space-x-4">
        <button @click="close"
          class="px-6 py-2 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors">
          Close
        </button>
        <button
          class="px-6 py-2 bg-black text-white border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors">
          Save
        </button>
      </div>

    </div>
  </UModal> -->
</template>