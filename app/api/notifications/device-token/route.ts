import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    return NextResponse.json(
      {
        isSuccess: true,
        data: {
          token: payload?.token ?? null,
        },
        message: "FCM token registered locally",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Register device token error:", error);
    return NextResponse.json(
      {
        isSuccess: false,
        data: null,
        message: "Cannot register FCM token",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    return NextResponse.json(
      {
        isSuccess: true,
        data: null,
        message: "FCM token removed locally",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete device token error:", error);
    return NextResponse.json(
      {
        isSuccess: false,
        data: null,
        message: "Cannot delete FCM token",
      },
      { status: 500 }
    );
  }
}
