// สร้าง upload handler กลางสำหรับ vue2-editor เพื่อให้ทุกหน้าที่มี editor ใช้งานร่วมกันได้
export function createImageUploadHandler(axiosInstance) {
  return function imageHandler() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    // อัปโหลดรูปที่ผู้ใช้เลือก แล้วแทน placeholder ใน editor ด้วยรูปจริง
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const quill = this.quill;

      try {
        const range = quill.getSelection(true);
        quill.insertText(range.index, "กำลังอัปโหลด...", { color: "#9CA3AF" });

        const formData = new FormData();
        formData.append("file", file);
        const res = await axiosInstance.post("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        quill.deleteText(range.index, "กำลังอัปโหลด...".length);
        if (res.data?.url) {
          quill.insertEmbed(range.index, "image", res.data.url);
          quill.setSelection(range.index + 1);
        }
      } catch (error) {
        const range = quill.getSelection();
        if (range) {
          quill.deleteText(
            range.index - "กำลังอัปโหลด...".length,
            "กำลังอัปโหลด...".length
          );
        }
        console.error("Image upload failed:", error);
        alert(
          "อัปโหลดรูปภาพไม่สำเร็จ: " +
            (error.response?.data?.message || error.message)
        );
      }
    };
  };
}

// แปลง markdown พื้นฐานให้เป็น HTML สำหรับใช้ render description ที่เก็บเป็น markdown
export function markdownToHtml(text) {
  if (!text) return "";

  let html = text;

  // แปลง markdown image เป็น img tag พร้อมรองรับ width/height ที่แนบมาในรูปแบบ {width=.. height=..}
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]*)\})?/g,
    (_, alt, url, attrs) => {
      let style = "max-width:100%;";
      if (attrs) {
        const w = attrs.match(/width=(\d+)/);
        const h = attrs.match(/height=(\d+)/);
        if (w) style += `width:${w[1]}px;`;
        if (h) style += `height:${h[1]}px;`;
      }
      return `<img src="${url}" alt="${alt}" style="${style}" />`;
    }
  );

  // แปลง markdown รูปแบบพื้นฐานอื่น ๆ ให้เป็น HTML ที่แสดงผลได้ในหน้า detail
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank">$1</a>'
  );
  html = html.replace(/\n/g, "<br>");

  return html;
}
