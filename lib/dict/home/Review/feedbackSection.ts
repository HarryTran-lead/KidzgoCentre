export const feedbackSection = {
  vi: {
    title: {
      leading: "Hình ảnh",
      accent: "feedback",
    },
    description:
      "Những đoạn hội thoại và phản hồi thực tế từ phụ huynh sau quá trình đồng hành cùng Rex.",
    spotlight: {
      badge: "Phản hồi thực tế",
      title: "Chia sẻ chân thật từ phụ huynh",
      desc: "Những hình ảnh dưới đây giúp phụ huynh mới cảm nhận rõ hơn về tiến bộ, sự gắn kết và trải nghiệm học tập tại trung tâm.",
    },
    imageBadge: "Phụ huynh chia sẻ",
    imageFallback: "Ảnh feedback đang chờ cập nhật",
    ui: {
      openImage: "Mở ảnh feedback",
      zoomHint: "Bấm ảnh để xem lớn",
      modalTitle: "Hình ảnh",
      modalGuide: "Cuộn hoặc double-click để zoom, kéo để xem chi tiết",
      closeImage: "Đóng ảnh",
      previousImage: "Ảnh trước",
      nextImage: "Ảnh tiếp theo",
      zoomOut: "Thu nhỏ",
      zoomIn: "Phóng to",
      resetZoom: "Đặt lại zoom",
    },
    items: [
      {
        src: "/image/feedback/feedback-01.jpg",
        alt: "Phụ huynh chia sẻ về tiến bộ giao tiếp tiếng Anh của bé Ruby",
        label: "Tiến bộ giao tiếp",
      },
      {
        src: "/image/feedback/feedback-02.jpg",
        alt: "Phụ huynh chia sẻ về sự hào hứng đi học và thuyết trình bằng tiếng Anh",
        label: "Hào hứng đi học",
      },
      {
        src: "/image/feedback/feedback-03.jpg",
        alt: "Phụ huynh phản hồi tích cực sau chương trình ngoại khóa của Rex",
        label: "Phản hồi ngoại khóa",
      },
      {
        src: "/image/feedback/feedback-04.jpg",
        alt: "Phụ huynh cảm ơn giáo viên vì giúp bé yêu thích học tập hơn",
        label: "Yêu thích học tập",
      },
      {
        src: "/image/feedback/feedback-05.jpg",
        alt: "Phụ huynh chia sẻ về sự tiến bộ rõ rệt của học viên trong học tập",
        label: "Tiến bộ rõ rệt",
      },
      {
        src: "/image/feedback/feedback-06.jpg",
        alt: "Phụ huynh cảm ơn trung tâm vì hỗ trợ tốt cho bé cả trong và ngoài lớp",
        label: "Gia đình an tâm",
      },
      {
        src: "/image/feedback/feedback-07.jpg",
        alt: "Phụ huynh phản hồi tích cực sau khi nhận báo cáo học tập từ giáo viên",
        label: "Báo cáo học tập",
      },
    ],
  },
  en: {
    title: {
      leading: "Parent",
      accent: "feedback",
    },
    description:
      "Real chat screenshots and parent feedback collected during the learning journey with Rex.",
    spotlight: {
      badge: "Real feedback",
      title: "Authentic parent conversations",
      desc: "These screenshots help new families quickly understand student progress, classroom connection, and the learning experience at the center.",
    },
    imageBadge: "Parent feedback",
    imageFallback: "Feedback image pending update",
    ui: {
      openImage: "Open feedback image",
      zoomHint: "Click image to enlarge",
      modalTitle: "Image",
      modalGuide: "Scroll or double-click to zoom, drag to inspect",
      closeImage: "Close image",
      previousImage: "Previous image",
      nextImage: "Next image",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      resetZoom: "Reset zoom",
    },
    items: [
      {
        src: "/image/feedback/feedback-01.jpg",
        alt: "Parent sharing Ruby's progress in English communication",
        label: "Communication progress",
      },
      {
        src: "/image/feedback/feedback-02.jpg",
        alt: "Parent sharing a child's excitement about class and English presentation",
        label: "Excited to learn",
      },
      {
        src: "/image/feedback/feedback-03.jpg",
        alt: "Positive parent feedback after Rex extracurricular activities",
        label: "Extracurricular feedback",
      },
      {
        src: "/image/feedback/feedback-04.jpg",
        alt: "Parent thanking teachers for helping the child enjoy learning",
        label: "Joyful learning",
      },
      {
        src: "/image/feedback/feedback-05.jpg",
        alt: "Parent sharing clear student improvement in learning",
        label: "Visible improvement",
      },
      {
        src: "/image/feedback/feedback-06.jpg",
        alt: "Parent thanking the center for supporting the child well in and beyond class",
        label: "Family confidence",
      },
      {
        src: "/image/feedback/feedback-07.jpg",
        alt: "Positive parent feedback after receiving a learning report from teachers",
        label: "Learning report",
      },
    ],
  },
} as const;
