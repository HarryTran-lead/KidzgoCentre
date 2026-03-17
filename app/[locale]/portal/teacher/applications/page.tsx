"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	AlertCircle,
	CheckCircle2,
	ChevronLeft,
	Clock,
	Download,
	Filter,
	LifeBuoy,
	MessageCircle,
	Search,
	Send,
	ShieldCheck,
	Tag,
	User,
	ArrowUpDown,
	Eye,
} from "lucide-react";
import {
	getTickets,
	getTicketById,
	updateTicketStatus,
	addTicketComment,
} from "@/lib/api/ticketService";
import type {
	Ticket,
	TicketDetail,
	TicketStatus,
	TicketComment,
} from "@/types/student/ticket";
import { toast } from "@/hooks/use-toast";

type ViewMode = "list" | "detail";
type DisplayStatus = "Mới" | "Đang xử lý" | "Đã phản hồi" | "Đã đóng";

const STATUS_MAP: Record<string, DisplayStatus> = {
	Open: "Mới",
	InProgress: "Đang xử lý",
	Resolved: "Đã phản hồi",
	Closed: "Đã đóng",
};

const CATEGORY_LABELS: Record<string, string> = {
	Homework: "Bài tập",
	Finance: "Học phí",
	Schedule: "Lịch học",
	Tech: "Kỹ thuật",
};

function mapStatus(s: string): DisplayStatus {
	return STATUS_MAP[s] ?? "Mới";
}

function fmtDate(d: string) {
	return new Date(d).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function fmtFull(d: string) {
	return new Date(d).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	color,
}: {
	title: string;
	value: string;
	subtitle?: string;
	icon: any;
	color: string;
}) {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
			<div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`} />
			<div className="relative flex items-center justify-between gap-3">
				<div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
					<Icon size={20} />
				</div>
				<div className="min-w-0 flex-1">
					<div className="text-xs font-medium text-gray-600 truncate">{title}</div>
					<div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
					{subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const display = mapStatus(status);
	const cfg: Record<DisplayStatus, { cls: string; icon: any }> = {
		"Mới": { cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200", icon: AlertCircle },
		"Đang xử lý": { cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200", icon: Clock },
		"Đã phản hồi": { cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2 },
		"Đã đóng": { cls: "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200", icon: ShieldCheck },
	};
	const c = cfg[display];
	const Icon = c.icon;
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
			<Icon size={12} />
			<span>{display}</span>
		</span>
	);
}

function CategoryBadge({ category }: { category: string }) {
	const map: Record<string, { label: string; cls: string }> = {
		Homework: { label: "Bài tập", cls: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200" },
		Finance: { label: "Học phí", cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200" },
		Schedule: { label: "Lịch học", cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200" },
		Tech: { label: "Kỹ thuật", cls: "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200" },
	};
	const c = map[category] ?? { label: category, cls: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200" };
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
			<Tag size={12} />
			<span>{c.label}</span>
		</span>
	);
}

function TicketDetailView({
	ticket,
	onBack,
	onRefresh,
}: {
	ticket: TicketDetail;
	onBack: () => void;
	onRefresh: () => void;
}) {
	const [newComment, setNewComment] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const handleAddComment = async () => {
		if (!newComment.trim()) return;
		try {
			setIsSending(true);
			const res = await addTicketComment(ticket.id, { message: newComment.trim() });
			if (res.isSuccess) {
				toast.success({ title: "Đã gửi phản hồi" });
				setNewComment("");
				onRefresh();
			} else {
				toast.destructive({ title: "Lỗi", description: res.message || "Không thể gửi phản hồi" });
			}
		} catch {
			toast.destructive({ title: "Lỗi", description: "Đã xảy ra lỗi" });
		} finally {
			setIsSending(false);
		}
	};

	const handleStatusChange = async (newStatus: TicketStatus) => {
		try {
			setIsUpdating(true);
			const res = await updateTicketStatus(ticket.id, { status: newStatus });
			if (res.isSuccess) {
				toast.success({ title: "Đã cập nhật trạng thái", description: `→ ${STATUS_MAP[newStatus]}` });
				onRefresh();
			} else {
				toast.destructive({ title: "Lỗi", description: res.message || "Không thể cập nhật" });
			}
		} catch {
			toast.destructive({ title: "Lỗi", description: "Đã xảy ra lỗi" });
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<div className="space-y-6">
			<button
				onClick={onBack}
				className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
			>
				<ChevronLeft size={16} /> Quay lại danh sách
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					<div className="rounded-2xl border border-red-200 bg-white p-6">
						<div className="flex items-start justify-between gap-4 mb-4">
							<div className="flex-1 min-w-0">
								<h2 className="text-xl font-bold text-gray-900 mb-1">{ticket.subject}</h2>
								<div className="flex items-center gap-3 text-sm text-gray-500">
									<span>Mã: <span className="font-mono">{ticket.id.slice(0, 8)}</span></span>
									<span>•</span>
									<span>{fmtFull(ticket.createdAt)}</span>
								</div>
							</div>
							<StatusBadge status={ticket.status} />
						</div>

						<div className="flex flex-wrap gap-3 mb-4">
							<CategoryBadge category={ticket.category} />
							{ticket.branchName && (
								<span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
									{ticket.branchName}
								</span>
							)}
							{ticket.classTitle && (
								<span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
									{ticket.classCode} - {ticket.classTitle}
								</span>
							)}
						</div>

						<div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
							{ticket.message}
						</div>

						<div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
							<div className="flex items-center gap-1.5">
								<User size={14} />
								<span>{ticket.openedByProfileName || ticket.openedByUserName}</span>
							</div>
							{ticket.assignedToUserName && (
								<>
									<span>→</span>
									<div className="flex items-center gap-1.5">
										<ShieldCheck size={14} />
										<span>{ticket.assignedToUserName}</span>
									</div>
								</>
							)}
						</div>
					</div>

					<div className="rounded-2xl border border-red-200 bg-white p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<MessageCircle size={18} /> Phản hồi ({ticket.comments?.length || 0})
						</h3>

						{ticket.comments && ticket.comments.length > 0 ? (
							<div className="space-y-4 mb-6">
								{ticket.comments.map((c: TicketComment) => (
									<div key={c.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<div className="h-7 w-7 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white text-xs font-bold">
													{(c.commenterProfileName || c.commenterUserName || "?").charAt(0).toUpperCase()}
												</div>
												<span className="text-sm font-medium text-gray-900">
													{c.commenterProfileName || c.commenterUserName}
												</span>
											</div>
											<span className="text-xs text-gray-400">{fmtFull(c.createdAt)}</span>
										</div>
										<p className="text-sm text-gray-700 whitespace-pre-wrap">{c.message}</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-gray-400 mb-6">Chưa có phản hồi nào</p>
						)}

						<div className="flex gap-3">
							<textarea
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Nhập phản hồi..."
								rows={3}
								className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
							/>
							<button
								onClick={handleAddComment}
								disabled={isSending || !newComment.trim()}
								className="self-end inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
							>
								<Send size={14} /> {isSending ? "Đang gửi..." : "Gửi"}
							</button>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-2xl border border-red-200 bg-white p-5">
						<h3 className="text-sm font-semibold text-gray-900 mb-3">Cập nhật trạng thái</h3>
						<div className="grid grid-cols-1 gap-2">
							{(["Open", "InProgress", "Resolved", "Closed"] as TicketStatus[]).map((s) => (
								<button
									key={s}
									onClick={() => handleStatusChange(s)}
									disabled={isUpdating || ticket.status === s}
									className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
										ticket.status === s
											? "bg-red-100 text-red-700 border border-red-300"
											: "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
									} disabled:opacity-50 disabled:cursor-not-allowed`}
								>
									{STATUS_MAP[s]}
								</button>
							))}
						</div>
					</div>

					<div className="rounded-2xl border border-red-200 bg-white p-5">
						<h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin đơn</h3>
						<dl className="space-y-2.5 text-sm">
							<div className="flex justify-between"><dt className="text-gray-500">Người gửi</dt><dd className="text-gray-900 font-medium text-right">{ticket.openedByProfileName || ticket.openedByUserName}</dd></div>
							<div className="flex justify-between"><dt className="text-gray-500">Danh mục</dt><dd className="text-gray-900">{CATEGORY_LABELS[ticket.category] || ticket.category}</dd></div>
							<div className="flex justify-between"><dt className="text-gray-500">Chi nhánh</dt><dd className="text-gray-900">{ticket.branchName || "—"}</dd></div>
							<div className="flex justify-between"><dt className="text-gray-500">Lớp</dt><dd className="text-gray-900">{ticket.classTitle || ticket.classCode || "—"}</dd></div>
							<div className="flex justify-between"><dt className="text-gray-500">Phụ trách</dt><dd className="text-gray-900">{ticket.assignedToUserName || "Chưa phân"}</dd></div>
							<div className="flex justify-between"><dt className="text-gray-500">Tạo lúc</dt><dd className="text-gray-900">{fmtFull(ticket.createdAt)}</dd></div>
							<div className="flex justify-between"><dt className="text-gray-500">Cập nhật</dt><dd className="text-gray-900">{fmtFull(ticket.updatedAt)}</dd></div>
						</dl>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function TeacherFeedbackPage() {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("Tất cả");
	const [categoryFilter, setCategoryFilter] = useState("Tất cả");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
	const [sortKey, setSortKey] = useState<"subject" | "requester" | "category" | "status" | "updatedAt" | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	const fetchTickets = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await getTickets({ pageSize: 100, mine: true });
			if (res.isSuccess && res.data) {
				const d = res.data as any;
				const list = Array.isArray(d) ? d : (d.items ?? d.tickets?.items ?? []);
				setTickets(list);
			}
		} catch (err) {
			console.error("Error fetching tickets:", err);
			toast.destructive({ title: "Lỗi", description: "Không thể tải danh sách ticket" });
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => { fetchTickets(); }, [fetchTickets]);

	const openDetail = async (id: string) => {
		try {
			setIsLoadingDetail(true);
			const res = await getTicketById(id);
			if (res.isSuccess && res.data) {
				const detail = (res.data as any)?.ticket ?? res.data;
				setSelectedTicket(detail);
				setViewMode("detail");
			} else {
				toast.destructive({ title: "Lỗi", description: "Không thể tải thông tin ticket" });
			}
		} catch {
			toast.destructive({ title: "Lỗi", description: "Đã xảy ra lỗi khi tải ticket" });
		} finally {
			setIsLoadingDetail(false);
		}
	};

	const refreshDetail = async () => {
		if (!selectedTicket) return;
		const res = await getTicketById(selectedTicket.id);
		if (res.isSuccess && res.data) {
			const detail = (res.data as any)?.ticket ?? res.data;
			setSelectedTicket(detail);
		}
		fetchTickets();
	};

	const stats = useMemo(() => {
		const total = tickets.length;
		const fresh = tickets.filter((t) => t.status === "Open").length;
		const inProg = tickets.filter((t) => t.status === "InProgress").length;
		const done = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
		return { total, fresh, inProg, done };
	}, [tickets]);

	const statusOpts = ["Tất cả", "Mới", "Đang xử lý", "Đã phản hồi", "Đã đóng"];
	const catOpts = ["Tất cả", "Homework", "Finance", "Schedule", "Tech"];

	const filtered = useMemo(() => {
		return tickets.filter((t) => {
			const mS = statusFilter === "Tất cả" || mapStatus(t.status) === statusFilter;
			const mC = categoryFilter === "Tất cả" || t.category === categoryFilter;
			const q = searchQuery.trim().toLowerCase();
			const mQ = !q || t.subject.toLowerCase().includes(q) || t.openedByUserName.toLowerCase().includes(q) || (t.openedByProfileName || "").toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
			return mS && mC && mQ;
		});
	}, [tickets, statusFilter, categoryFilter, searchQuery]);

	const sorted = useMemo(() => {
		const copy = [...filtered];
		if (!sortKey) return copy;
		const gv = (t: Ticket) => {
			switch (sortKey) {
				case "subject": return t.subject;
				case "requester": return t.openedByProfileName || t.openedByUserName;
				case "category": return t.category;
				case "status": return t.status;
				case "updatedAt": return t.updatedAt;
				default: return "";
			}
		};
		copy.sort((a, b) => {
			const r = String(gv(a)).localeCompare(String(gv(b)), "vi", { numeric: true, sensitivity: "base" });
			return sortDir === "asc" ? r : -r;
		});
		return copy;
	}, [filtered, sortKey, sortDir]);

	const visibleIds = useMemo(() => sorted.map((t) => t.id), [sorted]);
	const selCount = useMemo(() => visibleIds.filter((id) => selectedIds[id]).length, [visibleIds, selectedIds]);
	const allSel = visibleIds.length > 0 && selCount === visibleIds.length;

	const toggleAll = () => {
		setSelectedIds((p) => {
			const n = { ...p };
			if (allSel) visibleIds.forEach((id) => delete n[id]);
			else visibleIds.forEach((id) => (n[id] = true));
			return n;
		});
	};
	const toggleOne = (id: string) => {
		setSelectedIds((p) => {
			const n = { ...p };
			if (n[id]) delete n[id]; else n[id] = true;
			return n;
		});
	};
	const toggleSort = (k: NonNullable<typeof sortKey>) => {
		setSortKey((p) => { if (p !== k) { setSortDir("asc"); return k; } setSortDir((d) => d === "asc" ? "desc" : "asc"); return p; });
	};

	if (viewMode === "detail" && selectedTicket) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
				<TicketDetailView ticket={selectedTicket} onBack={() => { setViewMode("list"); setSelectedTicket(null); }} onRefresh={refreshDetail} />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
						<LifeBuoy size={28} className="text-white" />
					</div>
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ticket của tôi</h1>
						<p className="text-sm text-gray-600 mt-1">Theo dõi và phản hồi các ticket được giao cho giáo viên</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<button className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer">
						<Download size={16} /> Xuất DS
					</button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard title="Tổng ticket" value={String(stats.total)} subtitle="Được giao cho tôi" icon={LifeBuoy} color="from-red-600 to-red-700" />
				<StatCard title="Ticket mới" value={String(stats.fresh)} subtitle="Cần tiếp nhận" icon={AlertCircle} color="from-amber-500 to-orange-500" />
				<StatCard title="Đang xử lý" value={String(stats.inProg)} subtitle="Đang theo dõi" icon={Clock} color="from-blue-500 to-cyan-500" />
				<StatCard title="Đã phản hồi" value={String(stats.done)} subtitle="Hoàn tất phản hồi" icon={CheckCircle2} color="from-emerald-500 to-teal-500" />
			</div>

			<div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2">
							<Filter size={16} className="text-gray-500" />
							<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer">
								{statusOpts.map((s) => <option key={s} value={s}>{s}</option>)}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer">
								{catOpts.map((c) => <option key={c} value={c}>{c === "Tất cả" ? c : CATEGORY_LABELS[c] || c}</option>)}
							</select>
						</div>
					</div>
					<div className="relative">
						<input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm theo mã, tiêu đề, người gửi..." className="h-10 w-72 rounded-xl border border-red-300 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text" />
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
				<div className="bg-gradient-to-r from-red-50 to-red-100/30 border-b border-red-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-gray-900">Danh sách ticket</h2>
						<div className="text-sm text-gray-600 font-medium">{sorted.length} ticket</div>
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-16">
						<div className="text-center">
							<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto mb-3" />
							<p className="text-gray-400 text-sm">Đang tải...</p>
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
								<tr>
									<th className="py-3 px-4 text-left w-12">
										<input type="checkbox" checked={allSel} onChange={toggleAll} className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer" aria-label="Chọn tất cả" />
									</th>
									{([
										["subject", "Ticket"],
										["requester", "Người gửi"],
										["category", "Nhóm xử lý"],
										["status", "Trạng thái"],
										["updatedAt", "Cập nhật"],
									] as const).map(([key, label]) => (
										<th key={key} className="py-3 px-6 text-left">
											<button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer">
												{label}
												<ArrowUpDown size={14} className={sortKey === key ? "text-red-600" : "text-gray-400"} />
											</button>
										</th>
									))}
									<th className="py-3 px-6 text-left"><span className="text-sm font-semibold text-gray-700">Thao tác</span></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-red-100">
								{sorted.length > 0 ? sorted.map((t) => (
									<tr key={t.id} className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200">
										<td className="py-4 px-4 align-top">
											<input type="checkbox" checked={!!selectedIds[t.id]} onChange={() => toggleOne(t.id)} className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer" aria-label={`Chọn ${t.subject}`} />
										</td>
										<td className="py-4 px-6">
											<div className="space-y-1">
												<div className="font-medium text-gray-900">{t.subject}</div>
												<div className="text-xs text-gray-500 font-mono">{t.id.slice(0, 8)}</div>
											</div>
										</td>
										<td className="py-4 px-6">
											<div className="flex items-center gap-2">
												<div className="h-7 w-7 rounded-lg bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white text-xs font-bold"><User size={14} /></div>
												<div className="text-sm font-medium text-gray-900">{t.openedByProfileName || t.openedByUserName}</div>
											</div>
										</td>
										<td className="py-4 px-6"><CategoryBadge category={t.category} /></td>
										<td className="py-4 px-6"><StatusBadge status={t.status} /></td>
										<td className="py-4 px-6"><div className="text-sm text-gray-700">{fmtDate(t.updatedAt)}</div></td>
										<td className="py-4 px-6">
											<button onClick={() => openDetail(t.id)} disabled={isLoadingDetail} className="p-1.5 rounded-lg border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Xem chi tiết">
												<Eye size={14} />
											</button>
										</td>
									</tr>
								)) : (
									<tr>
										<td colSpan={7} className="py-12 text-center">
											<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center"><Search size={24} className="text-red-400" /></div>
											<div className="text-gray-600 font-medium">Không có ticket phù hợp</div>
											<div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
