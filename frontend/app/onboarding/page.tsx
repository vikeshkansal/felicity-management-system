"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Organizer } from "@/lib/definitions";
import api from "@/lib/api";

const AVAILABLE_INTERESTS = [
    "Technology", "Sports", "Music", "Art", "Dance",
    "Drama", "Photography", "Gaming", "Coding", "Robotics"
];

const isCanceledError = (error: unknown) => {
    return error instanceof Error && error.name === "CanceledError";
};

export default function OnboardingPage() {
    const router = useRouter();
    const [interests, setInterests] = useState<string[]>([]);
    const [following, setFollowing] = useState<Organizer[]>([]);
    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const toggleInterest = (interest: string) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter(i => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
    };

    const handleUnfollow = async (organizerId: string) => {
        try {
            await api.delete(`/participants/follow/${organizerId}`);
            setFollowing(following.filter(club => club._id !== organizerId));
        } catch (error) {
            console.error("Error unfollowing organizer:", error);
            setError("Failed to unfollow organizer");
        }
    };

    const handleFollow = async (organizerId: string) => {
        try {
            await api.post(`/participants/follow/${organizerId}`);
            setFollowing([...following, organizers.find(club => club._id === organizerId)!]);
        } catch (error) {
            console.error("Error following organizer:", error);
            setError("Failed to follow organizer");
        }
    };

    const handleSaveAndContinue = async () => {
        try {
            setLoading(true);
            setError("");
            await api.put("/participants/profile", {
                interests,
                onboardingCompleted: true
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error saving profile:", error);
            setError("Failed to save preferences");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        try {
            setLoading(true);
            await api.put("/participants/profile", { onboardingCompleted: true });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error skipping:", error);
            setError("Failed to skip the onboarding")
            router.push("/dashboard");
        } finally {
            if (error) setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const loadData = async () => {
            try {
                setLoading(true);
                const [orgRes, profileRes] = await Promise.all([
                    api.get("/participants/organizers", { signal: controller.signal }),
                    api.get("/participants/profile", { signal: controller.signal })
                ]);

                if (controller.signal.aborted) return;

                setOrganizers(orgRes.data);

                const { interests, following, onboardingCompleted } = profileRes.data;

                if (onboardingCompleted) {
                    router.replace("/dashboard");
                    return;
                }

                setInterests(interests || []);
                setFollowing(following || []);
                setLoading(false);
            } catch (error: unknown) {
                if (!isCanceledError(error) && !controller.signal.aborted) {
                    console.error("Failed to load onboarding data:", error);
                    setError("Failed to load data. Please refresh.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        loadData();
        return () => controller.abort();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const unfollowedOrganizers = organizers.filter(
        org => !following.some(f => f._id === org._id)
    );

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Welcome! Let&apos;s personalize your experience</h1>
                <p className="text-gray-600">Select your interests and follow clubs to get started</p>
            </div>

            {error && (
                <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Your Interests</CardTitle>
                    <CardDescription>Choose topics you&apos;re interested in</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_INTERESTS.map((interest) => (
                            <Button
                                key={interest}
                                variant={interests.includes(interest) ? "default" : "outline"}
                                onClick={() => toggleInterest(interest)}
                            >
                                {interest}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {following.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Followed Clubs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {following.map((club) => (
                                <div
                                    key={club._id}
                                    className="flex items-center justify-between p-3 border rounded-md"
                                >
                                    <span className="font-medium">{club.name}</span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleUnfollow(club._id)}
                                    >
                                        Unfollow
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Discover Clubs</CardTitle>
                    <CardDescription>Browse and follow clubs you&apos;re interested in</CardDescription>
                </CardHeader>
                <CardContent>
                    {unfollowedOrganizers.length === 0 ? (
                        <p className="text-gray-500">You&apos;re following all available clubs!</p>
                    ) : (
                        <div className="space-y-2">
                            {unfollowedOrganizers.map((organizer) => (
                                <div
                                    key={organizer._id}
                                    className="flex items-center justify-between p-3 border rounded-md"
                                >
                                    <div>
                                        <p className="font-medium">{organizer.name}</p>
                                        <p className="text-sm text-gray-600">{organizer.category}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFollow(organizer._id)}
                                    >
                                        Follow
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button
                    onClick={handleSaveAndContinue}
                    disabled={loading}
                    className="flex-1"
                    size="lg"
                >
                    Save & Continue
                </Button>
                <Button
                    onClick={handleSkip}
                    variant="outline"
                    size="lg"
                >
                    Skip
                </Button>
            </div>
        </div>
    );
}