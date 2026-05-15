export default {
  // เตรียม state สำหรับเก็บ label แยกตามประเภทที่ใช้ในแถบ bulk action
  data() {
    return {
      bulkLabelsByType: { 0: [], 1: [], 2: [], 3: [] },
    };
  },

  methods: {
    // โหลด label ตาม type ทั้ง 4 กลุ่มพร้อมกันเพื่อนำไปใช้กับเมนู bulk action
    async loadBulkLabelsByType() {
      try {
        const [t0, t1, t2, t3] = await Promise.all([
          this.$store.dispatch("labels/getLabelsName", { type: 0 }),
          this.$store.dispatch("labels/getLabelsName", { type: 1 }),
          this.$store.dispatch("labels/getLabelsName", { type: 2 }),
          this.$store.dispatch("labels/getLabelsName", { type: 3 }),
        ]);
        this.bulkLabelsByType = {
          0: t0.data || [],
          1: t1.data || [],
          2: t2.data || [],
          3: t3.data || [],
        };
      } catch (error) {
        console.error("โหลด label types ไม่สำเร็จ", error);
      }
    },
  },
};
