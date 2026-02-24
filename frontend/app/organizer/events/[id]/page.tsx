"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Event } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AxiosError } from "axios";

type EventStats = {
    registrationCount: number;
    revenue: number;
    attendanceRate: string;
};

type ApiErrorResponse = {
    message?: string;
};

type ParticipantRegistration = {
    _id: string;
    status: "registered" | "confirmed" | "cancelled";
    registrationDate: string;
    ticketId: string;
    participant?: {
        name?: {
            firstName?: string;
            lastName?: string;
        };
        email?: string;
    };
};

export default function OrganizerEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [stats, setStats] = useState<EventStats | null>(null);
    const [participants, setParticipants] = useState<ParticipantRegistration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [eventRes, statsRes, participantsRes] = await Promise.all([
                    api.get(`/events/${eventId}`),
                    api.get(`/organizer/events/${eventId}/stats`),
                    api.get(`/organizer/events/${eventId}/participants`)
                ]);
                setEvent(eventRes.data);
                setStats(statsRes.data);
                setParticipants(participantsRes.data);
            } catch {
                setError("Failed to load event data");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [eventId]);

    const handlePublish = async () => {
        setActionLoading(true);
        try {
            await api.post(`/organizer/events/${eventId}/publish`);
            setEvent({ ...event!, status: "published" });
        } catch (err: unknown) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message || "Failed to publish event");
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setActionLoading(true);
        try {
            await api.put(`/events/${eventId}`, { status: newStatus });
            setEvent({ ...event!, status: newStatus as Event["status"] });
        } catch {
            setError(`Failed to update event status`);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredParticipants = participants.filter((reg) => {
        const nameMatch =
            !searchQuery ||
            `${reg.participant?.name?.firstName} ${reg.participant?.name?.lastName}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            reg.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch = !statusFilter || reg.status === statusFilter;
        return nameMatch && statusMatch;
    });

    const handleExportCsv = () => {
        const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
        const rows = filteredParticipants.map((reg) => {
            const name = `${reg.participant?.name?.firstName || ""} ${reg.participant?.name?.lastName || ""}`.trim();
            const email = reg.participant?.email || "";
            const status = reg.status;
            const registered = new Date(reg.registrationDate).toISOString();
            const ticketId = reg.ticketId;
            return [name, email, status, registered, ticketId].map(escapeCsv).join(",");
        });

        const header = ["Name", "Email", "Status", "Registered", "Ticket ID"].join(",");
        const csvContent = [header, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${event?.name || "event"}-participants.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error || "Event not found"}</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
                            <CardDescription>{event.description}</CardDescription>
                        </div>
                        <Badge variant={event.status === "published" ? "default" : "secondary"}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Type</p>
                            <p className="font-medium">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Eligibility</p>
                            <p className="font-medium">{event.eligibility}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Start</p>
                            <p className="font-medium">{new Date(event.start).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">End</p>
                            <p className="font-medium">{new Date(event.end).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Registration Deadline</p>
                            <p className="font-medium">{new Date(event.regDeadline).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">{event.type === "merchandise" ? "Item Price" : "Fee"}</p>
                            <p className="font-medium">₹{event.regFee}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Limit</p>
                            <p className="font-medium">{event.regLimit} spots</p>
                        </div>
                    </div>

                    {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {event.tags.map((tag, i) => (
                                <Badge key={i} variant="outline">{tag}</Badge>
                            ))}
                        </div>
                    )}
                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-lg font-semibold mb-3">
                            {event.type === 'merchandise' ? 'Merchandise Details' : 'Registration Form Configuration'}
                        </h3>

                        {event.type === 'merchandise' && event.itemDetails && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Sizes</p>
                                        <div className="flex flex-wrap gap-1">
                                            {event.itemDetails.sizes?.length ? event.itemDetails.sizes.map(s => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-sm text-gray-400">None</span>}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Colors</p>
                                        <div className="flex flex-wrap gap-1">
                                            {event.itemDetails.colors?.length ? event.itemDetails.colors.map(c => <Badge key={c} variant="secondary">{c}</Badge>) : <span className="text-sm text-gray-400">None</span>}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Variants</p>
                                        <div className="flex flex-wrap gap-1">
                                            {event.itemDetails.variants?.length ? event.itemDetails.variants.map(v => <Badge key={v} variant="secondary">{v}</Badge>) : <span className="text-sm text-gray-400">None</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                        <p className="text-sm text-blue-600">Stock Quantity</p>
                                        <p className="text-xl font-bold text-blue-900">{event.stockQuantity ?? 0}</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                                        <p className="text-sm text-purple-600">Purchase Limit / Person</p>
                                        <p className="text-xl font-bold text-purple-900">{event.purchaseLimitPerParticipant ?? 1}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {event.type === 'normal' && event.customForm && (
                            <div className="space-y-2">
                                {event.customForm.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {event.customForm.map((field, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                                                <div>
                                                    <span className="font-medium text-gray-900">{field.fieldName}</span>
                                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    <p className="text-xs text-gray-500 capitalize">{field.fieldType}</p>
                                                </div>
                                                {field.options && field.options.length > 0 && (
                                                    <div className="text-xs text-right text-gray-500 max-w-[50%] truncate">
                                                        Options: {field.options.join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No custom fields configured.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4 border-t mt-4">
                        {event.status === "draft" && (
                            <>
                                <Button onClick={handlePublish} disabled={actionLoading}>
                                    {actionLoading ? "Publishing..." : "Publish"}
                                </Button>
                                <Button variant="outline" onClick={() => router.push(`/organizer/events/${eventId}/edit`)}>
                                    Edit
                                </Button>
                            </>
                        )}
                        {event.status === "published" && (
                            <>
                                <Button onClick={() => handleStatusChange("ongoing")} disabled={actionLoading}>
                                    {actionLoading ? "Starting..." : "Start Event"}
                                </Button>
                                <Button variant="destructive" onClick={() => handleStatusChange("closed")} disabled={actionLoading}>
                                    Close Registrations
                                </Button>
                                <Button variant="outline" onClick={() => router.push(`/organizer/events/${eventId}/edit`)}>
                                    Edit
                                </Button>
                            </>
                        )}
                        {event.status === "ongoing" && (
                            <Button onClick={() => handleStatusChange("completed")} disabled={actionLoading}>
                                Mark Completed
                            </Button>
                        )}
                        {event.status === "closed" && (
                            <Button onClick={() => handleStatusChange("ongoing")} disabled={actionLoading}>
                                {actionLoading ? "Starting..." : "Start Event"}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardDescription>Registrations</CardDescription>
                            <CardTitle className="text-3xl">{stats.registrationCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>Revenue</CardDescription>
                            <CardTitle className="text-3xl">₹{stats.revenue}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>Attendance Rate</CardDescription>
                            <CardTitle className="text-3xl">{stats.attendanceRate}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Participants ({filteredParticipants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <Input
                            placeholder="Search by name or email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="registered">Registered</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleExportCsv}
                            disabled={filteredParticipants.length === 0}
                        >
                            Export CSV
                        </Button>
                    </div>

                    {filteredParticipants.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No participants found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Name</th>
                                        <th className="text-left p-3">Email</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Registered</th>
                                        <th className="text-left p-3">Ticket ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((reg) => (
                                        <tr key={reg._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                {reg.participant?.name?.firstName} {reg.participant?.name?.lastName}
                                            </td>
                                            <td className="p-3">{reg.participant?.email}</td>
                                            <td className="p-3">
                                                <Badge variant={reg.status === "cancelled" ? "destructive" : "default"}>
                                                    {reg.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                {new Date(reg.registrationDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 font-mono text-sm">{reg.ticketId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
