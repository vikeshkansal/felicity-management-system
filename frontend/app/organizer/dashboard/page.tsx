"use client";

import api from "@/lib/api";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Event } from "@/lib/definitions";

type eventAnalytics = {
    events: {
        draft: Event[];
        published: Event[];
        ongoing: Event[];
        closed: Event[];
    };
    analytics: {
        totalRegistrations: number;
        totalRevenue: number;
        completedEventsCount: number;
    };
}

export default function OrganizerDashboardPage() {

    const router = useRouter();
    const [eventAnalytics, setEventAnalytics] = useState<eventAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/organizer/dashboard");
            setEventAnalytics(res.data);
        } catch {
            setError("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
            </div>
        );
    }

    if (!eventAnalytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    const groupedEvents = eventAnalytics.events;
    const { totalRegistrations, totalRevenue, completedEventsCount } = eventAnalytics.analytics;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
                <Button onClick={() => router.push("/organizer/events/create")}>
                    Create Event
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardHeader>
                        <CardDescription>Total Registrations</CardDescription>
                        <CardTitle className="text-3xl">{totalRegistrations}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Total Revenue</CardDescription>
                        <CardTitle className="text-3xl">₹{totalRevenue}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Completed Events</CardDescription>
                        <CardTitle className="text-3xl">{completedEventsCount}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="space-y-6">
                {(["draft", "published", "ongoing", "closed"] as const).map((status) => {
                    const events = groupedEvents[status];
                    if (!events || events.length === 0) return null;
                    const title = status.charAt(0).toUpperCase() + status.slice(1) + " Events";
                    return (
                        <div key={status} id={status} className="scroll-mt-20">
                            <h2 className="text-xl font-semibold mb-3">{title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {events.map((event) => (
                                    <Card
                                        key={event._id}
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => router.push(`/organizer/events/${event._id}`)}
                                    >
                                        <CardHeader>
                                            <CardTitle>{event.name}</CardTitle>
                                            <CardDescription>
                                                Type: {event.type} • Status: {event.status}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}