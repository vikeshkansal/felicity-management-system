"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Event, Organizer } from "@/lib/definitions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OrganizerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: organizerId } = use(params);
    const router = useRouter();
    const [organizer, setOrganizer] = useState<Organizer | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const orgResponse = await api.get(`/participants/organizers/${organizerId}`);
            setOrganizer(orgResponse.data);
            const eventsResponse = await api.get("/events", {
                params: { organizerIds: organizerId }
            });
            setEvents(eventsResponse.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load organizer details");
        } finally {
            setLoading(false);
        }
    }, [organizerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
    if (!organizer) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Organizer not found</p></div>;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.end) > now);
    const pastEvents = events.filter(e => new Date(e.end) <= now);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">{organizer.name}</h1>
            <p className="text-gray-600 mb-1">{organizer.category}</p>
            <p className="mb-6">{organizer.description}</p>
            <p className="text-sm text-gray-500 mb-8">Contact: {organizer.email}</p>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 mb-8">No upcoming events</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {upcomingEvents.map(event => (
                        <Card
                            key={event._id}
                            className="cursor-pointer hover:shadow-md"
                            onClick={() => router.push(`/events/${event._id}`)}
                        >
                            <CardHeader>
                                <CardTitle>{event.name}</CardTitle>
                                <CardDescription>
                                    {event.type} • {event.status}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
            {pastEvents.length === 0 ? (
                <p className="text-gray-500">No past events</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastEvents.map(event => (
                        <Card
                            key={event._id}
                            className="cursor-pointer hover:shadow-md"
                            onClick={() => router.push(`/events/${event._id}`)}
                        >
                            <CardHeader>
                                <CardTitle>{event.name}</CardTitle>
                                <CardDescription>
                                    {event.type} • {event.status}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}