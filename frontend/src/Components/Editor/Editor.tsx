import React, { useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder = "Введите текст...",
  className = "",
}) => {
  const quillRef = useRef<ReactQuill | null>(null);

  const isValidHttpUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const normalizeVideoUrl = (url: string) => {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
    );

    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

    if (vimeoMatch?.[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  const insertImageByUrl = () => {
    const url = window.prompt("Введите URL изображения");

    if (!url) return;

    if (!isValidHttpUrl(url)) {
      alert("Введите корректный URL изображения");
      return;
    }

    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection(true);

    if (!editor || !range) return;

    editor.insertEmbed(range.index, "image", url);
    editor.setSelection(range.index + 1);
  };

  const insertVideoByUrl = () => {
    const url = window.prompt(
      "Введите URL видео: YouTube, Vimeo или прямую ссылку .mp4/.webm/.ogg",
    );

    if (!url) return;

    if (!isValidHttpUrl(url)) {
      alert("Введите корректный URL видео");
      return;
    }

    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection(true);

    if (!editor || !range) return;

    const normalizedUrl = normalizeVideoUrl(url);
    const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedUrl);

    if (isDirectVideo) {
      editor.clipboard.dangerouslyPasteHTML(
        range.index,
        `<p>
          <video controls style="max-width:100%; height:auto;" src="${normalizedUrl}"></video>
        </p>`,
      );

      editor.setSelection(range.index + 1);
      return;
    }

    editor.insertEmbed(range.index, "video", normalizedUrl);
    editor.setSelection(range.index + 1);
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, false] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [
            { align: "" },
            { align: "center" },
            { align: "right" },
            { align: "justify" },
          ],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: insertImageByUrl,
          video: insertVideoByUrl,
        },
      },
    }),
    [],
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
  ];

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default Editor;
