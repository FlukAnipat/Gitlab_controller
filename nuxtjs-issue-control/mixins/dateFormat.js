export default {
  methods: {
    // แปลงวันที่เป็นรูปแบบภาษาไทยแบบย่อ พร้อมปี พ.ศ.
    formatDateThai(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const day = date.getDate();
      const monthNames = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    },

    // แปลงวันที่เป็นรูปแบบ dd/mm/yyyy โดยใช้ปี พ.ศ. สำหรับแสดงในช่อง input
    toDisplayDate(value) {
      if (!value) return "";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "";
      const dd = date.getDate().toString().padStart(2, "0");
      const mm = (date.getMonth() + 1).toString().padStart(2, "0");
      const yyyy = date.getFullYear() + 543;
      return `${dd}/${mm}/${yyyy}`;
    },
  },
};
