import { api } from "~/plugins/axios";

// เก็บข้อมูล product และตัวกรองที่ใช้ในหน้ารายการ product
export const state = () => ({
  products: [],
  loading: false,
  userFilter: null,
  labelFilter: null,
});

export const mutations = {
  // กำหนดรายการ product ทั้งหมดใหม่ลงใน state
  SET_PRODUCTS(state, products) {
    state.products = products;
  },

  // ลบ product ออกจาก state ตาม productId ที่ส่งมา
  REMOVE_PRODUCT(state, productId) {
    state.products = state.products.filter((p) => p.id !== productId);
  },

  // อัปเดตข้อมูล product เดิมใน state ตาม id
  UPDATE_PRODUCT(state, updatedProduct) {
    const index = state.products.findIndex((p) => p.id === updatedProduct.id);
    if (index !== -1) {
      state.products.splice(index, 1, {
        ...state.products[index],
        ...updatedProduct,
      });
    }
  },

  // เพิ่ม product ใหม่ไว้ด้านบนสุดของรายการ
  ADD_PRODUCT(state, product) {
    state.products.unshift(product);
  },

  // สลับสถานะ loading ของโมดูล product
  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  // เก็บค่าตัวกรองผู้ใช้ที่เลือกไว้
  SET_USER_FILTER(state, userFilter) {
    state.userFilter = userFilter;
  },

  // เก็บค่าตัวกรอง label ที่เลือกไว้
  SET_LABEL_FILTER(state, labelFilter) {
    state.labelFilter = labelFilter;
  },
};

// ดึง product ทั้งหมด หรือเฉพาะของ project ที่ระบุจาก API
const getAllProducts = async (projectId) => {
  const res = await api.get(
    projectId ? `/product/project/${projectId}` : "/product"
  );
  return res.data?.data || res.data || [];
};

export const actions = {
  // โหลดรายการ product ของระบบหรือของ project ที่เลือก แล้วบันทึกลง state
  getProducts({ commit }, { projectId } = {}) {
    return new Promise(async (resolve) => {
      try {
        commit("SET_LOADING", true);
        const data = await getAllProducts(projectId);
        commit("SET_PRODUCTS", Array.isArray(data) ? data : []);
        resolve({ success: true, data: Array.isArray(data) ? data : [] });
      } catch (error) {
        resolve({ success: false, message: error.message, data: [] });
      } finally {
        commit("SET_LOADING", false);
      }
    });
  },

  // สร้าง product ใหม่และเพิ่มผลลัพธ์กลับเข้า state
  createProduct({ commit }, productData) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.post("/product", productData);
        if (Array.isArray(res.data)) {
          res.data.reverse().forEach((item) => commit("ADD_PRODUCT", item));
        } else {
          commit("ADD_PRODUCT", res.data);
        }
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // โคลน product ที่เลือกทีละรายการ และรวมผลลัพธ์ที่ backend สร้างกลับเข้า state
  cloneProducts({ commit }, { items, prefix, count }) {
    console.log("Store: cloneProducts called", { items, prefix, count });
    return new Promise(async (resolve) => {
      try {
        const created = [];
        for (const product of items) {
          const cloneCount = Math.max(
            1,
            Math.min(10, parseInt(product?.count ?? count) || 1)
          );
          const res = await api.post(`/product/${product.id}/clone`, {
            prefix,
            count: cloneCount,
          });
          console.log("Store: Response from backend:", res);
          console.log("Store: Response data:", res.data);

          // รองรับทั้ง response แบบใหม่ที่ห่อด้วย success/data และแบบเก่าที่คืน Product[] ตรง ๆ
          const response = res.data;
          let newProducts = [];

          if (
            response &&
            typeof response === "object" &&
            response.success !== undefined
          ) {
            if (response.success) {
              newProducts = Array.isArray(response.data) ? response.data : [];
            } else {
              console.log("Store: Backend returned success:false", response);
            }
          } else {
            newProducts = Array.isArray(response)
              ? response
              : response
              ? [response]
              : [];
          }

          console.log("Store: New products to add:", newProducts);
          newProducts.forEach((p) => {
            if (p && p.id) commit("ADD_PRODUCT", p);
          });
          created.push(...newProducts);
        }

        console.log("Store: Final result:", {
          created: created.length,
          success: created.length > 0,
        });
        resolve({ success: true, data: created, count: created.length });
      } catch (error) {
        console.log("Store: Error in cloneProducts:", error);
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
          data: [],
        });
      }
    });
  },

  // บันทึกค่าตัวกรองผู้ใช้ที่ใช้บนหน้ารายการ product
  setUserFilter({ commit }, userFilter) {
    commit("SET_USER_FILTER", userFilter);
  },

  // ดึงข้อมูล product รายตัวสำหรับใช้ในหน้ารายละเอียด
  getProductDetail(_, productId) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.get(`/product/${productId}`);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // อัปเดตสถานะเปิดหรือปิดของ product
  updateProductStatus(_, { productId, status }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.patch(`/product/${productId}`, { state: status });
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // แก้ไขข้อมูล product แล้วซิงก์ข้อมูลล่าสุดกลับเข้า state
  updateProduct({ commit }, { productId, productData }) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.patch(`/product/${productId}`, productData);
        commit("UPDATE_PRODUCT", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // ลบ product จากระบบและลบออกจาก state
  deleteProduct({ commit }, productId) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.delete(`/product/${productId}`);
        commit("REMOVE_PRODUCT", productId);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },

  // กู้ product ที่ถูกปิดให้กลับมาใช้งานได้อีกครั้ง
  restoreProduct({ commit }, productId) {
    return new Promise(async (resolve) => {
      try {
        const res = await api.get(`/product/${productId}/restore`);
        commit("UPDATE_PRODUCT", res.data);
        resolve({ success: true, data: res.data });
      } catch (error) {
        resolve({
          success: false,
          message: error.response?.data?.message || error.message,
        });
      }
    });
  },
};

export const getters = {
  // คืนรายการ product ปัจจุบันจาก state
  products: (state) => state.products,

  // คืนค่าสถานะ loading ของโมดูล product
  loading: (state) => state.loading,

  // คืนค่าตัวกรองผู้ใช้ที่กำลังใช้งาน
  userFilter: (state) => state.userFilter,

  // คืนค่าตัวกรอง label ที่กำลังใช้งาน
  labelFilter: (state) => state.labelFilter,

  // รวมรายชื่อผู้ใช้จากผู้สร้างและผู้รับผิดชอบ เพื่อใช้เป็นตัวเลือกกรอง
  uniqueUsers: (state) => {
    const users = new Set();
    (state.products || []).forEach((p) => {
      if (p.authorUsername) users.add(p.authorUsername);
      if (p.assigneeUsername) users.add(p.assigneeUsername);
    });
    return Array.from(users).sort();
  },

  // รวม label จากทุก product เพื่อใช้เป็นตัวเลือกกรองบนหน้ารายการ
  uniqueLabels: (state) => {
    const labels = new Set();
    (state.products || []).forEach((p) => {
      let l = p.labels;
      if (!l) return;
      if (typeof l === "string") {
        l = l
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (Array.isArray(l)) {
        l.forEach((x) => {
          if (x?.trim()) labels.add(x.trim());
        });
      }
    });
    return Array.from(labels).sort();
  },

  // คืนรายการ product หลังผ่านตัวกรองผู้ใช้และ label
  filteredProducts: (state) => {
    let list = state.products || [];
    if (state.userFilter?.length) {
      list = list.filter(
        (p) =>
          state.userFilter.includes(p.authorUsername) ||
          state.userFilter.includes(p.assigneeUsername)
      );
    }
    if (state.labelFilter?.length) {
      list = list.filter((p) =>
        p.labels?.some((l) => state.labelFilter.includes(l))
      );
    }
    return list;
  },
};
