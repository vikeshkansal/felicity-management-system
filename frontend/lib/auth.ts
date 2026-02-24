import { UserSession } from "./definitions";

export const loginUser = (token: string, user: UserSession) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    window.dispatchEvent(new Event("storage"));
  }
};

export const getLoginRedirectPath = (user: UserSession): string => {
  if (user.role === "admin") return "/admin/dashboard";
  if (user.role === "organizer") return "/organizer/dashboard";
  if (user.role === "participant") {
    if (!user.onboardingCompleted) {
      return "/onboarding";
    }
    return "/dashboard";
  }

  return "/dashboard";
};

export const getUser = (): UserSession | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined" || userStr === "null") {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from local storage", error);
      return null;
    }
  }
  return null;
};

export const logoutUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    if (localStorage.getItem("user")) {
      localStorage.removeItem("user");
    }
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/auth/login";
  }
};