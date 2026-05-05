<script setup>

definePageMeta({
    middleware: ["role"],
    allowedRoles: ["admin"],
});
</script>


<template>
    <Content />
</template>