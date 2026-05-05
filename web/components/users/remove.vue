<script setup>
import { useUsersStore } from '../../stores/users';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(['close']);

const store = useUsersStore();
const toast = useToast();

const isOpen = ref(false);

watch(() => props.show, (showValue) => {
  isOpen.value = showValue;
});

const {
  status,
  error,
  execute,
} = useLazyAsyncData(() => store.remove(props.data), {
  immediate: false,
});

const submit = async () => {
  await execute();

  if (!error.value) {
    emit('close');

    toast.add({
      title: 'Done',
      description: 'Data has been removed successfully',
      icon: 'i-solar-check-circle-linear',
      color: 'red',
    });
  }

  return null;
};
</script>

<template>
  <div>
    <UModal v-model="isOpen" prevent-close>
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="text-base">
              Remove Users
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="$emit('close');" />
          </div>
        </template>

        <div class="flex flex-col space-y-[2rem]">
          <ErrorHandler v-if="status === 'error'" :error="error?.message" />

          <div>
            This action will delete the data permanently, Continue?
          </div>
        </div>

        <template #footer>
          <div class="flex space-x-[1rem]">
            <div class="flex-1" />
            <UButton label="Close" color="white" @click="$emit('close');" />
            <UButton label="Yes" color="red" :loading="status === 'pending'" @click="submit" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>

  <!-- <UModal v-model="isOpen" prevent-close class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  
  <div class="bg-white w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
    
    <div class="p-4 border-b-2 border-black flex items-center justify-between">
      <h2 class="text-md font-bold uppercase tracking-tight">Remove Users</h2>
      <button @click="$emit('close');" class="text-xl font-bold hover:bg-gray-100 px-2 transition-all">&times;</button>
    </div>

    <div class="p-8">
      <div class="text-center space-y-4">
        <div class="inline-block p-3 border-2 border-black rounded-full">
          <span class="text-2xl font-bold">!</span>
        </div>
        <p class="text-sm font-medium leading-relaxed">
          This action will delete the data permanently. <br>
          <span class="font-bold uppercase tracking-widest text-xs">Continue?</span>
        </p>
      </div>
    </div>

    <div class="p-4 border-t-2 border-black bg-gray-50 flex justify-end space-x-4">
      <button @click="$emit('close');" class="px-6 py-2 border-2 border-black font-bold text-xs uppercase hover:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
        Close
      </button>
      
      <button class="px-6 py-2 bg-black text-white border-2 border-black font-bold text-xs uppercase hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(150,0,0,0.5)] active:shadow-none">
        Yes, Remove
      </button>
    </div>

  </div>
</UModal> -->
</template>
