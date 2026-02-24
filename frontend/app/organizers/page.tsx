"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Organizer } from "@/lib/definitions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrganizersPage() {
    const router = useRouter();
    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [following, setFollowing] = useState<Organizer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orgResponse, profileResponse] = await Promise.all([
                api.get("/participants/organizers"),
                api.get("/participants/profile")
            ]);
            setOrganizers(orgResponse.data);
            setFollowing(profileResponse.data.following);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load organizers");
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (organizerId: string) => {
        try {
            await api.post(`/participants/follow/${organizerId}`);
            const org = organizers.find(o => o._id === organizerId);
            if (org) setFollowing([...following, org]);
        } catch (error) {
            console.error("Error following organizer:", error)
            setError("Failed to follow organizer");
        }
    };

    const handleUnfollow = async (organizerId: string) => {
        try {
            await api.delete(`/participants/follow/${organizerId}`);
            setFollowing(following.filter(club => club._id !== organizerId));
        } catch (error) {
            console.error("Error unfollowing organizer:", error)
            setError("Failed to unfollow organizer");
        }
    };

    useEffect(() => {
        fetchData();
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

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Clubs & Organizers</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizers.map(organizer => (
                    <Card
                        key={organizer._id}
                        className="cursor-pointer hover:shadow-md"
                    >
                        <CardHeader>
                            <CardTitle onClick={() => router.push(`/organizers/${organizer._id}`)}>
                                {organizer.name}
                            </CardTitle>
                            <CardDescription>
                                {organizer.category}
                            </CardDescription>
                        </CardHeader>
                        <div className="px-4 pb-4">
                            <p className="text-sm text-gray-600 mb-4">{organizer.description}</p>
                            <Button
                                variant={following.some(f => f._id === organizer._id) ? "outline" : "default"}
                                className="w-full"
                                onClick={() => following.some(f => f._id === organizer._id) ? handleUnfollow(organizer._id) : handleFollow(organizer._id)}
                            >
                                {following.some(f => f._id === organizer._id) ? 'Unfollow' : 'Follow'}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
