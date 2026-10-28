import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash, compare } from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if user is a StaffMember
    const staffMember = await prisma.staffMember.findUnique({
      where: { id: session.user.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            clinicName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            image: true,
            currency: true,
            isCurrencyLocked: true,
            invoicePrefix: true,
            taxGstNumber: true,
            invoiceFooter: true,
            language: true,
            dateFormat: true,
            firstDayOfWeek: true,
            timezone: true,
            workingHoursStart: true,
            workingHoursEnd: true,
            daysOff: true,
            package: { select: { name: true } },
            subscriptionStatus: true,
          },
        },
      },
    });

    if (staffMember) {
      const clinic = staffMember.doctor;
      return NextResponse.json({
        isStaff: true,
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone || "",
        role: staffMember.role,
        clinicName: clinic?.clinicName || "",
        doctorName: clinic?.name || "",
        // Clinic metadata fields to support clinic settings tabs for managers/staff
        address: clinic?.address || "",
        city: clinic?.city || "",
        state: clinic?.state || "",
        country: clinic?.country || "India",
        pincode: clinic?.pincode || "",
        image: clinic?.image || "",
        currency: clinic?.currency || "INR",
        isCurrencyLocked: clinic?.isCurrencyLocked || false,
        invoicePrefix: clinic?.invoicePrefix || "INV-",
        taxGstNumber: clinic?.taxGstNumber || "",
        invoiceFooter: clinic?.invoiceFooter || "",
        language: clinic?.language || "en",
        dateFormat: clinic?.dateFormat || "DD/MM/YYYY",
        firstDayOfWeek: clinic?.firstDayOfWeek ?? 1,
        timezone: clinic?.timezone || "Asia/Kolkata",
        workingHoursStart: clinic?.workingHoursStart || "09:00",
        workingHoursEnd: clinic?.workingHoursEnd || "17:00",
        daysOff: Array.isArray(clinic?.daysOff) ? clinic.daysOff : [],
        subscriptionStatus: clinic?.subscriptionStatus,
        subscriptionPlan: clinic?.package?.name || "FREE",
      });
    }

    // 2. User is a Doctor / Clinic Account Owner
    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        clinicName: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        image: true,
        currency: true,
        isCurrencyLocked: true,
        role: true,
        invoicePrefix: true,
        taxGstNumber: true,
        invoiceFooter: true,
        language: true,
        dateFormat: true,
        firstDayOfWeek: true,
        timezone: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        daysOff: true,
        createdAt: true,
        package: { select: { name: true } },
        subscriptionStatus: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const response = {
      isStaff: false,
      ...doctor,
      subscriptionPlan: doctor.package?.name || "FREE",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Check if user is a StaffMember
    const staffMember = await prisma.staffMember.findUnique({
      where: { id: session.user.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            clinicName: true,
          },
        },
      },
    });

    if (staffMember) {
      // Prevent privilege escalation: staff cannot alter their role
      if (body.role !== undefined && body.role !== staffMember.role) {
        return NextResponse.json(
          { error: "Forbidden: Staff members cannot alter their own access level or role." },
          { status: 403 }
        );
      }

      const {
        name,
        phone,
        currentPassword,
        newPassword,
        clinicName,
        address,
        city,
        state,
        country,
        pincode,
        image,
        invoicePrefix,
        taxGstNumber,
        invoiceFooter,
        language,
        dateFormat,
        firstDayOfWeek,
        timezone,
        workingHoursStart,
        workingHoursEnd,
        daysOff,
      } = body;

      // Handle staff password change
      if (newPassword && currentPassword) {
        const isValid = await compare(currentPassword, staffMember.password);
        if (!isValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }

        if (newPassword.length < 8) {
          return NextResponse.json(
            { error: "New password must be at least 8 characters" },
            { status: 400 }
          );
        }

        const hashedPassword = await hash(newPassword, 12);
        await prisma.staffMember.update({
          where: { id: staffMember.id },
          data: { password: hashedPassword },
        });
      }

      // Handle staff individual profile update
      const staffUpdateData: any = {};
      if (typeof name === "string" && name.trim()) {
        staffUpdateData.name = name.trim();
      }
      if (typeof phone === "string") {
        staffUpdateData.phone = phone.trim();
      }

      let updatedStaff = staffMember;
      if (Object.keys(staffUpdateData).length > 0) {
        updatedStaff = await prisma.staffMember.update({
          where: { id: staffMember.id },
          data: staffUpdateData,
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                clinicName: true,
              },
            },
          },
        });
      }

      // If MANAGER or ADMIN is updating clinic workspace details
      const canManageClinic = staffMember.role === "MANAGER" || staffMember.role === "ADMIN";
      if (canManageClinic && (clinicName || address || city || state || pincode || timezone || workingHoursStart || daysOff || invoicePrefix)) {
        const clinicUpdateData: any = {};
        if (clinicName) clinicUpdateData.clinicName = clinicName;
        if (address !== undefined) clinicUpdateData.address = address;
        if (city !== undefined) clinicUpdateData.city = city;
        if (state !== undefined) clinicUpdateData.state = state;
        if (country !== undefined) clinicUpdateData.country = country;
        if (pincode !== undefined) clinicUpdateData.pincode = pincode;
        if (image !== undefined) clinicUpdateData.image = image;
        if (invoicePrefix !== undefined) clinicUpdateData.invoicePrefix = invoicePrefix;
        if (taxGstNumber !== undefined) clinicUpdateData.taxGstNumber = taxGstNumber;
        if (invoiceFooter !== undefined) clinicUpdateData.invoiceFooter = invoiceFooter;
        if (language !== undefined) clinicUpdateData.language = language;
        if (dateFormat !== undefined) clinicUpdateData.dateFormat = dateFormat;
        if (firstDayOfWeek !== undefined) {
          clinicUpdateData.firstDayOfWeek = firstDayOfWeek === "Sunday" ? 0 : (firstDayOfWeek === "Monday" ? 1 : Number(firstDayOfWeek) || 0);
        }
        if (timezone !== undefined) clinicUpdateData.timezone = timezone;
        if (workingHoursStart !== undefined) clinicUpdateData.workingHoursStart = workingHoursStart;
        if (workingHoursEnd !== undefined) clinicUpdateData.workingHoursEnd = workingHoursEnd;
        if (daysOff !== undefined) clinicUpdateData.daysOff = daysOff;

        if (Object.keys(clinicUpdateData).length > 0) {
          await prisma.doctor.update({
            where: { id: staffMember.doctorId },
            data: clinicUpdateData,
          });
        }
      }

      return NextResponse.json({
        isStaff: true,
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        phone: updatedStaff.phone || "",
        role: updatedStaff.role,
        clinicName: updatedStaff.doctor?.clinicName || "",
        doctorName: updatedStaff.doctor?.name || "",
      });
    }

    // 2. User is a Doctor / Clinic Account Owner
    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, currency: true, isCurrencyLocked: true, role: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Prevent privilege escalation: doctors cannot escalate to ADMIN or SUPERADMIN
    if (body.role !== undefined && body.role !== doctor.role) {
      return NextResponse.json(
        { error: "Forbidden: Doctors cannot escalate or alter their account role." },
        { status: 403 }
      );
    }

    const {
      name,
      phone,
      specialty,
      clinicName,
      address,
      city,
      state,
      country,
      pincode,
      image,
      currentPassword,
      newPassword,
      currency,
      invoicePrefix,
      taxGstNumber,
      invoiceFooter,
      language,
      dateFormat,
      firstDayOfWeek,
      timezone,
      workingHoursStart,
      workingHoursEnd,
      daysOff,
    } = body;

    const updateData: any = {
      name,
      phone,
      specialty,
      clinicName,
      address,
      city,
      state,
      country,
      pincode,
      image,
      invoicePrefix,
      taxGstNumber,
      invoiceFooter,
      language,
      dateFormat,
      firstDayOfWeek: firstDayOfWeek === "Sunday" ? 0 : (firstDayOfWeek === "Monday" ? 1 : Number(firstDayOfWeek) || 0),
      timezone,
      workingHoursStart,
      workingHoursEnd,
      daysOff,
    };

    // Currency locking logic
    const isAdmin = doctor.role === "ADMIN" || doctor.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";

    if (currency) {
      if (doctor.isCurrencyLocked && !isAdmin) {
        // If locked and user is not admin, keep existing currency
        updateData.currency = doctor.currency;
      } else {
        // Allow update and lock if set for the first time
        updateData.currency = currency;
        if (!isAdmin) {
          updateData.isCurrencyLocked = true;
        }
      }
    }

    // Handle password change for Doctor
    if (newPassword && currentPassword) {
      const isValid = await compare(currentPassword, doctor.password);

      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.password = await hash(newPassword, 12);
    }

    // Auto-sync clinic website phone and WhatsApp number if phone changed
    if (phone) {
      try {
        await prisma.clinicWebsite.updateMany({
          where: { doctorId: session.user.id },
          data: {
            whatsappNumber: phone,
            contactPhone: phone,
          },
        });
      } catch (e) {
        console.error("Failed to auto-sync website phone:", e);
      }
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        clinicName: true,
        address: true,
        city: true,
        state: true,
        country: true,
        image: true,
        currency: true,
        isCurrencyLocked: true,
      },
    });

    // Auto-sync owner practitioner specialty if specialty was updated
    if (specialty) {
      await prisma.practitioner.updateMany({
        where: { doctorId: session.user.id, isOwner: true },
        data: { specialty },
      }).catch((err) => console.error("Failed to sync owner practitioner specialty:", err));
    }

    return NextResponse.json({
      isStaff: false,
      ...updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}