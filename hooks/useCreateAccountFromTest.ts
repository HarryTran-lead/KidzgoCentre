import { useState } from "react";
import { getAccessToken } from "@/lib/store/authToken";
import { LEAD_ENDPOINTS } from "@/constants/apiURL";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { useToast } from "@/hooks/use-toast";
import type { PlacementTest } from "@/types/placement-test";

export interface LeadInfo {
  contactName: string;
  email: string;
  phone: string;
  branchId: string;
  branchName: string;
  children: Array<{ id: string; name: string }>;
}

export function useCreateAccountFromTest() {
  const { toast } = useToast();
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [selectedLeadInfo, setSelectedLeadInfo] = useState<LeadInfo | null>(null);

  const handleCreateAccount = async (test: PlacementTest) => {
    try {
      const token = getAccessToken();
      const leadResponse = await fetch(LEAD_ENDPOINTS.GET_BY_ID(test.leadId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (leadResponse.ok) {
        const leadData = await leadResponse.json();
        const lead = leadData.data || leadData;

        let children: Array<{ id: string; name: string }> = [];
        try {
          const childrenResponse = await fetch(LEAD_ENDPOINTS.GET_CHILDREN(test.leadId), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json();
            const arr = childrenData.data || childrenData || [];
            children = arr.map((c: any) => ({ id: c.id, name: c.childName || c.name || "N/A" }));
          }
        } catch (e) {
          console.warn("Could not fetch lead children:", e);
        }

        setSelectedLeadInfo({
          contactName: lead.contactName || lead.fullName || "",
          email: lead.email || "",
          phone: lead.phone || "",
          branchId: lead.branchPreference || "",
          branchName: lead.branchPreferenceName || lead.branchPreference || "",
          children,
        });
        setIsCreateAccountModalOpen(true);
      } else {
        const payload = await leadResponse.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: getDomainErrorMessage(
            { response: { status: leadResponse.status, data: payload } },
            "Không thể lấy thông tin lead",
          ),
        });
      }
    } catch (error) {
      console.error("Error fetching lead info:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: getDomainErrorMessage(error, "Không thể lấy thông tin lead"),
      });
    }
  };

  const closeCreateAccountModal = () => {
    setIsCreateAccountModalOpen(false);
    setSelectedLeadInfo(null);
  };

  return {
    isCreateAccountModalOpen,
    selectedLeadInfo,
    handleCreateAccount,
    closeCreateAccountModal,
    setIsCreateAccountModalOpen,
  };
}
