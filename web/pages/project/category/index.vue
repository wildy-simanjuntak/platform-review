<script setup>

definePageMeta({
    middleware: ["role"],
    allowedRoles: ["admin"],
});
</script>


<template>
    <Category />
</template>