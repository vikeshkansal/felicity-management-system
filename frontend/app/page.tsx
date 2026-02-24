import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">

      <Card className="w-full max-w-md shadow-lg">

        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Felicity 2026</CardTitle>
          <CardDescription>Event Management System</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          <Card className="hover:border-blue-500 transition-colors cursor-default">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Student / Participant</CardTitle>
              <CardDescription>Register for events & join teams</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href="/auth/login">
                <Button className="w-full" variant="default">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="w-full" variant="secondary">Register</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-500 transition-colors cursor-default">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Club Organizer</CardTitle>
              <CardDescription>Manage events & track sales</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login">
                <Button className="w-full" variant="default">
                  Login
                </Button>
              </Link>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}