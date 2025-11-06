import { redirect } from "next/navigation";
import { EndPoint } from "@/lib/routes"; 

// Nếu người dùng truy cập trang login, chuyển hướng họ đến trang auth với view=login
export default function LoginPage() {
  redirect(EndPoint.LOGIN); 
}
