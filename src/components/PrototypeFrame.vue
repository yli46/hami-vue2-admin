<template>
  <div class="proto-frame-wrap">
    <iframe
      :src="src"
      class="proto-frame"
      frameborder="0"
      allowfullscreen
    />
  </div>
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
.proto-frame-wrap {
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}
.proto-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
