import { Users, Calendar, Star, User, Clock, CheckCircle, TrendingUp, Activity, Phone, MessageSquare } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { formatTime } from "@/lib/utils"

import { unstable_cache } from "next/cache";
const getCachedDashboardStats = unstable_cache(
  async (doctorId: string, practitionerId?: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const appointmentWhere = practitionerId
      ? { doctorId, practitionerId }
      : { doctorId };

    const [
      totalPatients,
      todayAppointments,
      totalReviews,
      upcomingAppointments,
      patientsThisWeekList,
      appointmentsThisWeek,
      completedThisWeek,
      gbpAccount,
      recentReviews,
      reviewsThisWeekList,
    ] = await Promise.all([
      prisma.patient.count({ where: { doctorId, ...(practitionerId ? { primaryPractitionerId: practitionerId } : {}) } }),
      prisma.appointment.count({ where: { ...appointmentWhere, date: { gte: today, lt: tomorrow } } }),
      prisma.review.count({ where: { doctorId } }),
      prisma.appointment.findMany({
        where: { ...appointmentWhere, date: { gte: today, lt: tomorrow }, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
        include: { patient: { select: { firstName: true, lastName: true } } },
        orderBy: { startTime: "asc" },
        take: 6,
      }),
      prisma.patient.findMany({ 
        where: { doctorId, createdAt: { gte: weekAgo }, ...(practitionerId ? { primaryPractitionerId: practitionerId } : {}) },
        select: { createdAt: true }
      }),
      prisma.appointment.findMany({
        where: { ...appointmentWhere, date: { gte: weekAgo } },
        orderBy: { date: "asc" },
      }),
      prisma.appointment.count({
        where: { ...appointmentWhere, date: { gte: weekAgo }, status: "COMPLETED" },
      }),
      prisma.gbpAccount.findFirst({
        where: { doctorId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.findMany({
        where: { doctorId, source: "GOOGLE" },
        orderBy: { reviewDate: "desc" },
        take: 4,
      }),
      prisma.review.findMany({
        where: { doctorId, reviewDate: { gte: weekAgo } },
        select: { reviewDate: true }
      }),
    ])

    return {
      totalPatients,
      todayAppointments,
      totalReviews,
      upcomingAppointments,
      newPatientsThisWeek: patientsThisWeekList.length,
      patientsThisWeekList,
      appointmentsThisWeek,
      completedThisWeek,
      gbpAccount,
      recentReviews,
      reviewsThisWeekList,
    }
  },
  ["dashboard-stats"],
  { revalidate: 60 } // Cache for 60 seconds
)

async function getDashboardStats(doctorId: string, practitionerId?: string) {
  return getCachedDashboardStats(doctorId, practitionerId);
}

function MiniSparkline({ color, values }: { color: string; values: number[] }) {
  const max = Math.max(...values, 1)
  const w = 80
  const h = 30
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function WeeklyBarChart({ data }: { data: any[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const counts = days.map((_, di) => {
    const dayDate = new Date()
    dayDate.setDate(dayDate.getDate() - (6 - di))
    return data.filter((apt) => {
      const d = new Date(apt.date)
      return d.toDateString() === dayDate.toDateString()
    }).length
  })
  const max = Math.max(...counts, 1)

  return (
    <div className="flex items-end gap-1.5 h-32 mt-2">
      {days.map((day, i) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: 100 }}>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(4, (counts[i] / max) * 100)}%`,
                background: counts[i] > 0
                  ? "linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)"
                  : "#e5e7eb",
              }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{day}</span>
        </div>
      ))}
    </div>
  )
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function avatarColor(name: string) {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-pink-500", "bg-amber-500", "bg-indigo-500"]
  return colors[name.charCodeAt(0) % colors.length]
}

export default async function DashboardPage(props: { searchParams?: Promise<{ practitionerId?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth()
  const doctorId = session?.user?.id as string
  const doctorName = session?.user?.name || "Doctor"
  
  const stats = await getDashboardStats(doctorId, searchParams?.practitionerId === "all" ? undefined : searchParams?.practitionerId)

  const gbpInsights = (stats.gbpAccount?.insightsData as any) || {}
  const avgRating = gbpInsights.rating ? Number(gbpInsights.rating).toFixed(1) : null
  const totalRatings = gbpInsights.user_ratings_total || stats.totalReviews

  // Build 7-day sparkline values
  const sparkData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return stats.appointmentsThisWeek.filter((apt) =>
      new Date(apt.date).toDateString() === d.toDateString()
    ).length
  })

  // Total Patients Sparkline (Cumulative over 7 days)
  let patientsBeforeWeek = stats.totalPatients - stats.newPatientsThisWeek;
  const totalPatientsSpark = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const addedThatDay = stats.patientsThisWeekList.filter(p => new Date(p.createdAt).toDateString() === d.toDateString()).length;
    patientsBeforeWeek += addedThatDay;
    return patientsBeforeWeek;
  });

  // New Patients Sparkline (Added per day over 7 days)
  const newPatientsSpark = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return stats.patientsThisWeekList.filter(p => new Date(p.createdAt).toDateString() === d.toDateString()).length;
  });

  // Google Reviews Sparkline (Cumulative over 7 days)
  let reviewsBeforeWeek = totalRatings - stats.reviewsThisWeekList.length;
  const reviewsSpark = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const addedThatDay = stats.reviewsThisWeekList.filter(r => new Date(r.reviewDate).toDateString() === d.toDateString()).length;
    reviewsBeforeWeek += addedThatDay;
    return reviewsBeforeWeek;
  });

  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      sub: `+${stats.newPatientsThisWeek} this week`,
      icon: Users,
      color: "#6366f1",
      bg: "bg-violet-50",
      iconBg: "bg-violet-100",
      href: "/patients",
      spark: totalPatientsSpark,
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      sub: `${stats.completedThisWeek} completed this week`,
      icon: Calendar,
      color: "#0ea5e9",
      bg: "bg-sky-50",
      iconBg: "bg-sky-100",
      href: "/appointments",
      spark: sparkData,
    },
    {
      title: "New Patients (7d)",
      value: stats.newPatientsThisWeek,
      sub: "Registered this week",
      icon: User,
      color: "#10b981",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      href: "/patients",
      spark: newPatientsSpark,
    },
    {
      title: "Google Reviews",
      value: totalRatings,
      sub: avgRating ? `★ ${avgRating} avg rating` : "Connect GBP to see rating",
      icon: Star,
      color: "#f59e0b",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      href: "/gbp",
      spark: reviewsSpark,
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.iconBg} p-2.5 rounded-xl`}>
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xs text-gray-500">{card.sub}</p>
                <MiniSparkline color={card.color} values={card.spark} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── CHART + TODAY'S APPOINTMENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Weekly bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Appointment Trends</h3>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs font-semibold text-violet-600">{stats.appointmentsThisWeek.length} appts</span>
            </div>
          </div>
          <WeeklyBarChart data={stats.appointmentsThisWeek} />
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Today's Schedule</h3>
            <Link href="/appointments" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>

          {stats.upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No appointments today</p>
              <Link href="/appointments" className="text-xs text-indigo-600 hover:underline mt-1">
                + Schedule one
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(apt.patient.firstName)}`}>
                    {getInitials(`${apt.patient.firstName} ${apt.patient.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTime(apt.startTime)} — {formatTime(apt.endTime)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    apt.status === "CHECKED_IN" ? "text-sky-600 bg-sky-50" : "text-indigo-600 bg-indigo-50"
                  }`}>
                    {apt.status === "CHECKED_IN" ? "Checked In" : "Confirmed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT REVIEWS + QUICK LINKS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Google Reviews</h3>
            <Link href="/gbp" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>

          {stats.recentReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-center">
              <MessageSquare className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No reviews yet.</p>
              <Link href="/gbp" className="text-xs text-indigo-600 hover:underline mt-1">Connect Google Profile</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentReviews.map((review) => (
                <div key={review.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(review.reviewerName)}`}>
                    {getInitials(review.reviewerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{review.reviewerName}</p>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{review.comment}</p>
                    )}
                    <div className="mt-1">
                      {review.responded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="h-2.5 w-2.5" /> Replied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          Needs Reply
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions / Links */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Book Appointment", href: "/appointments", icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Add Patient", href: "/patients", icon: User, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "View GBP Profile", href: "/gbp", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "WhatsApp Inbox", href: "/whatsapp", icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
                { label: "Reports", href: "/reports", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className={`${action.bg} p-2 rounded-lg`}>
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <span className="ml-auto text-gray-300 group-hover:text-gray-400 text-xs">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}