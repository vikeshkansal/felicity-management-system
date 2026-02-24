"use client";

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AxiosError } from "axios";
import Link from "next/link";

type RegisterFormData = {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    orgName: string;
    password: string;
    participantType: string;
};

type ApiErrorResponse = {
    message?: string;
};

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<RegisterFormData>({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        orgName: "IIIT Hyderabad",
        password: "",
        participantType: "IIIT-H"
    });

    const formFields: Array<{ name: keyof RegisterFormData; label: string; type: string; placeholder: string }> = [
        { name: "firstName", label: "First Name", type: "text", placeholder: "John" },
        { name: "lastName", label: "Last Name", type: "text", placeholder: "Doe" },
        { name: "email", label: "Email", type: "email", placeholder: "john@example.com" },
        { name: "mobile", label: "Mobile Number", type: "tel", placeholder: "9876543210" },
        { name: "orgName", label: "Organization / College", type: "text", placeholder: "IIIT Hyderabad" },
        { name: "password", label: "Password", type: "password", placeholder: "******" },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/auth/register", formData);
            router.push("/auth/login");
        } catch (err: unknown) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            const msg = axiosError.response?.data?.message || "Registration failed.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <Link href="/" className="block">
                            <Button type="button" variant="outline" className="w-full">
                                Back to Home
                            </Button>
                        </Link>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formFields.map((field) => {
                                const isDisabled = field.name === "orgName" && formData.participantType === "IIIT-H";
                                return (
                                    <div key={field.name} className="space-y-2">
                                        <Label htmlFor={field.name}>{field.label}</Label>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            disabled={isDisabled}
                                            required
                                            className={isDisabled ? "bg-gray-100" : ""}
                                        />
                                    </div>
                                )
                            }
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Participant Type</Label>
                            <Select
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        participantType: value,
                                        orgName: value === "IIIT-H" ? "IIIT Hyderabad" : ""
                                    }));
                                }}
                                defaultValue={formData.participantType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IIIT-H">IIIT-H</SelectItem>
                                    <SelectItem value="External">External</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating Account..." : "Register"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}