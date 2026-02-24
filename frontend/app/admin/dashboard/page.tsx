"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/api";

type DashboardStats = {
    totalOrganizers: number;
    totalEvents: number;
    totalParticipants: number;
    activeOrganizers: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/admin/dashboard");
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                setError("Failed to load stats");
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
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

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">No stats available</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Overview of all organizers, events, and participants</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="h-full">
                            <CardHeader className="min-h-24">
                                <CardTitle>Total Organizers</CardTitle>
                                <CardDescription>All registered organizers</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-4xl font-bold">{stats.totalOrganizers}</p>
                            </CardContent>
                        </Card>
                        <Card className="h-full">
                            <CardHeader className="min-h-24">
                                <CardTitle>Total Events</CardTitle>
                                <CardDescription>All created events</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-4xl font-bold">{stats.totalEvents}</p>
                            </CardContent>
                        </Card>
                        <Card className="h-full">
                            <CardHeader className="min-h-24">
                                <CardTitle>Total Participants</CardTitle>
                                <CardDescription>All registered participants</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-4xl font-bold">{stats.totalParticipants}</p>
                            </CardContent>
                        </Card>
                        <Card className="h-full">
                            <CardHeader className="min-h-24">
                                <CardTitle>Active Organizers</CardTitle>
                                <CardDescription>Non-disabled organizers</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-4xl font-bold">{stats.activeOrganizers}</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}