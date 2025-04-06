<script setup lang="ts">
import SvgTo3D from '~/components/SvgTo3D.vue'

defineOptions({
  name: 'IndexPage',
})
</script>

<template>
  <div>
    <SvgTo3D />
    <TheFooter bottom-10 right-10 fixed />
  </div>
</template>
