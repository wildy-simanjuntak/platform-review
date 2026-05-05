<script setup>
 const { data } = useAuth(); 
definePageMeta({
    middleware: ["role"],
    allowedRoles: ["programmer"],
});
</script>

<template>
    <userUpload />
</template>