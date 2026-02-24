"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Registration } from "@/lib/definitions";
import api from "@/lib/api";

export default function DashboardPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const response = await api.get("/registrations/my-registrations");
            setRegistrations(response.data);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            setError("Failed to load your registrations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                </div>

                {error && (
                    <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
                )}

                {registrations.length === 0 ? (
                    <p className="text-center text-gray-500">You haven&apos;t registered for any events yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {registrations.map((registration) => (
                            <Card key={registration._id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle>{registration.event.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-2">{registration.event.description}</p>
                                    <p><strong>Status:</strong> {registration.status}</p>
                                    <p><strong>Registered:</strong> {new Date(registration.registrationDate).toLocaleDateString()}</p>
                                    <p><strong>Ticket ID:</strong> <span className="font-mono text-sm">{registration.ticketId}</span></p>
                                    {registration.ticketQrCode && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium mb-2">Ticket QR</p>
                                            <img
                                                src={registration.ticketQrCode}
                                                alt={`QR for ticket ${registration.ticketId}`}
                                                className="h-32 w-32 border rounded"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}