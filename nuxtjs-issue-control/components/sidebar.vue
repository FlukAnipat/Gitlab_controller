<template>
  <v-navigation-drawer
    v-if="!shouldHideSidebar"
    v-model="drawer"
    app
    permanent
    dark
    color="#16222A"
    width="220"
    class="sidebar-custom"
  >
    <!-- Header -->
    <div class="sidebar-header">
      <div class="logo-box">
        <v-img
          src="https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg"
          contain
          width="34"
          height="34"
        />
      </div>
      <div>
        <p class="header-title">GitLab Issue Tracker</p>
      </div>
    </div>

    <!-- Nav Section -->
    <div class="nav-section">
      <p class="nav-label">Navigation</p>

      <v-list flat dense class="pa-0">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          active-class="nav-item--active"
          class="nav-item"
        >
          <v-list-item-icon class="nav-icon">
            <v-icon size="16">{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="nav-item-title">{{
              item.label
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </div>

    <!-- Footer -->
    <template v-slot:append>
      <div class="sidebar-footer">
        <!-- Connection Status -->
        <div class="status-box">
          <span class="status-dot"></span>
          <span class="status-text">{{ username }} เชื่อมต่อแล้ว</span>
        </div>

        <!-- Logout -->
        <v-btn block depressed class="logout-btn" @click="logout">
          <v-icon left size="15">mdi-logout-variant</v-icon>
          ออกจากระบบ
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: "Sidebar",
  data() {
    return {
      drawer: true,
    };
  },
  computed: {
    shouldHideSidebar() {
      return this.$route.path === "/login";
    },
    username() {
      return (
        this.$store.getters["auth/currentUser"]?.username || "ไม่ได้เข้าสู่ระบบ"
      );
    },
    currentProject() {
      return this.$store.getters["project/currentProject"];
    },
    navItems() {
      return [
        { to: "/project", icon: "mdi-view-grid", label: "Projects" },
        { to: "/issue/allIssue", icon: "mdi-view-grid", label: "All Issues" },
      ];
    },
  },
  methods: {
    async logout() {
      const result = await this.$swal.fire({
        title: "คุณแน่ใจหรือไม่?",
        text: "คุณต้องการออกจากระบบใช่หรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "ใช่, ออกจากระบบ",
        cancelButtonText: "ยกเลิก",
      });

      if (result.isConfirmed) {
        try {
          await this.$store.dispatch("auth/logout");
          this.$swal.fire({
            title: "ออกจากระบบสำเร็จ",
            text: "ไว้พบกันใหม่!",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          this.$router.push("/login");
        } catch (error) {
          console.error("Logout error:", error);
        }
      }
    },
  },
};
</script>

<style scoped>
.sidebar-custom {
  border-right: none !important;
}

/* ── Header ── */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.logo-box {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

.header-sub {
  margin: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.2;
}

/* ── Nav ── */
.nav-section {
  padding: 12px;
}

.nav-label {
  margin: 0 0 6px 8px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-item {
  border-radius: 8px !important;
  margin-bottom: 2px;
  min-height: 36px !important;
  padding: 0 12px !important;
}

.nav-item::before {
  opacity: 0 !important;
}

.nav-item--active {
  background-color: #009688 !important;
}

.nav-item--active .nav-item-title,
.nav-item--active .v-icon {
  color: #fff !important;
}

.nav-icon {
  margin-right: 10px !important;
  min-width: unset !important;
}

.nav-item-title {
  font-size: 13px !important;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0;
}

/* ── Footer ── */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e676;
  flex-shrink: 0;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  background: rgba(198, 40, 40, 0.15) !important;
  border: 1px solid rgba(198, 40, 40, 0.3) !important;
  border-radius: 8px !important;
  color: #ef9a9a !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  height: 36px !important;
  justify-content: flex-start !important;
  padding: 0 12px !important;
}
</style>
