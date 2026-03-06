<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

navigateTo({ path: '/', query: { tab: 'seniority' } }, { replace: true });
</script>
