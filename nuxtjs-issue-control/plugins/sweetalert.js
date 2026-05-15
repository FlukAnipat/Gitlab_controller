import Swal from "sweetalert2";

// inject SweetAlert2 เข้า Nuxt context เพื่อให้เรียกผ่าน this.$swal ได้ทุกหน้า
export default (context, inject) => {
  inject("swal", Swal);
};
