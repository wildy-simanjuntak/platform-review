<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useCommentStore } from '@/stores/comment';

const route = useRoute();
const config = useRuntimeConfig();
const commentStore = useCommentStore();

const commentText = ref('');
const isLoading = ref(false);
const moduleId = route.params.id;
const projectName = route.params.projectName;

const fileInput = ref(null);
const imagePreview = ref(null);
const selectedFile = ref(null);

const isPopupOpen = ref(false);
const selectedImageUrl = ref('');

const scrollContainer = ref(null);

const scrollToBottom = async () => {
    await nextTick();
    if (scrollContainer.value) {
        scrollContainer.value.scrollTo({
            top: scrollContainer.value.scrollHeight,
            behavior: 'smooth'
        });
    }
};

watch(() => commentStore.comments, () => {
    scrollToBottom();
}, { deep: true });

onMounted(async () => {
    await commentStore.getComments(moduleId);
    commentStore.listenComments(moduleId);
    scrollToBottom();
});

onUnmounted(() => {
    commentStore.unlistenComments(moduleId);
});

const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
        alert('Max 2MB');
        return;
    }

    selectedFile.value = file; 

    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.value = event.target.result;
    };
    reader.readAsDataURL(file);
};

const removeImage = () => {
    imagePreview.value = null;
    selectedFile.value = null; 
    if (fileInput.value) fileInput.value.value = '';
};

const openPopup = (url) => {
    selectedImageUrl.value = url;
    isPopupOpen.value = true;
};

const closePopup = () => {
    isPopupOpen.value = false;
    selectedImageUrl.value = '';
};

const submitComment = async () => {
    if (!commentText.value.trim() && !selectedFile.value) return;
    
    isLoading.value = true;
    try {
        await commentStore.sendComment(moduleId, commentText.value, selectedFile.value);
        commentText.value = '';
        removeImage();
    } finally {
        isLoading.value = false;
    }
};

const formatDate = (date) => new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
</script>

<template>
    <div class="flex flex-col lg:flex-row w-full h-screen bg-gray-100 overflow-hidden">
        <div class="flex-grow flex flex-col bg-white">
            <div class="p-4 border-b flex justify-between items-center">
                <h1 class="font-bold text-gray-700 uppercase">Content: {{ route.params.moduleName }}</h1>
            </div>
            <div class="flex-grow relative bg-slate-200">
                <iframe :src="`${config.public.laragon}/digital-content/${projectName}/${route.params.moduleName}/index.php`" class="absolute inset-0 w-full h-full border-none" />
            </div>
        </div>

        <div class="w-full lg:w-[400px] flex flex-col bg-white border-l shadow-xl">
            <div class="p-4 border-b bg-gray-50 font-semibold text-gray-700">Feedback & Diskusi</div>

            <div ref="scrollContainer" class="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                <div v-for="item in commentStore.comments" :key="item._id" class="bg-white p-3 rounded-2xl border shadow-sm transition-all">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-[11px] text-blue-600 uppercase">{{ item.user?.username || 'Aktor' }}</span>
                        <span class="text-[10px] text-gray-400">{{ formatDate(item.createdAt) }}</span>
                    </div>
                    
                    <div v-if="item.image" class="mb-2 rounded-xl overflow-hidden border bg-slate-50">
                        <img :src="`${config.public.laragon}/${item.image}`" class="w-full h-auto max-h-64 object-contain cursor-zoom-in hover:opacity-90" @click="openPopup(item.image)" />
                    </div>

                    <p v-if="item.text" class="text-sm text-gray-600 leading-relaxed font-medium">{{ item.text }}</p>
                </div>
            </div>

            <div class="p-4 border-t bg-white relative">
                <div v-if="imagePreview" class="mb-3 relative inline-block">
                    <img :src="imagePreview" class="w-24 h-24 object-cover rounded-xl border-2 border-blue-500 shadow-lg" />
                    <button @click="removeImage" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L12 12M6 6l12 12" /></svg>
                    </button>
                </div>

                <form @submit.prevent="submitComment" class="flex flex-col gap-3">
                    <textarea v-model="commentText" rows="2" class="w-full p-3 text-sm border rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" placeholder="Ketik feedback revisi..."></textarea>
                    
                    <div class="flex gap-2">
                        <input type="file" ref="fileInput" @change="onFileChange" accept="image/*" class="hidden" />
                        <button type="button" @click="fileInput.click()" class="p-2.5 border rounded-xl hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button type="submit" :disabled="isLoading || (!commentText.trim() && !selectedFile)" class="flex-grow bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md active:scale-95">
                            {{ isLoading ? 'MENGIRIM...' : 'KIRIM FEEDBACK' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <Transition name="fade">
            <div v-if="isPopupOpen" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" @click.self="closePopup">
                <button @click="closePopup" class="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div class="relative max-w-5xl w-full h-full flex items-center justify-center">
                    <img :src="selectedImageUrl" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" @click.stop />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>