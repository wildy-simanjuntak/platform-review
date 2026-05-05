<script setup>
definePageMeta({
  layout: false,
});

const router = useRouter();

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center">
      <div class="mb-8 flex justify-center">
        <div class="relative">
          <UIcon
            name="i-solar-shield-warning-bold-duotone"
            class="w-32 h-32 text-red-500"
          />
          <div
            class="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg"
          >
            <UIcon
              name="i-solar-lock-password-bold"
              class="w-8 h-8 text-gray-700"
            />
          </div>
        </div>
      </div>

      <h1 class="text-6xl font-black text-gray-900 mb-2">403</h1>
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Akses Dibatasi</h2>
      <p class="text-gray-500 mb-8 leading-relaxed">
        Maaf, Anda tidak memiliki izin yang cukup untuk mengakses halaman ini.
        Silakan hubungi Admin jika Anda merasa ini adalah kesalahan.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UButton
          icon="i-solar-arrow-left-outline"
          size="lg"
          color="gray"
          variant="ghost"
          @click="goBack"
        >
          Kembali
        </UButton>

        <UButton
          icon="i-solar-home-2-outline"
          size="lg"
          color="blue"
          @click="goHome"
        >
          Ke Beranda
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animasi halus agar tidak kaku */
.max-w-md {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
