<template>
  <v-app v-if="isReady">
    <Sidebar />
    <Navbar v-if="!shouldHideNavbar" />
    <v-main>
      <v-container fluid class="pa-0">
        <nuxt />
      </v-container>
    </v-main>
  </v-app>
  <v-app v-else>
    <v-main class="grey lighten-5">
      <v-container fluid class="fill-height">
        <v-row align="center" justify="center" class="fill-height">
          <v-progress-circular indeterminate color="teal" size="32" />
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Navbar from "~/components/navbar.vue";
import Sidebar from "~/components/sidebar.vue";

export default {
  name: "DefaultLayout",
  components: { Navbar, Sidebar },
  data() {
    return {
      isReady: false,
    };
  },
  computed: {
    shouldHideNavbar() {
      return this.$route.path === "/login";
    },
  },
  mounted() {
    this.$store.dispatch("auth/checkAuth");
    this.$store.dispatch("project/initCurrentProject");

    const token = localStorage.getItem("token");
    if (!token) {
      this.$router.push("/login");
      return;
    }

    this.isReady = true;
  },
};
</script>
