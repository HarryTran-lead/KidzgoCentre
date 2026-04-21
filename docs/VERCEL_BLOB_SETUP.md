# Vercel Blob Setup (Client-side Upload)

Tài liệu này mô tả cách bật upload file lớn bằng Vercel Blob theo mô hình upload trực tiếp từ trình duyệt.

## 1) Cài package

```bash
npm install @vercel/blob
```

## 2) Bật Blob trên Vercel

1. Vào Vercel Dashboard -> Storage -> Blob -> Create.
2. Copy biến môi trường BLOB_READ_WRITE_TOKEN vào project environment.

## 3) Cấu hình biến môi trường

Thêm các biến sau:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
NEXT_PUBLIC_ENABLE_VERCEL_BLOB=true
NEXT_PUBLIC_DIRECT_UPLOAD_MIN_MB=0
BLOB_MAX_UPLOAD_BYTES=209715200
```

Giải thích:
- NEXT_PUBLIC_ENABLE_VERCEL_BLOB=true: bật direct upload bằng Blob.
- NEXT_PUBLIC_DIRECT_UPLOAD_MIN_MB=0: file có dung lượng từ ngưỡng này trở lên sẽ đi Blob direct upload. Đặt 0 để dùng Blob cho tất cả file.
- BLOB_MAX_UPLOAD_BYTES: kích thước tối đa được cấp token upload.

## 4) Luồng đã được tích hợp trong codebase

- API cấp token upload: POST /api/files/blob/upload
  - File: app/api/files/blob/upload/route.ts
  - Có kiểm tra bearer token thông qua backend /me.
- Service upload file:
  - File: lib/api/fileService.ts
  - Hàm uploadFile(...):
    - Ưu tiên Blob direct upload khi bật cờ.
    - Nếu Blob thất bại sẽ fallback về luồng cũ /api/files/upload.

## 5) Tương thích ngược

Luồng cũ không bị phá:
- Khi tắt Blob (NEXT_PUBLIC_ENABLE_VERCEL_BLOB=false) -> upload đi qua /api/files/upload như cũ.
- Khi bật Blob -> Browser upload trực tiếp lên Vercel Blob, tránh lỗi 413 Payload Too Large trên serverless proxy.

## 6) Lưu ý bảo mật

- API token route yêu cầu Authorization: Bearer token.
- Chỉ cho phép danh sách MIME type phổ biến (image/video/audio/pdf/doc/xlsx/ppt/zip/text).
- Có thể siết chặt MIME hoặc max size theo từng module nghiệp vụ.
