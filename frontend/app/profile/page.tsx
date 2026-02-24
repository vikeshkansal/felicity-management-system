"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Organizer } from "@/lib/definitions";
import { logoutUser } from "@/lib/auth";
import type { AxiosError } from "axios";

type ApiErrorResponse = {
    message?: string;
};

const AVAILABLE_INTERESTS = [
    "Technology", "Sports", "Music", "Art", "Dance",
    "Drama", "Photography", "Gaming", "Coding", "Robotics"
];

export default function ProfilePage() {

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [mobile, setMobile] = useState("")
    const [orgName, setOrgName] = useState("")
    const [interests, setInterests] = useState<string[]>([])
    const [following, setFollowing] = useState<Organizer[]>([])
    const [email, setEmail] = useState("")
    const [participantType, setParticipantType] = useState("")

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const fetchProfile = async () => {
        try {
            const response = await api.get("/participants/profile");
            const data = response.data;
            setFirstName(data.name?.firstName || "");
            setLastName(data.name?.lastName || "");
            setMobile(data.mobile || "");
            setOrgName(data.orgName || "");
            setInterests(data.interests || []);
            setFollowing(data.following || []);
            setEmail(data.email || "");
            setParticipantType(data.participantType || "");
        } catch (error) {
            console.error("Error fetching profile:", error);
            setError("Failed to load profile");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            setLoading(true);
            setError("");
            setSuccess("");
            await api.put("/participants/profile", {
                firstName,
                lastName,
                mobile,
                orgName,
                interests,
            })
            setSuccess("Profile updated successfully");
        } catch (error) {
            console.error("Error saving profile:", error)
            setError("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (organizerId: string) => {
        try {
            await api.delete(`/participants/follow/${organizerId}`)
            setFollowing(following.filter(club => club._id !== organizerId));
            setSuccess("Unfollowed successfully!");
        } catch (error) {
            console.error("Error unfollowing organizer:", error)
            setError("Failed to unfollow organizer");
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await api.put("/participants/change-password", {
                currentPassword,
                newPassword,
                confirmNewPassword,
            });
            logoutUser();
        } catch (error: unknown) {
            console.error("Error changing password:", error)
            const axiosError = error as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (interest: string) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter(i => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);


    return (

        <div className="p-8 max-w-4xl mx-auto">

            {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                    {success}
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Read-only)</Label>
                            <Input
                                id="email"
                                value={email}
                                disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactNumber">Contact Number</Label>
                            <Input
                                id="contactNumber"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="college">College / Organization Name</Label>
                            <Input
                                id="college"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                disabled={participantType === "IIIT-H"}
                                className={participantType === "IIIT-H" ? "bg-gray-100" : ""}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="participantType">Participant Type</Label>
                            <Input
                                value={participantType}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Interests</Label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_INTERESTS.map((interest) => (
                                    <Badge
                                        key={interest}
                                        variant={interests.includes(interest) ? "default" : "outline"}
                                        className="cursor-pointer"
                                        onClick={() => toggleInterest(interest)}
                                    >
                                        {interest}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Button type="submit">
                            Save Profile
                        </Button>

                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Followed Clubs</CardTitle>
                </CardHeader>
                <CardContent>
                    {following.length === 0 ? (
                        <p className="text-gray-500">You are not following any clubs yet.</p>
                    ) : (
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
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                            <Input
                                id="confirmNewPassword"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Changing..." : "Change Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );

}

