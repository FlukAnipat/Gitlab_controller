<template>
  <v-app-bar app flat color="white" height="56" class="navbar-custom">
    <!-- Project Nav Items -->
    <div
      v-if="currentProject && !isProjectIndex && !isIssueAllPage"
      class="d-flex align-center ml-4"
    >
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        text
        exact
        small
        class="nav-btn-top text-capitalize mx-1"
        active-class="nav-btn-active"
      >
        <v-icon left size="18">{{ item.icon }}</v-icon>
        {{ item.label }}
      </v-btn>
    </div>

    <!-- User Avatar -->
    <v-spacer></v-spacer>
    <v-avatar size="32" color="#009688" class="user-avatar">
      <img v-if="user && user.avatarUrl" :src="user.avatarUrl" alt="Avatar" />
      <span v-else class="user-initial">{{ userInitial }}</span>
    </v-avatar>
  </v-app-bar>
</template>

<script>
export default {
  name: "Navbar",
  computed: {
    user() {
      return this.$store.getters["auth/currentUser"];
    },
    userInitial() {
      return (
        this.$store.getters["auth/currentUser"]?.username
          ?.charAt(0)
          .toUpperCase() || "U"
      );
    },
    currentProject() {
      return this.$store.getters["project/currentProject"];
    },
    isProjectIndex() {
      return (
        this.$route.path === "/project" || this.$route.path === "/project/"
      );
    },
    isIssueAllPage() {
      return this.$route.path === "/issue/allIssue";
    },
    navItems() {
      return [
        { to: "/product", icon: "mdi-cube-outline", label: "Product" },
        { to: "/issue", icon: "mdi-alert-circle-outline", label: "Issue" },
      ];
    },
  },
};
</script>

<style scoped>
.navbar-custom {
  border-bottom: 1px solid #e5e7eb !important;
}

.nav-btn-top {
  font-weight: 600 !important;
  color: #6b7280 !important;
}

.nav-btn-active {
  color: #009688 !important;
  background-color: rgba(0, 150, 136, 0.05) !important;
}

.user-avatar {
  cursor: pointer;
}

.user-initial {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
</style>
