<template>
  <v-container fluid class="pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <!-- Left: Branding -->
      <v-col
        cols="12"
        md="6"
        class="black d-flex align-center justify-center pa-8 pa-md-12"
        style="min-height: 50vh"
      >
        <div class="d-flex align-start" style="max-width: 640px">
          <v-img
            :src="GITLAB_ICON"
            contain
            max-width="80"
            max-height="80"
            class="flex-shrink-0 mr-4"
          />
          <div class="pt-1">
            <h1 class="white--text font-weight-bold mb-0 display-1">
              GitLab Issue Tracker
            </h1>
            <p
              class="grey--text text--lighten-1 mt-4 mb-0 title font-weight-regular"
            >
              เชื่อมต่อกับ GitLab เพื่อติดตามและจัดการ<br />ปัญหาทั้งหมด
            </p>
          </div>
        </div>
      </v-col>

      <!-- Right: Form -->
      <v-col
        cols="12"
        md="6"
        class="white d-flex align-center justify-center pa-8"
        style="min-height: 50vh"
      >
        <v-form @submit.prevent="login" style="width: 100%; max-width: 400px">
          <div class="text-h5 font-weight-bold mb-1">เข้าสู่ระบบ</div>
          <div class="body-1 grey--text mb-6">ยินดีต้อนรับกลับมา</div>

          <v-text-field
            v-model="username"
            label="Username"
            outlined
            dense
            required
            prepend-inner-icon="mdi-account-outline"
            class="mb-1"
          />
          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            required
            prepend-inner-icon="mdi-lock-outline"
            :append-icon="
              showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            class="mb-2"
            @click:append="showPassword = !showPassword"
          />

          <v-alert v-if="errorMessage" type="error" dense class="mb-3">
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            block
            large
            depressed
            color="#fc6d26"
            class="white--text text-none rounded-lg mb-4"
          >
            <span class="subtitle-1 font-weight-bold">เข้าสู่ระบบ</span>
          </v-btn>

          <v-row align="center" class="mb-4" no-gutters>
            <v-col><v-divider /></v-col>
            <v-col cols="auto" class="px-3 caption grey--text">หรือ</v-col>
            <v-col><v-divider /></v-col>
          </v-row>

          <v-btn
            block
            large
            depressed
            outlined
            color="#fc6d26"
            class="text-none rounded-lg"
            @click="openGitlabDialog"
          >
            <v-avatar size="22" class="mr-2">
              <v-img :src="GITLAB_ICON" contain />
            </v-avatar>
            <span
              class="subtitle-1 font-weight-bold orange--text text--darken-1"
            >
              เข้าสู่ระบบด้วย GitLab
            </span>
          </v-btn>
        </v-form>
      </v-col>
    </v-row>

    <!-- Dialog: Setup GitLab OAuth -->
    <v-dialog v-model="gitlabDialog" max-width="480" persistent>
      <v-card class="pa-2">
        <v-card-title class="text-h6 font-weight-bold">
          <v-avatar size="24" class="mr-2">
            <v-img :src="GITLAB_ICON" contain />
          </v-avatar>
          ตั้งค่า GitLab OAuth App
        </v-card-title>

        <v-card-subtitle class="mt-1">
          กรอกข้อมูล OAuth App จาก GitLab ของคุณ
          <span class="orange--text font-weight-medium"
            >โดย Username ต้องตรงกับบัญชี GitLab</span
          >
          <div class="mt-2 d-flex align-center flex-wrap" style="gap: 16px">
            <a
              href="https://gitlab.com/-/profile/applications"
              target="_blank"
              class="orange--text text-decoration-none d-flex align-center"
            >
              <v-icon small color="orange" class="mr-1">mdi-open-in-new</v-icon>
              สร้าง GitLab OAuth App ได้ที่นี่
            </a>
            <nuxt-link
              to="/doc/gitlab-token"
              target="_blank"
              class="blue--text text-decoration-none d-flex align-center"
            >
              <v-icon small color="blue" class="mr-1"
                >mdi-help-circle-outline</v-icon
              >
              ดูวิธีสร้างและเปิดใช้งาน
            </nuxt-link>
          </div>
        </v-card-subtitle>

        <v-card-text>
          <v-text-field
            v-model="gitlabForm.username"
            label="Username"
            outlined
            dense
            prepend-inner-icon="mdi-account-outline"
            hint="ต้องใช้ Username เดียวกับบัญชี GitLab ของคุณ"
            persistent-hint
            class="mb-4"
          />
          <v-text-field
            v-model="gitlabForm.password"
            label="Password"
            :type="showGitlabPassword ? 'text' : 'password'"
            outlined
            dense
            prepend-inner-icon="mdi-lock-outline"
            :append-icon="
              showGitlabPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            class="mb-1"
            @click:append="showGitlabPassword = !showGitlabPassword"
          />
          <v-text-field
            v-model="gitlabForm.clientId"
            label="Application ID (Client ID)"
            outlined
            dense
            prepend-inner-icon="mdi-identifier"
            class="mb-1"
          />
          <v-text-field
            v-model="gitlabForm.clientSecret"
            label="Secret (Client Secret)"
            :type="showSecret ? 'text' : 'password'"
            outlined
            dense
            prepend-inner-icon="mdi-key-outline"
            :append-icon="
              showSecret ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            @click:append="showSecret = !showSecret"
          />

          <v-alert v-if="gitlabError" type="error" dense class="mt-2">
            {{ gitlabError }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-btn text @click="gitlabDialog = false">ยกเลิก</v-btn>
          <v-spacer />
          <v-btn
            depressed
            color="#fc6d26"
            class="white--text text-none"
            :loading="gitlabLoading"
            @click="setupAndLoginGitlab"
          >
            เชื่อมต่อ GitLab
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
const GITLAB_ICON =
  "https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

export default {
  name: "LoginPage",
  layout: "blank",
  data: () => ({
    GITLAB_ICON,
    username: "",
    password: "",
    showPassword: false,
    errorMessage: "",

    // gitlab dialog
    gitlabDialog: false,
    gitlabLoading: false,
    gitlabError: "",
    showSecret: false,
    showGitlabPassword: false,
    gitlabForm: {
      username: "",
      password: "",
      clientId: "",
      clientSecret: "",
    },
  }),
  mounted() {
    // ถ้าพบว่ามี token ใน localStorage แปลว่าล็อกอินค้างไว้แล้ว ให้ข้ามไปหน้า project เลย
    const token = localStorage.getItem("token");
    if (token) {
      this.$router.replace("/project");
    }
  },
  methods: {
    // ล็อกอินด้วย username/password แล้วไปหน้า project เมื่อสำเร็จ
    async login() {
      this.errorMessage = "";
      try {
        const result = await this.$store.dispatch("auth/password", {
          username: this.username,
          password: this.password,
        });
        if (result?.success) {
          this.$swal.fire({
            title: "เข้าสู่ระบบสำเร็จ",
            text: `ยินดีต้อนรับคุณ ${this.username}`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          this.$router.push("/project");
        } else {
          this.errorMessage = result?.message || "เข้าสู่ระบบไม่สำเร็จ";
        }
      } catch (error) {
        this.errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่";
      }
    },

    // เปิด dialog สำหรับตั้งค่า GitLab OAuth ด้วยข้อมูลที่กรอกไว้
    openGitlabDialog() {
      // ถ้ากรอก username ในฟอร์มหลักไว้แล้ว ให้เอาไปใส่ใน dialog เลย
      this.gitlabForm.username = this.username || "";
      this.gitlabForm.password = this.password || "";
      this.gitlabError = "";
      this.gitlabDialog = true;
    },

    // ลงทะเบียนข้อมูล GitLab แล้วส่งต่อไป flow OAuth ของ backend
    async setupAndLoginGitlab() {
      const { username, password, clientId, clientSecret } = this.gitlabForm;

      if (!username || !clientId || !clientSecret) {
        this.gitlabError = "กรุณากรอกข้อมูลให้ครบถ้วน";
        return;
      }

      this.gitlabLoading = true;
      this.gitlabError = "";

      try {
        // 1. register — สร้าง user + save credentials → ได้ JWT กลับมา
        const result = await this.$store.dispatch("auth/registerGitlab", {
          username,
          password,
          clientId,
          clientSecret,
        });
        if (!result?.success) {
          throw new Error(result?.message || "Register failed");
        }
        const data = result.data || {};

        const token = data.token;

        // 2. redirect ไป GitLab OAuth พร้อม JWT ใน header ไม่ได้
        //    แต่ backend ต้องการ JWT → เก็บ token ก่อน แล้ว redirect ผ่าน backend
        //    โดยส่ง token เป็น query param ให้ backend ดึงไปใช้
        window.location.href = `${API_BASE_URL}/auth/gitlab/connect?token=${token}`;
      } catch (error) {
        this.gitlabError =
          error.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
        this.gitlabLoading = false;
      }
    },
  },
  head() {
    return { title: "เข้าสู่ระบบ" };
  },
};
</script>
