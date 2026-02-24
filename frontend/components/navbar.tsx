"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { getUser, logoutUser } from "@/lib/auth";
import { UserSession } from "@/lib/definitions";

export default function Navbar() {
    const [user, setUser] = useState<UserSession | null>(() => getUser());

    useEffect(() => {
        const handleStorageChange = () => {
            setUser(getUser());
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    if (!user) {
        return null;
    }

    return (
        <nav className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="text-xl font-bold">
                        Felicity
                    </Link>

                    {user.role === "participant" && (
                        <>
                            <Link href="/dashboard">Dashboard</Link>
                            <Link href="/events">Browse Events</Link>
                            <Link href="/organizers">Clubs</Link>
                            <Link href="/profile">Profile</Link>
                        </>
                    )}

                    {user.role === "organizer" && (
                        <>
                            <Link href="/organizer/dashboard">Dashboard</Link>
                            <Link href="/organizer/events/create">Create Event</Link>
                            <Link href="/organizer/profile">Profile</Link>
                        </>
                    )}

                    {user.role === "admin" && (
                        <>
                            <Link href="/admin/dashboard">Dashboard</Link>
                            <Link href="/admin/organizers">Manage Clubs/Organizers</Link>
                        </>
                    )}

                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 hidden md:inline-block">
                        {user.email || "User"}
                    </span>
                    <Button
                        onClick={() => logoutUser()}
                        variant="outline"
                        size="sm"
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </nav>
    );
}