"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Request desktop notification permission on first user engagement
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const loadNotifications = () => {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Check for new critical unread notifications (e.g. WhatsApp Disconnected)
            const criticalUnread = data.filter(
              (n) => !n.isRead && (n.title?.includes("WhatsApp") || n.type === "ERROR")
            );

            if (
              criticalUnread.length > 0 &&
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const latest = criticalUnread[0];
              const storageKey = `gyrex_notif_seen_${latest.id}`;
              if (!sessionStorage.getItem(storageKey)) {
                sessionStorage.setItem(storageKey, "true");
                new Notification(latest.title, {
                  body: latest.message,
                  icon: "/favicon.ico",
                });
              }
            }

            setNotifications(data);
          }
        })
        .catch(console.error);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read in DB
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleAction = (url: string) => {
    setIsOpen(false);
    if (url.startsWith("http")) window.location.href = url;
    else router.push(url);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-100 transition-colors"
      >
        <Bell className="h-4 w-4 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                <div key={n.id} className={`p-4 ${n.isRead ? 'opacity-70' : 'bg-blue-50/50'}`}>
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{n.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                    {n.actionUrl && (
                      <button 
                        onClick={() => handleAction(n.actionUrl)}
                        className="text-xs text-blue-600 font-medium mt-2 hover:underline"
                      >
                        Take Action
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
