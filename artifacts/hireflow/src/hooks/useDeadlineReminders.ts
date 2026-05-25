import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface Application {
  id: number;
  company: string;
  role: string;
  status: string;
  interviewDate?: string | null;
  offerDeadline?: string | null;
}

const STORAGE_KEY = "hireflow_notified_events";
const CHECK_INTERVAL_MS = 60 * 1000; // check every 60 seconds

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markNotified(key: string) {
  try {
    const set = getNotifiedSet();
    set.add(key);
    // Only keep keys from the last 7 days to prevent unbounded growth
    const today = new Date().toDateString();
    const cleaned = [...set].filter(k => k.includes(today) || !k.match(/^\d/));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore storage errors
  }
}

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) +
    " at " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fireNotification(title: string, body: string, icon?: string) {
  if (typeof window === "undefined") return;

  // In-app toast always fires
  toast(title, {
    description: body,
    duration: 10000,
    action: { label: "View", onClick: () => window.location.href = "/tracker" },
  });

  // Browser notification if permission granted
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: icon ?? "/favicon.ico",
        badge: "/favicon.ico",
        tag: title, // prevents duplicate system notifications
        requireInteraction: true,
      });
    } catch {
      // some browsers block in certain contexts
    }
  }
}

async function requestPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function useDeadlineReminders(applications: Application[]) {
  const appsRef = useRef(applications);
  appsRef.current = applications;

  useEffect(() => {
    // Request permission once on mount
    requestPermission();

    function checkReminders() {
      const apps = appsRef.current;
      const notified = getNotifiedSet();

      apps.forEach((app) => {
        // --- INTERVIEW DATE REMINDER ---
        if (app.interviewDate) {
          const days = getDaysUntil(app.interviewDate);

          // 24-hour reminder
          const key24 = `interview-24h-${app.id}-${new Date(app.interviewDate).toDateString()}`;
          if (days === 1 && !notified.has(key24)) {
            fireNotification(
              `🗓 Interview Tomorrow: ${app.company}`,
              `Your ${app.role} interview is ${formatDateShort(app.interviewDate)}. Time to finalize your prep!`
            );
            markNotified(key24);
          }

          // Day-of reminder
          const key0 = `interview-today-${app.id}-${new Date(app.interviewDate).toDateString()}`;
          if (days === 0 && !notified.has(key0)) {
            fireNotification(
              `🔴 Interview TODAY: ${app.company}`,
              `Your ${app.role} interview is at ${formatDateShort(app.interviewDate)}. Good luck!`
            );
            markNotified(key0);
          }

          // 3-day heads-up
          const key3 = `interview-3d-${app.id}-${new Date(app.interviewDate).toDateString()}`;
          if (days === 3 && !notified.has(key3)) {
            fireNotification(
              `📅 Interview in 3 Days: ${app.company}`,
              `${app.role} interview on ${formatDateShort(app.interviewDate)}. Start your prep now.`
            );
            markNotified(key3);
          }
        }

        // --- OFFER DEADLINE REMINDER ---
        if (app.offerDeadline) {
          const days = getDaysUntil(app.offerDeadline);

          // 48-hour warning
          const key48 = `deadline-48h-${app.id}-${new Date(app.offerDeadline).toDateString()}`;
          if (days === 2 && !notified.has(key48)) {
            fireNotification(
              `⏰ Offer Deadline in 2 Days: ${app.company}`,
              `You must accept or decline the ${app.role} offer by ${formatDateShort(app.offerDeadline)}.`
            );
            markNotified(key48);
          }

          // 24-hour final warning
          const key24d = `deadline-24h-${app.id}-${new Date(app.offerDeadline).toDateString()}`;
          if (days === 1 && !notified.has(key24d)) {
            fireNotification(
              `🚨 Offer Expires Tomorrow: ${app.company}`,
              `Final day to decide on your ${app.role} offer at ${app.company}. Deadline: ${formatDateShort(app.offerDeadline)}.`
            );
            markNotified(key24d);
          }

          // Day-of final warning
          const key0d = `deadline-today-${app.id}-${new Date(app.offerDeadline).toDateString()}`;
          if (days === 0 && !notified.has(key0d)) {
            fireNotification(
              `🔴 Offer Expires TODAY: ${app.company}`,
              `Last chance! Your ${app.role} offer at ${app.company} expires today.`
            );
            markNotified(key0d);
          }
        }
      });
    }

    // Run immediately on load, then on interval
    checkReminders();
    const timer = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []); // only runs once — uses ref to always read latest apps
}