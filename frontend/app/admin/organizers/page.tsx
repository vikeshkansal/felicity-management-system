"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Organizer } from "@/lib/definitions";
import type { AxiosError } from "axios";

type ApiErrorResponse = {
    message?: string;
};

export default function AdminOrganizersPage() {

    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchOrganizers = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/organizers");
            setOrganizers(response.data.organizers);
        } catch (error) {
            console.error("Error fetching organizers:", error);
            setError("Failed to load organizers");
        } finally {
            setLoading(false);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleAddOrganizer = async (e: React.FormEvent) => {
        e.preventDefault();
        const password = generatePassword();
        setLoading(true);
        setError("");
        
        try {
            await api.post("/admin/add-organizer", {
                name, category, description, email, mobile, password, isDisabled: false
            });
            setGeneratedCredentials({ email, password });
            setName("");
            setCategory("");
            setDescription("");
            setEmail("");
            setMobile("");
            setShowAddForm(false);
            await fetchOrganizers();
        } catch (error: unknown) {
            console.error("Error adding organizer:", error);
            const axiosError = error as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message || "Failed to add organizer");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDisable = async (id: string, currentStatus: boolean) => {
        setError("");
        try {
            await api.put(`/admin/organizers/${id}`, { isDisabled: !currentStatus });
            setOrganizers(organizers.map(org =>
                org._id === id ? { ...org, isDisabled: !currentStatus } : org
            ));
        } catch (error) {
            console.error("Error toggling organizer status:", error);
            setError("Failed to update organizer status");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            return;
        }
        setError("");
        try {
            await api.delete(`/admin/organizers/${id}`);
            setOrganizers(organizers.filter(org => org._id !== id));
        } catch (error) {
            console.error("Error deleting organizer:", error);
            setError("Failed to delete organizer");
        }
    };

    useEffect(() => {
        fetchOrganizers();
    }, []);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {generatedCredentials && (
                <Card className="border-blue-500">
                    <CardHeader>
                        <CardTitle>Organizer Created Successfully!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="font-semibold">Please save these credentials and share with the organizer:</p>
                            <div className="space-y-1 font-mono text-sm">
                                <p><strong>Email:</strong> {generatedCredentials.email}</p>
                                <p><strong>Password:</strong> {generatedCredentials.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => setGeneratedCredentials(null)} className="mt-4">
                            Close
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Manage Organizers</h1>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? "Cancel" : "Add New Organizer"}
                </Button>
            </div>

            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Organizer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddOrganizer} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Organizer Name *</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Contact Number</Label>
                                <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
                            </div>
                            <p className="text-sm text-gray-500">
                                * A secure password will be auto-generated and displayed after creation
                            </p>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Adding..." : "Add Organizer"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Organizers ({organizers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : organizers.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No organizers found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Name</th>
                                        <th className="text-left p-3">Category</th>
                                        <th className="text-left p-3">Email</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-right p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {organizers.map((organizer) => (
                                        <tr key={organizer._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium">{organizer.name}</td>
                                            <td className="p-3">{organizer.category}</td>
                                            <td className="p-3">{organizer.email}</td>
                                            <td className="p-3">
                                                <Badge variant={organizer.isDisabled ? "destructive" : "default"}>
                                                    {organizer.isDisabled ? "Disabled" : "Active"}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant={organizer.isDisabled ? "default" : "outline"}
                                                    onClick={() => handleToggleDisable(organizer._id, organizer.isDisabled)}
                                                >
                                                    {organizer.isDisabled ? "Enable" : "Disable"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(organizer._id, organizer.name)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
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


