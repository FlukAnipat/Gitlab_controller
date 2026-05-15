export default {
  // Global page headers: https://go.nuxtjs.dev/config-head

  server: {
    //host: '0.0.0.0', // ต้องเป็น 0.0.0.0 เท่านั้น
    port: 4000       // พอร์ตภายใน Container    
  },

  env: {
    API_BASE_URL: process.env.API_BASE_URL,
  },

  head: {
    titleTemplate: '%s - nuxtjs-controllerissue',
    title: 'nuxtjs-controllerissue',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  css: [
    '~/assets/swal-custom.scss'
  ],

  plugins: [
    { src: '~/plugins/init-auth.js', mode: 'client' },
    '~/plugins/axios.js',
    '~/plugins/sweetalert.js',
  ],

  components: true,

  router: {
    middleware: 'auth',
  },

  buildModules: [
    '@nuxtjs/vuetify',
  ],

  modules: [],

  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: false,
      themes: {
        light: {
          primary: '#1867C5',
          accent: '#424242',
          secondary: '#FFB300',
          info: '#26A69A',
          warning: '#FFB300',
          error: '#FF5252',
          success: '#4CAF50'
        }
      }
    }
  },

  build: {
  }
}
