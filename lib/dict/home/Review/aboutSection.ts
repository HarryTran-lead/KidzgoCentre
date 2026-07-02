export const aboutSection = {
  vi: {
    title: {
      leading: "Thông tin",
      accent: "trung tâm",
    },
    quote: {
      text: "Làm thế nào để mỗi học viên không chỉ học tiếng Anh, mà còn tự tin sử dụng tiếng Anh trong đời sống?",
      source: "- Ý tưởng khởi nguồn của Rex",
    },
    highlights: {
      foundation: {
        title: "Nền tảng vững chắc",
        desc: "Học chắc từ gốc, ứng dụng ngay.",
      },
      communication: {
        title: "Phản xạ giao tiếp tự nhiên",
        desc: "Nghe nói tự nhiên, phản xạ nhanh.",
      },
      support: {
        title: "Đồng hành sát sao",
        desc: "Theo sát tiến bộ, điều chỉnh kịp thời.",
      },
    },
    body: [
      [
        {
          text: "Rex được xây dựng với mong muốn tạo ra một môi trường học tiếng Anh gần gũi, nơi trẻ em và học sinh có thể bắt đầu từ ",
        },
        { text: "nền tảng vững chắc", highlight: true },
        { text: ", luyện " },
        { text: "phản xạ giao tiếp tự nhiên", highlight: true },
        { text: " và dần hình thành " },
        { text: "sự tự tin", highlight: true },
        { text: " khi sử dụng ngôn ngữ." },
      ],
      [
        { text: "Thay vì chỉ tập trung vào điểm số, Rex chú trọng " },
        { text: "hành trình tiến bộ", highlight: true },
        { text: " của từng học viên. Giáo viên " },
        { text: "đồng hành sát sao", highlight: true },
        {
          text: ", phụ huynh dễ dàng theo dõi kết quả, còn học viên được khuyến khích thực hành tiếng Anh qua hoạt động, trò chơi và ",
        },
        { text: "tình huống thực tế", highlight: true },
        { text: "." },
      ],
    ],
    contact: {
      eyebrow: "Liên hệ Rex",
      title: "Kết nối với trung tâm",
      addressLabel: "Địa chỉ",
      addressValue:
        "Số 23 đường T2, Vinhomes Grand Park, phường Long Bình, TP. HCM",
      phoneLabel: "Số điện thoại",
      phoneValue: "0867 405 801",
      emailLabel: "Email",
      emailValue: "Tearexenglish@gmail.com",
      fanpageLabel: "Fanpage Facebook",
      fanpageName: "Rex English Center",
    },
  },
  en: {
    title: {
      leading: "About the",
      accent: "center",
    },
    quote: {
      text: "How can every learner do more than just study English and also feel confident using it in daily life?",
      source: "- The founding idea behind Rex",
    },
    highlights: {
      foundation: {
        title: "Strong foundations",
        desc: "Build core skills well and use them right away.",
      },
      communication: {
        title: "Natural communication reflexes",
        desc: "Listen and speak more naturally, with faster responses.",
      },
      support: {
        title: "Close guidance",
        desc: "Track progress closely and adjust in time.",
      },
    },
    body: [
      [
        {
          text: "Rex was built to create a friendly English learning environment where children and students can start with ",
        },
        { text: "strong foundations", highlight: true },
        { text: ", develop " },
        { text: "natural communication reflexes", highlight: true },
        { text: ", and gradually build " },
        { text: "confidence", highlight: true },
        { text: " in using the language." },
      ],
      [
        { text: "Instead of focusing only on scores, Rex values each learner's " },
        { text: "progress journey", highlight: true },
        { text: ". Teachers provide " },
        { text: "close guidance", highlight: true },
        {
          text: ", parents can easily follow results, and learners are encouraged to practice English through activities, games, and ",
        },
        { text: "real-life situations", highlight: true },
        { text: "." },
      ],
    ],
    contact: {
      eyebrow: "Contact Rex",
      title: "Connect with the center",
      addressLabel: "Address",
      addressValue:
        "No. 23, T2 Street, Vinhomes Grand Park, Long Binh Ward, Ho Chi Minh City",
      phoneLabel: "Phone",
      phoneValue: "0867 405 801",
      emailLabel: "Email",
      emailValue: "Tearexenglish@gmail.com",
      fanpageLabel: "Facebook fanpage",
      fanpageName: "Rex English Center",
    },
  },
} as const;
