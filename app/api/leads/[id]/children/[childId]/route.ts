import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { BACKEND_LEAD_ENDPOINTS } from "@/constants/apiURL";
import { UpdateLeadChildRequest } from "@/types/lead";

/**
 * PUT /api/leads/[id]/children/[childId]
 * Update a child's information
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; childId: string }> }
) {
  try {
    const { id, childId } = await context.params;
    const authHeader = request.headers.get("Authorization");
    const body: UpdateLeadChildRequest = await request.json();

    const response = await axios.put(
      BACKEND_LEAD_ENDPOINTS.UPDATE_CHILD(id, childId),
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
    console.error("Error updating lead child:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "Failed to update child",
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * DELETE /api/leads/[id]/children/[childId]
 * Delete a child from a lead
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; childId: string }> }
) {
  try {
    const { id, childId } = await context.params;
    const authHeader = request.headers.get("Authorization");

    const response = await axios.delete(
      BACKEND_LEAD_ENDPOINTS.DELETE_CHILD(id, childId),
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error deleting lead child:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "Failed to delete child",
      },
      { status: error.response?.status || 500 }
    );
  }
}
