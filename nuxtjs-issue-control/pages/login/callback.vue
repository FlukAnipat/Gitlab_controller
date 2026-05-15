<template>
  <v-container fluid class="fill-height d-flex align-center justify-center">
    <div class="text-center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
        class="mb-4"
      />
      <p class="white--text text-h6">
        {{ message }}
      </p>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "LoginCallbackPage",
  layout: "blank",
  data() {
    return {
      message: "กำลังเข้าสู่ระบบ...",
    };
  },
  mounted() {
    // เรียก handler ทันทีเมื่อหน้า callback โหลดเสร็จ
    this.handleCallback();
  },
  methods: {
    // อ่าน token/user จาก query แล้วบันทึกการล็อกอินกลับเข้า store
    async handleCallback() {
      try {
        const token = this.$route.query.token;
        const user = this.$route.query.user;

        if (!token) {
          this.message = "เข้าสู่ระบบไม่สำเร็จ";
          setTimeout(() => {
            this.$router.push("/login");
          }, 2000);
          return;
        }

        let userData = null;
        if (user) {
          try {
            userData = JSON.parse(decodeURIComponent(user));
          } catch (e) {
            console.error("เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูลผู้ใช้:", e);
          }
        }

        await this.$store.dispatch("auth/handleCallback", {
          token,
          user: userData,
        });

        this.$router.push("/project");
      } catch (error) {
        this.message = "เข้าสู่ระบบไม่สำเร็จ";
        console.error("จัดการ callback ไม่สำเร็จ", error);
      }
    },
  },
};
</script>
