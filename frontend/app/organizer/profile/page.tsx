"use client";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card"
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function OrganizerProfilePage() {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [discordWebhook, setDiscordWebhook] = useState("");

    const [fetchLoading, setFetchLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const getProfile = async () => {
        try {
            setFetchLoading(true);
            setError("");
            const res = await api.get("/organizer/profile");
            const data = res.data;
            setName(data.name || "");
            setCategory(data.category || "");
            setDescription(data.description || "");
            setEmail(data.email || "");
            setMobile(data.mobile || "");
            setDiscordWebhook(data.discordWebhook || "");

        } catch {
            setError("Failed to fetch profile");
        } finally {
            setFetchLoading(false);
        }
    }

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            await api.put("/organizer/profile", {
                name,
                category,
                description,
                mobile,
                discordWebhook
            });
        } catch {
            setError("Failed to update profile");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        getProfile();
    }, []);

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {error && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Organizer Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={updateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organizer Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter organizer name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Sports, Cultural, Technical"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                placeholder="Describe your organization"
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Login Email (Read-only)</Label>
                            <Input
                                id="email"
                                value={email}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Contact Number</Label>
                            <Input
                                id="mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="Enter contact number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                            <Input
                                id="discordWebhook"
                                value={discordWebhook}
                                onChange={(e) => setDiscordWebhook(e.target.value)}
                                placeholder="https://discord.com/api/webhooks/..."
                            />
                            <p className="text-sm text-gray-500">
                                When set, new events you publish will be automatically posted to your Discord channel.
                            </p>
                        </div>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Profile"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );

}