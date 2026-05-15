<template>
  <div />
</template>

<script>
export default {
  layout: "blank",
  // พา user ไปหน้า login ทันทีเมื่อเข้า root
  asyncData({ redirect }) {
    redirect("/login");
  },
};
</script>
