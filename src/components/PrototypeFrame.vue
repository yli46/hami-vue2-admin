<template>
  <iframe
    :src="src"
    class="proto-frame"
    frameborder="0"
    allowfullscreen
  />
</template>

<script>
export default {
  name: 'PrototypeFrame',
  props: {
    src: { type: String, required: true }
  }
}
</script>

<style scoped>
.proto-frame {
  display: block;
  width: 100%;
  /* 100vh - 50px header */
  height: calc(100vh - 50px);
  border: none;
}
</style>
