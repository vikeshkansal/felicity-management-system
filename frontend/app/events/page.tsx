"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallback, useState, useEffect } from "react";
import { Event, Organizer } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EventQueryParams = {
    search: string;
    eligibility?: string;
    type?: string;
    start?: string;
    end?: string;
    organizerIds?: string;
};

export default function EventsPage() {

    const [events, setEvents] = useState<Event[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [eligibility, setEligibility] = useState<string>("all");
    const [type, setType] = useState<string>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFollowedOnly, setShowFollowedOnly] = useState(false);
    const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
    const [followedOrganizers, setFollowedOrganizers] = useState<Organizer[]>([]);

    const fetchTrending = async () => {
        try {
            const response = await api.get("/events/trending");
            setTrendingEvents(response.data);
        } catch (e) { console.error("Failed to fetch trending", e); }
    };

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const params: EventQueryParams = { search };
            if (eligibility && eligibility !== 'all') params.eligibility = eligibility;
            if (type && type !== 'all') params.type = type;
            if (startDate) params.start = startDate;
            if (endDate) params.end = endDate;
            if (showFollowedOnly) {
                if (followedOrganizers.length > 0) {
                    params.organizerIds = followedOrganizers.map(o => o._id).join(',');
                } else {
                    params.organizerIds = "000000000000000000000000";
                }
            }

            const response = await api.get("/events", { params });
            const data = response.data;
            setEvents(data.events || data);
        } catch (error) {
            console.error("Failed to fetch events", error);
            setError("Failed to load events");
        } finally {
            setLoading(false);
        }
    }, [endDate, eligibility, followedOrganizers, search, showFollowedOnly, startDate, type]);

    useEffect(() => {
        fetchTrending();
        api.get("/participants/profile").then(res => {
            if (res.data.following) {
                setFollowedOrganizers(res.data.following);
            }
        }).catch(() => { });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchEvents(), 300);
        return () => clearTimeout(timer);
    }, [fetchEvents]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                {trendingEvents.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Trending</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trendingEvents.map((event) => (
                                <Card key={event._id} className="border-indigo-100 bg-indigo-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{event.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Link href={`/events/${event._id}`} className="w-full">
                                            <Button size="sm" className="w-full">View Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-3xl font-bold">All Events</h1>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Input
                                placeholder="Search events..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full md:w-64"
                            />
                            <Button variant="outline" onClick={() => {
                                setSearch("");
                                setEligibility("all");
                                setType("all");
                                setStartDate("");
                                setEndDate("");
                                setShowFollowedOnly(false);
                            }}>Reset</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-white rounded-xl shadow-sm border">
                        <div className="space-y-1">
                            <Label>Eligibility</Label>
                            <Select value={eligibility} onValueChange={setEligibility}>
                                <SelectTrigger><SelectValue placeholder="Eligibility" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="IIIT-H">IIIT-H</SelectItem>
                                    <SelectItem value="External">External</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger><SelectValue placeholder="Event Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="merchandise">Merchandise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block"
                            />
                        </div>

                        <div className="flex items-center space-x-2 h-full pt-6">
                            <input
                                type="checkbox"
                                id="followed"
                                checked={showFollowedOnly}
                                onChange={e => setShowFollowedOnly(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="followed" className="cursor-pointer">Followed Only</Label>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {events.length === 0 ? (
                        <p className="text-center text-gray-500">No events found</p>
                    ) : (
                        events.map((event) => (
                            <Card key={event._id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle>{event.name}</CardTitle>
                                        <Badge variant={event.status === "published" ? "default" : "secondary"}>
                                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <CardDescription>{event.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <p><strong>Type:</strong> {event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
                                        <p><strong>Start:</strong> {new Date(event.start).toLocaleString()}</p>
                                        <p><strong>End:</strong> {new Date(event.end).toLocaleString()}</p>
                                        <p><strong>Fee:</strong> ₹{event.regFee}</p>
                                        <p><strong>Limit:</strong> {event.regLimit}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {event.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/events/${event._id}`}>
                                        <Button className="w-full" variant="default">More</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};