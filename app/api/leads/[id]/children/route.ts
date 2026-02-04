import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { BACKEND_LEAD_ENDPOINTS } from "@/constants/apiURL";
import { CreateLeadChildRequest } from "@/types/lead";

/**
 * GET /api/leads/[id]/children
 * Get all children for a specific lead
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get("Authorization");

    const response = await axios.get(
      BACKEND_LEAD_ENDPOINTS.GET_CHILDREN(id),
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error fetching lead children:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "Failed to fetch children",
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * POST /api/leads/[id]/children
 * Create a new child for a lead
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get("Authorization");
    const body: CreateLeadChildRequest = await request.json();

    const response = await axios.post(
      BACKEND_LEAD_ENDPOINTS.CREATE_CHILD(id),
      body,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error creating lead child:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "Failed to create child",
      },
      { status: error.response?.status || 500 }
    );
  }
}
