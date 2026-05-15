<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    max-width="550"
    persistent
  >
    <v-card class="rounded-xl">
      <v-card-title
        class="d-flex justify-space-between align-center pt-4 px-6 pb-0"
      >
        <h2 class="text-h5 font-weight-bold">Create Label</h2>
        <v-btn icon @click="closeDialog" class="mt-n4 mr-n4">
          <v-icon size="24" color="grey darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-6 pt-6 pb-2">
        <!-- Type -->
        <div class="mb-4">
          <label class="font-weight-bold text-subtitle-2 mb-1 d-block"
            >Type</label
          >
          <v-autocomplete
            v-model="form.type"
            :items="typeOptions"
            item-text="name"
            item-value="value"
            outlined
            dense
            hide-details
            clearable
            placeholder="เลือกประเภท..."
            class="rounded-lg"
            :menu-props="{ offsetY: true }"
          />
        </div>

        <!-- Label Name -->
        <div class="mb-4">
          <label class="font-weight-bold text-subtitle-2 mb-1 d-block"
            >Label Name</label
          >
          <v-text-field
            v-model="form.name"
            outlined
            dense
            hide-details
            clearable
            placeholder="เช่น bug, feature, enhancement"
            class="rounded-lg"
            :disabled="form.type === null || form.type === undefined"
          />
        </div>

        <!-- Color -->
        <div class="mb-2">
          <label class="font-weight-bold text-subtitle-2 mb-1 d-block"
            >Color</label
          >
          <div class="d-flex align-center">
            <v-menu
              v-model="showColorPicker"
              :close-on-content-click="false"
              offset-y
            >
              <template v-slot:activator="{ on, attrs }">
                <div
                  v-bind="attrs"
                  v-on="on"
                  class="color-preview rounded-lg mr-3"
                  :style="{ backgroundColor: form.color }"
                />
              </template>
              <v-card class="pa-2">
                <v-color-picker v-model="form.color" flat />
              </v-card>
            </v-menu>
            <v-text-field
              v-model="form.color"
              outlined
              dense
              hide-details
              placeholder="#FF0000"
              class="rounded-lg flex-grow-1"
            />
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-0 d-flex justify-end">
        <v-btn
          outlined
          color="grey"
          class="rounded-lg text-none px-6 font-weight-bold"
          @click="closeDialog"
          >ยกเลิก</v-btn
        >
        <v-btn
          color="#009688"
          dark
          depressed
          class="rounded-lg text-none px-8 font-weight-bold"
          :loading="loading"
          :disabled="
            !form.name ||
            !form.color ||
            form.type === null ||
            form.type === undefined
          "
          @click="submitCreate"
          >เพิ่ม</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "CreateLabelDialog",
  props: {
    value: { type: Boolean, default: false },
  },
  data() {
    return {
      form: { name: "", color: "#009688", type: null },
      loading: false,
      showColorPicker: false,
      // ตรงกับ entity: 0=task_type, 1=project, 2=status, 3=role
      typeOptions: [
        { value: 0, name: "ประเภทงาน" },
        { value: 2, name: "Status" },
        { value: 3, name: "Role" },
      ],
    };
  },
  watch: {
    value(val) {
      if (val) this.form = { name: "", color: "#009688", type: null };
    },
  },
  methods: {
    // ปิด dialog และล้างฟอร์ม
    closeDialog() {
      this.$emit("input", false);
      this.form = { name: "", color: "#009688", type: null };
    },
    // ตรวจข้อมูลและส่งคำขอสร้าง label ใหม่
    async submitCreate() {
      const name = String(this.form.name || "").trim();
      if (
        !name ||
        !this.form.color ||
        this.form.type === null ||
        this.form.type === undefined
      )
        return;
      this.$swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => {
          this.$swal.showLoading();
        },
      });
      try {
        this.loading = true;
        const result = await this.$store.dispatch("labels/createLabel", {
          name,
          color: this.form.color,
          type: this.form.type,
        });
        if (result.success) {
          this.$emit("success", result.data);
          this.closeDialog();
          this.$swal.fire("สำเร็จ", "สร้าง Label เรียบร้อย", "success");
        } else {
          this.$swal.fire(
            "ผิดพลาด",
            "สร้าง Label ไม่สำเร็จ: " + (result.message || "Unknown error"),
            "error"
          );
        }
      } catch (error) {
        this.$swal.fire(
          "ผิดพลาด",
          "สร้าง Label ไม่สำเร็จ: " + (error.message || "Unknown error"),
          "error"
        );
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.color-preview {
  width: 40px;
  height: 40px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
